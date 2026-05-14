import { useState, useEffect, useCallback, useRef } from "react";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useDuel } from "@features/duels/context/DuelContext";
import type { Friend, DuelHistoryEntry, DuelStatsData } from "@shared/types/duels";
import type { Friend as ApiFriend } from "@features/friends/store/friend.model";

const PRESENCE_POLL_INTERVAL = 10_000;

export const useDuelsScreen = () => {
  const duel = useDuel();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [history, setHistory] = useState<DuelHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [stats, setStats] = useState<DuelStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Keep friend IDs in a ref so the presence poller always has fresh IDs
  // without needing to be re-registered as a dependency.
  const friendIdsRef = useRef<string[]>([]);

  // ── Load accepted friends ─────────────────────────────────────────────────
  useEffect(() => {
    setLoadingFriends(true);
    APIAxios.get(APIRoutes.GET_Friends)
      .then((r) => {
        const accepted: ApiFriend[] = r.data.filter(
          (f: ApiFriend) => f.status === "accepted"
        );
        const mapped: Friend[] = accepted.map((f) => ({
          // direction='sent'   → je suis user_id, l'ami est friend_id
          // direction='received' → l'ami est user_id, je suis friend_id
          id: String(f.direction === "received" ? f.user_id : f.friend_id),
          firstName: f.friend_first_name,
          lastName: f.friend_last_name,
          level: 0,
          status: "offline" as const,
        }));
        setFriends(mapped);
        friendIdsRef.current = mapped.map((f) => f.id);
        pollPresence();
      })
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, []);

  // ── Presence polling ──────────────────────────────────────────────────────
  const pollPresence = useCallback(async () => {
    const ids = friendIdsRef.current;
    console.log("[Presence] poll — IDs:", ids);
    if (ids.length === 0) {
      console.log("[Presence] aucun ami, skip");
      return;
    }
    try {
      const r = await APIAxios.get(APIRoutes.GET_Users_Presence(ids.join(",")));
      console.log("[Presence] réponse backend:", r.data);
      const presence: Record<string, "online" | "in-game" | "offline"> = r.data;
      setFriends((prev) =>
        prev.map((f) => ({
          ...f,
          status: presence[f.id] ?? "offline",
        }))
      );
    } catch (err) {
      console.error("[Presence] erreur requête:", err);
    }
  }, []);

  useEffect(() => {
    console.log("[Presence] intervalle démarré");
    let interval: ReturnType<typeof setInterval> | null = setInterval(
      pollPresence,
      PRESENCE_POLL_INTERVAL
    );

    const onVisibilityChange = () => {
      if (document.hidden) {
        console.log("[Presence] onglet caché — pause");
        if (interval) { clearInterval(interval); interval = null; }
      } else {
        console.log("[Presence] onglet visible — reprise");
        pollPresence();
        interval = setInterval(pollPresence, PRESENCE_POLL_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      console.log("[Presence] intervalle nettoyé");
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollPresence]);

  // ── Load history & stats ──────────────────────────────────────────────────
  const fetchHistory = useCallback(() => {
    setLoadingHistory(true);
    APIAxios.get(APIRoutes.GET_DuelHistory)
      .then((r) => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, []);

  const fetchStats = useCallback(() => {
    setLoadingStats(true);
    APIAxios.get(APIRoutes.GET_DuelStats)
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory, fetchStats]);

  // Refresh history and stats after a game ends
  useEffect(() => {
    if (duel.screen === "end") {
      fetchHistory();
      fetchStats();
    }
  }, [duel.screen, fetchHistory, fetchStats]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDuelRequest = async (friendId: string) => {
    try {
      await duel.sendChallengeToUserId(Number(friendId));
    } catch {
      duel.setLobbyStatus("❌ Impossible d'envoyer le défi.");
    }
  };

  return {
    friends,
    loadingFriends,
    history,
    loadingHistory,
    stats,
    loadingStats,
    handleDuelRequest,
    ...duel,
  };
};
