import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { refreshAfterServerAction } from "@shared/lib/serverActions";
import type {
  DuelEndData,
  DuelLastResult,
  DuelQuestion,
  DuelScreen,
  PendingChallenge,
} from "@shared/types/duels";

const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string)
  .replace(/^https/, "wss")
  .replace(/^http/, "ws")
  .replace(/\/$/, "");

/** Sous-protocole d'authentification confirmé par le serveur. */
const WS_AUTH_PROTOCOL = "milo.auth";

/**
 * Ouvre une WebSocket authentifiée par sous-protocole : le jeton voyage dans
 * l'en-tête Sec-WebSocket-Protocol, jamais dans l'URL (qui finit dans les
 * journaux du serveur). `path` ne doit contenir aucun jeton.
 */
const openAuthenticatedSocket = (path: string, accessToken: string) =>
  new WebSocket(`${WS_BASE_URL}${path}`, [WS_AUTH_PROTOCOL, accessToken]);

interface DuelContextValue {
  screen: DuelScreen;
  pendingChallenge: PendingChallenge | null;
  currentQuestion: DuelQuestion | null;
  myIdx: number | null;
  lastResult: DuelLastResult | null;
  endData: DuelEndData | null;
  lobbyStatus: string;
  waitingMessage: string;
  answered: boolean;

  startMatchmaking: () => void;
  sendChallengeToUserId: (userId: number) => Promise<void>;
  sendChallengeByUsername: (username: string) => Promise<void>;
  acceptChallenge: () => Promise<void>;
  declineChallenge: () => Promise<void>;
  sendAnswer: (answerIdx: number) => void;
  goToLobby: () => void;
  setLobbyStatus: (msg: string) => void;
}

const DuelContext = createContext<DuelContextValue | null>(null);

export const useDuel = () => {
  const ctx = useContext(DuelContext);
  if (!ctx) throw new Error("useDuel must be used within DuelProvider");
  return ctx;
};

export const DuelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  // Booléen plutôt que le token : une rotation d'access token ne doit pas
  // fermer les WebSockets (et couper un duel en cours).
  const hasSession = useAuthStore((state) => Boolean(state.accessToken));

  const [screen, setScreen] = useState<DuelScreen>("lobby");
  const [pendingChallenge, setPendingChallenge] =
    useState<PendingChallenge | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DuelQuestion | null>(
    null
  );
  const [myIdx, setMyIdx] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<DuelLastResult | null>(null);
  const [endData, setEndData] = useState<DuelEndData | null>(null);
  const [lobbyStatus, setLobbyStatus] = useState("");
  const [waitingMessage, setWaitingMessage] = useState(
    "En attente d'un adversaire..."
  );
  const [answered, setAnswered] = useState(false);

  const notifWsRef = useRef<WebSocket | null>(null);
  const duelWsRef = useRef<WebSocket | null>(null);
  const myAnswerRef = useRef<number | null>(null);
  const currentQuestionRef = useRef<DuelQuestion | null>(null);
  const answeredRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(2000);
  // Une seule tentative de refresh + réouverture par duel après un 4001
  const duelAuthRetryRef = useRef(false);
  // La connexion est asynchrone (token frais) : ces refs évitent d'ouvrir
  // deux sockets quand l'effet est relancé pendant l'attente (StrictMode, login).
  const sessionActiveRef = useRef(false);
  const notifConnectingRef = useRef(false);

  // ── Duel WS ──────────────────────────────────────────────────────────────

  const handleDuelMessage = useCallback((msg: Record<string, any>) => {
    if (msg.type === "joined") {
      duelAuthRetryRef.current = false;
      setMyIdx(msg.player_idx);
    } else if (msg.type === "error") {
      setScreen("lobby");
      setLobbyStatus("Erreur : " + msg.message);
    } else if (msg.type === "question") {
      myAnswerRef.current = null;
      answeredRef.current = false;
      setAnswered(false);
      setLastResult(null);
      const q: DuelQuestion = {
        number: msg.number,
        question: msg.question,
        choices: msg.choices,
        time_limit: msg.time_limit,
      };
      currentQuestionRef.current = q;
      setCurrentQuestion(q);
      setScreen("game");
    } else if (msg.type === "result") {
      setLastResult({
        good_answer: msg.good_answer,
        my_answer: myAnswerRef.current,
        scores: msg.scores,
      });
    } else if (msg.type === "end") {
      setEndData({ scores: msg.scores, winner: msg.winner });
      setScreen("end");
      duelWsRef.current?.close();
      duelWsRef.current = null;
      // Le back fait avancer missions, XP, coins et streak après un duel
      refreshAfterServerAction();
    } else if (msg.type === "opponent_disconnected") {
      setScreen("lobby");
      setLobbyStatus("⚠️ Ton adversaire s'est déconnecté.");
      duelWsRef.current?.close();
      duelWsRef.current = null;
    }
  }, []);

  const connectDuelWS = useCallback(
    async (roomId?: string | null) => {
      duelWsRef.current?.close();
      // Le cookie ne s'applique pas aux WebSockets : toujours un access token frais (30 min)
      const token = await useAuthStore.getState().ensureFreshAccessToken();
      if (!token) {
        setScreen("lobby");
        setLobbyStatus("Session expirée, reconnecte-toi.");
        return;
      }
      // room_id reste un paramètre d'URL ; le jeton passe par le sous-protocole
      const path = roomId
        ? `/ws/find_duel/?room_id=${encodeURIComponent(roomId)}`
        : "/ws/find_duel/";
      const ws = openAuthenticatedSocket(path, token);
      duelWsRef.current = ws;
      ws.onmessage = (e) => handleDuelMessage(JSON.parse(e.data));
      ws.onclose = (e) => {
        if (e.code !== 4001) return;
        if (duelWsRef.current !== ws) return; // fermé volontairement, remplacé
        if (duelAuthRetryRef.current) {
          setScreen("lobby");
          setLobbyStatus("Session expirée, reconnecte-toi.");
          return;
        }
        // Token refusé : refresh puis réouverture, une seule fois
        duelAuthRetryRef.current = true;
        useAuthStore
          .getState()
          .refreshAccessToken()
          .then((fresh) => {
            if (fresh) {
              void connectDuelWS(roomId);
            } else {
              setScreen("lobby");
              setLobbyStatus("Session expirée, reconnecte-toi.");
            }
          });
      };
    },
    [handleDuelMessage]
  );

  // ── Notification WS ───────────────────────────────────────────────────────

  const connectNotifWS = useCallback(async () => {
    if (
      notifConnectingRef.current ||
      notifWsRef.current?.readyState === WebSocket.OPEN ||
      notifWsRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    if (!useAuthStore.getState().accessToken) return;
    notifConnectingRef.current = true;
    let token: string | null = null;
    try {
      // Access token frais (le cookie ne s'applique pas aux WebSockets)
      token = await useAuthStore.getState().ensureFreshAccessToken();
    } finally {
      notifConnectingRef.current = false;
    }
    // Pendant l'attente, la session a pu être fermée ou l'effet relancé
    if (!token || !sessionActiveRef.current) return;
    if (
      notifWsRef.current?.readyState === WebSocket.OPEN ||
      notifWsRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    const ws = openAuthenticatedSocket("/ws/notifications/", token);
    notifWsRef.current = ws;

    ws.onmessage = (e) => {
      const msg: Record<string, any> = JSON.parse(e.data);
      if (msg.type === "challenge_received") {
        setPendingChallenge({
          challenge_id: msg.challenge_id,
          from_username: msg.from_username,
          expires_in: msg.expires_in,
        });
      } else if (msg.type === "challenge_accepted") {
        setPendingChallenge(null);
        setLobbyStatus(`✅ ${msg.by_username} a accepté ! Connexion...`);
        void connectDuelWS(msg.room_id);
        setWaitingMessage("Défi accepté, démarrage...");
        setScreen("waiting");
        navigate("/duels");
      } else if (msg.type === "challenge_declined") {
        setPendingChallenge(null);
        setLobbyStatus(`❌ ${msg.by_username} a refusé ton défi.`);
      } else if (msg.type === "challenge_expired") {
        setPendingChallenge(null);
        setLobbyStatus("⏰ Le défi a expiré.");
      }
    };

    ws.onopen = () => {
      reconnectDelayRef.current = 2000;
    };

    ws.onclose = (e) => {
      if (notifWsRef.current !== ws) return; // fermé volontairement (logout, démontage)
      if (!useAuthStore.getState().accessToken) return;

      const scheduleReconnect = () => {
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, 30000);
        reconnectTimeoutRef.current = setTimeout(() => void connectNotifWS(), delay);
      };

      if (e.code === 4001) {
        // Token refusé : refresh d'abord, puis reconnexion avec le nouveau token
        useAuthStore
          .getState()
          .refreshAccessToken()
          .then((fresh) => {
            if (fresh) scheduleReconnect();
          });
        return;
      }
      scheduleReconnect();
    };
  }, [connectDuelWS, navigate]);

  useEffect(() => {
    sessionActiveRef.current = hasSession;
    if (hasSession) {
      void connectNotifWS();
      checkPendingChallenges();
    } else {
      const notifWs = notifWsRef.current;
      const duelWs = duelWsRef.current;
      notifWsRef.current = null;
      duelWsRef.current = null;
      notifWs?.close();
      duelWs?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    }
    return () => {
      sessionActiveRef.current = false;
      const notifWs = notifWsRef.current;
      const duelWs = duelWsRef.current;
      notifWsRef.current = null;
      duelWsRef.current = null;
      notifWs?.close();
      duelWs?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [hasSession, connectNotifWS]);

  const checkPendingChallenges = async () => {
    try {
      const r = await APIAxios.get(APIRoutes.GET_PendingChallenges);
      const challenges: any[] = r.data;
      if (challenges.length > 0) {
        const c = challenges[challenges.length - 1];
        setPendingChallenge({
          challenge_id: c.challenge_id,
          from_username: c.from_username,
          expires_in: 60,
        });
      }
    } catch {
      // silencieux
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const startMatchmaking = useCallback(() => {
    setWaitingMessage("En attente d'un adversaire...");
    setScreen("waiting");
    navigate("/duels");
    void connectDuelWS(null);
  }, [connectDuelWS, navigate]);

  const sendChallengeToUserId = useCallback(async (userId: number) => {
    await APIAxios.post(APIRoutes.POST_Challenge(userId));
    setLobbyStatus("⏳ Défi envoyé, en attente de réponse...");
  }, []);

  const sendChallengeByUsername = useCallback(async (username: string) => {
    setLobbyStatus("");
    const r = await APIAxios.get(APIRoutes.GET_User_By_Username(username));
    const target = r.data;
    await APIAxios.post(APIRoutes.POST_Challenge(target.id));
    setLobbyStatus(`⏳ Défi envoyé à ${username}, en attente de réponse...`);
  }, []);

  const acceptChallenge = useCallback(async () => {
    if (!pendingChallenge) return;
    const cid = pendingChallenge.challenge_id;
    setPendingChallenge(null);
    const r = await APIAxios.post(APIRoutes.POST_AcceptChallenge(cid));
    const { room_id } = r.data;
    void connectDuelWS(room_id);
    setWaitingMessage("Défi accepté, connexion...");
    setScreen("waiting");
    navigate("/duels");
  }, [pendingChallenge, connectDuelWS, navigate]);

  const declineChallenge = useCallback(async () => {
    if (!pendingChallenge) return;
    const cid = pendingChallenge.challenge_id;
    setPendingChallenge(null);
    await APIAxios.post(APIRoutes.POST_DeclineChallenge(cid));
  }, [pendingChallenge]);

  const sendAnswer = useCallback((answerIdx: number) => {
    if (
      answeredRef.current ||
      !currentQuestionRef.current ||
      !duelWsRef.current
    )
      return;
    answeredRef.current = true;
    myAnswerRef.current = answerIdx;
    setAnswered(true);
    duelWsRef.current.send(
      JSON.stringify({
        type: "answer",
        number: currentQuestionRef.current.number,
        answer: answerIdx,
      })
    );
  }, []);

  const goToLobby = useCallback(() => {
    duelWsRef.current?.close();
    duelWsRef.current = null;
    setScreen("lobby");
    setCurrentQuestion(null);
    currentQuestionRef.current = null;
    setEndData(null);
    setLastResult(null);
    setMyIdx(null);
    setAnswered(false);
    answeredRef.current = false;
  }, []);

  return (
    <DuelContext.Provider
      value={{
        screen,
        pendingChallenge,
        currentQuestion,
        myIdx,
        lastResult,
        endData,
        lobbyStatus,
        waitingMessage,
        answered,
        startMatchmaking,
        sendChallengeToUserId,
        sendChallengeByUsername,
        acceptChallenge,
        declineChallenge,
        sendAnswer,
        goToLobby,
        setLobbyStatus,
      }}
    >
      {children}
    </DuelContext.Provider>
  );
};
