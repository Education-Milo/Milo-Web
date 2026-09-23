import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDuel } from "@features/duels/context/DuelContext";
import DuelMilo3D, { type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import EmoteWheel from "@features/duels/components/EmoteWheel.component";
import type { MiloQcmState } from "@features/exercices/data/miloQcm.animations";
import "@features/duels/styles/DuelsScreen.css";

const QUESTIONS_PER_DUEL = 5;
/// Durée d'affichage d'un sticker au-dessus d'un Milo
const STICKER_DURATION_MS = 2800;

interface StickerBubble {
  url: string;
  name: string;
  seq: number;
}

const DuelGame: React.FC = () => {
  const {
    currentQuestion,
    myIdx,
    lastResult,
    endData,
    answered,
    screen,
    players,
    lastEmote,
    sendAnswer,
    sendEmote,
    goToLobby,
    startMatchmaking,
  } = useDuel();

  const [scores, setScores] = useState<{ [k: number]: number }>({ 0: 0, 1: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [nextIn, setNextIn] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Milo 3D : tenue, réactions, émotes ──────────────────────────────────
  const oppIdx = myIdx === null ? null : 1 - myIdx;
  const me = players.find((p) => p.idx === myIdx) ?? null;
  const opponent = players.find((p) => p.idx === oppIdx) ?? null;

  const meshNamesOf = (skins: { mesh_name: string | null }[] | undefined) =>
    (skins ?? []).map((s) => s.mesh_name).filter((m): m is string => Boolean(m)).sort();
  const myMeshNames = useMemo(() => meshNamesOf(me?.skins), [me]);
  const oppMeshNames = useMemo(() => meshNamesOf(opponent?.skins), [opponent]);

  /// Réaction de chaque Milo d'après `responses` (réponse des deux joueurs)
  const reactionFor = (idx: number | null): MiloQcmState => {
    if (!lastResult || idx === null) return "waiting";
    return lastResult.responses[idx] === lastResult.good_answer ? "correct" : "wrong";
  };
  const myState = reactionFor(myIdx);
  const oppState = reactionFor(oppIdx);

  const [stickers, setStickers] = useState<Record<number, StickerBubble | undefined>>({});
  const [dances, setDances] = useState<Record<number, DuelDance | undefined>>({});
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const stickerTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const handleBusy = useCallback(
    (idx: number | null, value: boolean) => {
      if (idx === null) return;
      setBusy((current) => (current[idx] === value ? current : { ...current, [idx]: value }));
    },
    [],
  );
  const onMyBusy = useCallback((v: boolean) => handleBusy(myIdx, v), [handleBusy, myIdx]);
  const onOppBusy = useCallback((v: boolean) => handleBusy(oppIdx, v), [handleBusy, oppIdx]);

  /// Émote reçue (la sienne comprise) : sticker en bulle ou danse sur le bon Milo
  useEffect(() => {
    if (!lastEmote) return;
    const { player_idx: idx, cosmetic, seq } = lastEmote;
    if (cosmetic.type === "sticker" && cosmetic.image_url) {
      setStickers((current) => ({ ...current, [idx]: { url: cosmetic.image_url as string, name: cosmetic.name, seq } }));
      if (stickerTimersRef.current[idx]) clearTimeout(stickerTimersRef.current[idx]);
      stickerTimersRef.current[idx] = setTimeout(() => {
        setStickers((current) => ({ ...current, [idx]: undefined }));
      }, STICKER_DURATION_MS);
    } else if (cosmetic.type === "dance" && cosmetic.mesh_name) {
      setDances((current) => ({ ...current, [idx]: { clip: cosmetic.mesh_name as string, seq } }));
    }
  }, [lastEmote]);

  useEffect(() => {
    const timers = stickerTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  // Reset timer and selected answer on new question
  useEffect(() => {
    if (!currentQuestion) return;
    setSelectedIdx(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(currentQuestion.time_limit);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentQuestion?.number]);

  // Stop timer, update scores, start next-question countdown when result arrives
  useEffect(() => {
    if (!lastResult) {
      if (nextIntervalRef.current) clearInterval(nextIntervalRef.current);
      setNextIn(null);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setScores(lastResult.scores);

    setNextIn(3);
    nextIntervalRef.current = setInterval(() => {
      setNextIn((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(nextIntervalRef.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (nextIntervalRef.current) clearInterval(nextIntervalRef.current); };
  }, [lastResult]);

  const handleAnswer = (i: number) => {
    if (answered) return;
    setSelectedIdx(i);
    sendAnswer(i);
  };

  type BtnState = { cls: string; icon: string | null };

  const getButtonState = (i: number): BtnState => {
    if (lastResult) {
      const isCorrect = i === lastResult.good_answer;
      const isMyWrong = i === lastResult.my_answer && !isCorrect;
      if (isCorrect) return { cls: "duel-answer-btn duel-answer-correct", icon: "✓" };
      if (isMyWrong) return { cls: "duel-answer-btn duel-answer-wrong",   icon: "✗" };
      return { cls: "duel-answer-btn duel-answer-dim", icon: null };
    }
    if (i === selectedIdx) return { cls: "duel-answer-btn duel-answer-selected", icon: null };
    return { cls: "duel-answer-btn", icon: null };
  };

  const nextSuffix = nextIn !== null ? ` (prochaine dans ${nextIn}s)` : "";

  const statusMsg = (() => {
    if (!lastResult) {
      return answered ? "✔ Réponse envoyée — en attente de l'adversaire..." : "";
    }
    if (lastResult.my_answer === null) {
      return `⏱ Temps écoulé ! La bonne réponse était : « ${currentQuestion?.choices[lastResult.good_answer]} »${nextSuffix}`;
    }
    if (lastResult.my_answer === lastResult.good_answer) {
      return `🎉 Bonne réponse !${nextSuffix}`;
    }
    return `❌ Mauvaise réponse — la bonne était : « ${currentQuestion?.choices[lastResult.good_answer]} »${nextSuffix}`;
  })();

  const opponentName = opponent?.username ?? "Adversaire";

  // ── Écran de fin ──────────────────────────────────────────────────────────
  if (screen === "end" && endData && myIdx !== null) {
    const myScore  = endData.scores[myIdx] ?? 0;
    const oppScore = endData.scores[1 - myIdx] ?? 0;
    const isDraw   = myScore === oppScore;
    const isWin    = endData.winner === myIdx;

    return (
      <div className="dl-fullscreen-wrap">
        <div className="duel-end-card">
          <div className="duel-end-icon">{isDraw ? "🤝" : isWin ? "🏆" : "💀"}</div>
          <div className="duel-end-msg">
            {isDraw ? "Égalité !" : isWin ? "Tu as gagné !" : "Tu as perdu..."}
          </div>
          <div className="dl-end-scores">
            <div className="dl-end-score-box">
              <div className="dl-end-score-name">Toi</div>
              <div className="dl-end-score-pts">{myScore}</div>
            </div>
            <div className="dl-end-score-box">
              <div className="dl-end-score-name">{opponentName}</div>
              <div className="dl-end-score-pts">{oppScore}</div>
            </div>
          </div>
          <div className="dl-end-actions">
            <button className="start-random-duel-btn" onClick={startMatchmaking}>
              🔄 Rejouer
            </button>
            <button className="dl-btn-ghost" onClick={goToLobby}>
              🚪 Quitter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Écran de jeu ──────────────────────────────────────────────────────────
  if (!currentQuestion || myIdx === null) return null;

  const totalTime = currentQuestion.time_limit;
  const pct = (timeLeft / totalTime) * 100;
  const barColor = pct > 40 ? "#f97316" : pct > 20 ? "#d97706" : "#b91c1c";
  const mySticker = stickers[myIdx];
  const oppSticker = oppIdx !== null ? stickers[oppIdx] : undefined;

  return (
    <div className="duel-game-container">
      <div className="duel-arena">

        {/* Mon Milo, en grand, avec la roue d'émotes */}
        <aside className="duel-arena-side duel-arena-side--me">
          <div className="duel-milo-stage duel-milo-stage--large">
            {mySticker && (
              <div key={mySticker.seq} className="duel-sticker-bubble" title={mySticker.name}>
                <img src={mySticker.url} alt={mySticker.name} draggable={false} />
              </div>
            )}
            <DuelMilo3D
              equippedMeshNames={myMeshNames}
              state={myState}
              dance={dances[myIdx] ?? null}
              onBusyChange={onMyBusy}
              facing="right"
              className="duel-milo-3d--large"
            />
          </div>
          <div className="duel-arena-name">Toi{me?.username ? ` · @${me.username}` : ""}</div>
          <EmoteWheel
            items={me?.wheel ?? []}
            busy={Boolean(busy[myIdx])}
            onPick={sendEmote}
          />
        </aside>

        {/* Carte de question */}
        <div className="duel-game-card">
          <div className="duel-game-header">
            <span className="duel-question-num">
              Question {currentQuestion.number + 1} / {QUESTIONS_PER_DUEL}
            </span>
            <span className="duel-timer-text" style={{ color: barColor }}>
              {timeLeft}s
            </span>
          </div>

          <div className="duel-timer-bar-wrap">
            <div className="duel-timer-bar" style={{ width: `${pct}%`, background: barColor }} />
          </div>

          <div className="duel-scores">
            <div className="duel-score-box">
              <div className="duel-score-name">Toi</div>
              <div className="duel-score-pts">{scores[myIdx] ?? 0}</div>
            </div>
            <div className="duel-score-box">
              <div className="duel-score-name">{opponentName}</div>
              <div className="duel-score-pts">{scores[1 - myIdx] ?? 0}</div>
            </div>
          </div>

          <p className="duel-question-text">{currentQuestion.question}</p>

          <div className="duel-answers-grid">
            {currentQuestion.choices.map((choice, i) => {
              const { cls, icon } = getButtonState(i);
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={answered || !!lastResult}
                >
                  <span className="duel-answer-text">{choice}</span>
                  {icon && <span className="duel-answer-icon">{icon}</span>}
                </button>
              );
            })}
          </div>

          {statusMsg && (
            <div className={`duel-game-status ${lastResult ? (lastResult.my_answer === lastResult.good_answer ? "duel-status-correct" : "duel-status-wrong") : ""}`}>
              {statusMsg}
            </div>
          )}

          <button className="dl-btn-ghost duel-game-quit" onClick={goToLobby}>
            🚪 Quitter le duel
          </button>
        </div>

        {/* Milo de l'adversaire, en petit */}
        <aside className="duel-arena-side duel-arena-side--opponent">
          <div className="duel-milo-stage duel-milo-stage--small">
            {oppSticker && (
              <div key={oppSticker.seq} className="duel-sticker-bubble duel-sticker-bubble--small" title={oppSticker.name}>
                <img src={oppSticker.url} alt={oppSticker.name} draggable={false} />
              </div>
            )}
            <DuelMilo3D
              equippedMeshNames={oppMeshNames}
              state={oppState}
              dance={oppIdx !== null ? dances[oppIdx] ?? null : null}
              onBusyChange={onOppBusy}
              facing="left"
              className="duel-milo-3d--small"
            />
          </div>
          <div className="duel-arena-name">@{opponentName}</div>
        </aside>
      </div>
    </div>
  );
};

export default DuelGame;
