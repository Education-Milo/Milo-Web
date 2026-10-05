import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock, DoorOpen, Hourglass, RotateCcw, X } from "lucide-react";
import { useDuel } from "@features/duels/context/DuelContext";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import QuizBoard from "@shared/components/quiz/QuizBoard.component";
import AnswerCard, { type AnswerCardState } from "@shared/components/quiz/AnswerCard.component";
import StreakFlame from "@shared/components/quiz/StreakFlame.component";
import StreakBurst from "@shared/components/quiz/StreakBurst.component";
import { isStreakMilestone } from "@shared/components/quiz/streak.utils";
import RoundTrack, { type RoundState } from "@shared/components/quiz/RoundTrack.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import CountUp from "@shared/components/quiz/CountUp.component";
import RewardRain from "@shared/components/quiz/RewardRain.component";
import BrandTitle from "@shared/components/quiz/BrandTitle.component";
import QuizBackdrop from "@shared/components/quiz/QuizBackdrop.component";
import { emojiSrc } from "@shared/components/quiz/quiz.assets";
import DuelMilo3D, { type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import EmoteWheel from "@features/duels/components/EmoteWheel.component";
import type { MiloQcmState } from "@features/exercices/data/miloQcm.animations";
import "@features/duels/styles/DuelsScreen.css";
import "@features/duels/styles/DuelGame.css";

const QUESTIONS_PER_DUEL = 5;
/// Durée d'affichage d'un sticker au-dessus d'un Milo
const STICKER_DURATION_MS = 2800;
/// Durée de l'explosion plein écran au passage d'un palier de série
const STREAK_BURST_MS = 3400;
/// Sous ce nombre de secondes, le chrono s'affole
const TIMER_DANGER_S = 5;

/// Résultat d'une manche pour chaque joueur (null : pas encore jouée)
interface RoundResult {
  me: boolean | null;
  opp: boolean | null;
}

const emptyRounds = (): RoundResult[] =>
  Array.from({ length: QUESTIONS_PER_DUEL }, () => ({ me: null, opp: null }));

/// Bonnes réponses d'affilée en partant de la dernière manche jouée
const trailingStreak = (results: (boolean | null)[]) => {
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === null) continue;
    if (!results[i]) break;
    count++;
  }
  return count;
};

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
  const [rounds, setRounds] = useState<RoundResult[]>(emptyRounds);
  const [burstStreak, setBurstStreak] = useState<number | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
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
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  // Reset timer and selected answer on new question
  useEffect(() => {
    if (!currentQuestion) return;
    setSelectedIdx(null);
    // Nouvelle partie (revanche comprise) : on repart de zéro
    if (currentQuestion.number === 0) {
      setRounds(emptyRounds());
      setScores({ 0: 0, 1: 0 });
    }
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

    // Tableau des manches + palier de série
    if (currentQuestion && myIdx !== null) {
      const meOk = lastResult.responses[myIdx] === lastResult.good_answer;
      const oppOk = lastResult.responses[1 - myIdx] === lastResult.good_answer;
      const roundIdx = currentQuestion.number;
      setRounds((current) => {
        const next = current.map((r, i) => (i === roundIdx ? { me: meOk, opp: oppOk } : r));
        const streakNow = trailingStreak(next.map((r) => r.me));
        if (meOk && isStreakMilestone(streakNow)) {
          setBurstStreak(streakNow);
          if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
          burstTimerRef.current = setTimeout(() => setBurstStreak(null), STREAK_BURST_MS);
        }
        return next;
      });
    }

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
    if (answered || lastResult) return;
    setSelectedIdx(i);
    sendAnswer(i);
  };

  /// Clavier : 1-4 pour répondre
  useEffect(() => {
    if (screen !== "game" || !currentQuestion) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < currentQuestion.choices.length) {
        event.preventDefault();
        handleAnswer(index);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const opponentName = opponent?.username ?? "Adversaire";
  const myName = me?.username ?? "Toi";
  const myStreak = trailingStreak(rounds.map((r) => r.me));
  const oppStreak = trailingStreak(rounds.map((r) => r.opp));

  const trackFor = (side: "me" | "opp"): RoundState[] =>
    rounds.map((r, i) => {
      const value = r[side];
      if (value !== null) return value ? "correct" : "wrong";
      return screen === "game" && i === currentQuestion?.number ? "current" : "pending";
    });

  // ── Écran de fin ──────────────────────────────────────────────────────────
  if (screen === "end" && endData && myIdx !== null) {
    const myScore  = endData.scores[myIdx] ?? 0;
    const oppScore = endData.scores[1 - myIdx] ?? 0;
    const isDraw   = myScore === oppScore;
    const isWin    = endData.winner === myIdx;
    const title = isDraw
      ? { text: "Égalité parfaite !", highlight: "Égalité" }
      : isWin
        ? { text: "Victoire !", highlight: "Victoire" }
        : { text: "Bien tenté !", highlight: "tenté" };

    const myEndState: MiloQcmState = isWin || isDraw ? "correct" : "wrong";
    const oppEndState: MiloQcmState = !isWin || isDraw ? "correct" : "wrong";
    const line = isDraw
      ? "Égalité ! On remet ça ?"
      : isWin
        ? "Trop fort ! Tu l'as battu !"
        : "Pas grave, la revanche t'attend !";

    return (
      <div className="dl-fullscreen-wrap dg-end-wrap">
        <QuizBackdrop variant="qcm" />
        {isWin && <ConfettiBurst fixed count={120} spread={540} originX={50} originY={22} delay={0.9} />}
        {(isWin || isDraw) && <RewardRain emojis={["trophy", "coin", "glowing_star", "sparkles"]} count={isWin ? 18 : 10} delay={1.2} />}

        <div className="dg-end-arena">
          {/* Mon Milo, en grand */}
          <aside className="dg-end-side dg-end-side--me">
            <motion.div
              className="qz-bubble dg-end-speech"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 16, delay: 1.4 }}
            >
              {line}
            </motion.div>
            <div className="duel-milo-stage duel-milo-stage--large">
              {stickers[myIdx] && (
                <div key={stickers[myIdx]!.seq} className="duel-sticker-bubble" title={stickers[myIdx]!.name}>
                  <img src={stickers[myIdx]!.url} alt={stickers[myIdx]!.name} draggable={false} />
                </div>
              )}
              <DuelMilo3D
                equippedMeshNames={myMeshNames}
                state={myEndState}
                dance={dances[myIdx] ?? null}
                onBusyChange={onMyBusy}
                facing="right"
                className="duel-milo-3d--large"
              />
            </div>
            <EmoteWheel
              items={me?.wheel ?? []}
              busy={Boolean(busy[myIdx])}
              onPick={sendEmote}
            />
          </aside>

          <motion.div
            className={`dg-end ${isDraw ? "is-draw" : isWin ? "is-win" : "is-loss"}`}
            initial={reduceMotion ? false : { opacity: 0, y: 80, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <motion.img
              src={emojiSrc(isDraw ? "sports_medal" : isWin ? "trophy" : "rocket")}
              alt=""
              aria-hidden="true"
              className="dg-end-emblem"
              initial={reduceMotion ? false : { scale: 0, y: 60, rotate: -40 }}
              animate={{ scale: [0, 1.3, 1], y: 0, rotate: [-40, 12, 0] }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
            />

            <motion.div
              className="qz-ribbon"
              initial={reduceMotion ? false : { scaleX: 0.2, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}
            >
              <BrandTitle as="h1" tone="creme" className="dg-end-title" text={title.text} delay={0.45} />
            </motion.div>

            <div className="dg-end-faceoff">
              {[
                { key: "me", name: "Toi", meshes: myMeshNames, score: myScore, winner: !isDraw && isWin },
                { key: "opp", name: `@${opponentName}`, meshes: oppMeshNames, score: oppScore, winner: !isDraw && !isWin },
              ].map((p, i) => (
                <React.Fragment key={p.key}>
                  {i === 1 && (
                    <motion.span
                      className="dg-vs"
                      aria-hidden="true"
                      initial={reduceMotion ? false : { scale: 3, opacity: 0, rotate: -30 }}
                      animate={{ scale: 1, opacity: 1, rotate: -8 }}
                      transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.9 }}
                    >
                      VS
                    </motion.span>
                  )}
                  <motion.div
                    className={`dg-end-player dg-end-player--${p.key} ${p.winner ? "is-winner" : ""}`}
                    initial={reduceMotion ? false : { opacity: 0, x: i === 0 ? -80 : 80, rotate: i === 0 ? -6 : 6 }}
                    animate={{ opacity: 1, x: 0, rotate: 0, scale: p.winner ? [1, 1, 1.08, 1] : 1 }}
                    transition={{
                      default: { type: "spring", stiffness: 300, damping: 18, delay: 0.6 },
                      scale: { duration: 0.5, delay: 1.7, times: [0, 0.2, 0.6, 1] },
                    }}
                  >
                    {p.winner && (
                      <motion.img
                        src={emojiSrc("trophy")}
                        className="dg-end-crown"
                        initial={reduceMotion ? false : { y: -80, opacity: 0, rotate: -40 }}
                        animate={{ y: 0, opacity: 1, rotate: -12 }}
                        transition={{ type: "spring", stiffness: 420, damping: 11, delay: 1.6 }}
                        alt="Gagnant"
                      />
                    )}
                    <span className="dg-avatar dg-avatar--lg">
                      <MiloAvatar equippedMeshNames={p.meshes} initials={p.name.replace("@", "").slice(0, 1).toUpperCase()} />
                    </span>
                    <span className="dg-end-name">{p.name}</span>
                    <span className="dg-end-score"><CountUp value={p.score} delay={1} /></span>
                  </motion.div>
                </React.Fragment>
              ))}
            </div>

            <RoundsTable
              rounds={rounds}
              opponentName={opponentName}
              reduceMotion={Boolean(reduceMotion)}
            />

            <motion.div
              className="dg-end-actions"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <button type="button" className="qz-btn" onClick={startMatchmaking}>
                <RotateCcw size={20} strokeWidth={2.6} /> Revanche
              </button>
              <button type="button" className="qz-btn qz-btn--sec" onClick={goToLobby}>
                <DoorOpen size={20} strokeWidth={2.6} /> Quitter
              </button>
            </motion.div>
          </motion.div>

          {/* Milo de l'adversaire */}
          <aside className="dg-end-side dg-end-side--opp">
            <div className="duel-milo-stage duel-milo-stage--small">
              {oppIdx !== null && stickers[oppIdx] && (
                <div key={stickers[oppIdx]!.seq} className="duel-sticker-bubble duel-sticker-bubble--small" title={stickers[oppIdx]!.name}>
                  <img src={stickers[oppIdx]!.url} alt={stickers[oppIdx]!.name} draggable={false} />
                </div>
              )}
              <DuelMilo3D
                equippedMeshNames={oppMeshNames}
                state={oppEndState}
                dance={oppIdx !== null ? dances[oppIdx] ?? null : null}
                onBusyChange={onOppBusy}
                facing="left"
                className="duel-milo-3d--small"
              />
            </div>
            <span className="duel-arena-name">@{opponentName}</span>
          </aside>
        </div>
      </div>
    );
  }

  // ── Écran de jeu ──────────────────────────────────────────────────────────
  if (!currentQuestion || myIdx === null) return null;

  const totalTime = currentQuestion.time_limit;
  const ratio = totalTime > 0 ? timeLeft / totalTime : 0;
  const timerTone = ratio > 0.5 ? "calm" : ratio > 0.25 ? "warm" : "hot";
  const isDanger = !lastResult && !answered && timeLeft > 0 && timeLeft <= TIMER_DANGER_S;
  const mySticker = stickers[myIdx];
  const oppSticker = oppIdx !== null ? stickers[oppIdx] : undefined;

  const cardState = (i: number): AnswerCardState => {
    if (lastResult) {
      if (i === lastResult.good_answer) return "correct";
      if (i === lastResult.my_answer) return "wrong";
      return "dim";
    }
    return i === selectedIdx ? "selected" : "idle";
  };

  const pickersFor = (i: number) => {
    if (!lastResult || oppIdx === null) return [];
    const list: { label: string; kind: "me" | "opp" }[] = [];
    if (lastResult.responses[myIdx] === i) list.push({ label: "Toi", kind: "me" });
    if (lastResult.responses[oppIdx] === i) list.push({ label: opponentName, kind: "opp" });
    return list;
  };

  const outcome: "ok" | "ko" | "timeout" | null = !lastResult
    ? null
    : lastResult.my_answer === null
      ? "timeout"
      : lastResult.my_answer === lastResult.good_answer
        ? "ok"
        : "ko";

  return (
    <div className="duel-game-container">
      <QuizBackdrop variant="duel" />
      <StreakBurst
        streak={burstStreak}
        onDismiss={() => {
          if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
          setBurstStreak(null);
        }}
      />

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

        <div className="dg-center">
          {/* Tableau des scores */}
          <div className="dg-scoreboard">
            <PlayerPanel
              side="me"
              name="Toi"
              handle={myName}
              meshes={myMeshNames}
              score={scores[myIdx] ?? 0}
              streak={myStreak}
              track={trackFor("me")}
              reduceMotion={Boolean(reduceMotion)}
            />

            <div className="dg-timer-wrap">
              <TimerRing
                timeLeft={timeLeft}
                ratio={lastResult ? 0 : ratio}
                tone={timerTone}
                danger={isDanger}
                frozen={Boolean(lastResult)}
                reduceMotion={Boolean(reduceMotion)}
              />
              <span className="dg-round-label">
                Manche {currentQuestion.number + 1}/{QUESTIONS_PER_DUEL}
              </span>
            </div>

            <PlayerPanel
              side="opp"
              name={`@${opponentName}`}
              handle={opponentName}
              meshes={oppMeshNames}
              score={scores[1 - myIdx] ?? 0}
              streak={oppStreak}
              track={trackFor("opp")}
              reduceMotion={Boolean(reduceMotion)}
            />
          </div>

          {/* Question + réponses */}
          <QuizBoard
            tag={<>Question <strong>{currentQuestion.number + 1}</strong> / {QUESTIONS_PER_DUEL}</>}
            question={currentQuestion.question}
            questionKey={currentQuestion.number}
            onFire={myStreak >= 3}
          >
            <div className="qz-answers" key={`answers-${currentQuestion.number}`}>
              {currentQuestion.choices.map((choice, i) => (
                <AnswerCard
                  key={i}
                  index={i}
                  text={choice}
                  state={cardState(i)}
                  disabled={answered || Boolean(lastResult)}
                  onSelect={() => handleAnswer(i)}
                  celebrate={outcome === "ok" && i === lastResult?.my_answer}
                  pickers={pickersFor(i)}
                />
              ))}
            </div>
          </QuizBoard>

          {/* Bandeau d'état */}
          <div className="dg-status-slot">
            <AnimatePresence mode="wait">
              {outcome ? (
                <motion.div
                  key={`result-${currentQuestion.number}`}
                  className={`dg-status dg-status--${outcome}`}
                  role="status"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <span className="dg-status-icon" aria-hidden="true">
                    {outcome === "ok" ? <Check size={24} strokeWidth={3.5} /> : outcome === "ko" ? <X size={24} strokeWidth={3.5} /> : <Clock size={22} strokeWidth={3} />}
                  </span>
                  <div className="dg-status-text">
                    <p className="dg-status-title">
                      {outcome === "ok" ? "Bonne réponse !" : outcome === "ko" ? "Raté !" : "Temps écoulé !"}
                    </p>
                    {outcome !== "ok" && (
                      <p className="dg-status-sub">
                        La bonne réponse : <strong>{currentQuestion.choices[lastResult!.good_answer]}</strong>
                      </p>
                    )}
                  </div>
                  {nextIn !== null && (
                    <span className="dg-next" aria-label={`Question suivante dans ${nextIn} secondes`}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={nextIn}
                          initial={reduceMotion ? false : { scale: 1.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          {nextIn}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  )}
                </motion.div>
              ) : answered ? (
                <motion.div
                  key={`wait-${currentQuestion.number}`}
                  className="dg-status dg-status--wait"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="dg-status-icon" aria-hidden="true">
                    <Hourglass size={22} strokeWidth={2.6} />
                  </span>
                  <p className="dg-status-title">
                    Réponse envoyée ! On attend @{opponentName}
                    <span className="dg-dots" aria-hidden="true"><i /><i /><i /></span>
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key={`hint-${currentQuestion.number}`}
                  className="dg-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Le plus rapide gagne ! Tape <span className="qz-kbd">1</span>…<span className="qz-kbd">4</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button type="button" className="dg-quit" onClick={goToLobby}>
            <DoorOpen size={16} strokeWidth={2.6} /> Quitter le duel
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

// ── Sous-composants ─────────────────────────────────────────────────────────

interface PlayerPanelProps {
  side: "me" | "opp";
  name: string;
  handle: string;
  meshes: string[];
  score: number;
  streak: number;
  track: RoundState[];
  reduceMotion: boolean;
}

/// Un joueur dans le tableau des scores : avatar, score, manches, série
const PlayerPanel: React.FC<PlayerPanelProps> = ({ side, name, handle, meshes, score, streak, track, reduceMotion }) => (
  <div className={`dg-player dg-player--${side}`}>
    <div className="dg-player-id">
      <span className="dg-avatar">
        <MiloAvatar equippedMeshNames={meshes} initials={handle.slice(0, 1).toUpperCase()} />
      </span>
      <span className="dg-player-name">{name}</span>
    </div>
    <div className="dg-player-score" aria-label={`Score de ${name} : ${score}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={score}
          initial={reduceMotion ? false : { y: 20, scale: 1.8, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 480, damping: 18 }}
        >
          {score}
        </motion.span>
      </AnimatePresence>
    </div>
    <div className="dg-player-foot">
      <RoundTrack rounds={track} compact label={`Manches de ${name}`} />
      {streak >= 2 && <StreakFlame streak={streak} showLabel={false} compact />}
    </div>
  </div>
);

interface TimerRingProps {
  timeLeft: number;
  ratio: number;
  tone: "calm" | "warm" | "hot";
  danger: boolean;
  frozen: boolean;
  reduceMotion: boolean;
}

const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

/// Chrono circulaire : se vide, change de couleur et tremble à la fin
const TimerRing: React.FC<TimerRingProps> = ({ timeLeft, ratio, tone, danger, frozen, reduceMotion }) => (
  <motion.div
    className={`dg-timer dg-timer--${tone} ${frozen ? "is-frozen" : ""}`}
    role="timer"
    aria-label={`${timeLeft} secondes restantes`}
    animate={danger && !reduceMotion ? { rotate: [0, -6, 6, -4, 4, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
    transition={danger ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } : { duration: 0.2 }}
  >
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle className="dg-timer-track" cx="36" cy="36" r={RING_R} />
      <circle
        className="dg-timer-fill"
        cx="36"
        cy="36"
        r={RING_R}
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - Math.max(0, Math.min(1, ratio)))}
      />
    </svg>
    <span className="dg-timer-value">{frozen ? <Check size={22} strokeWidth={3.5} /> : timeLeft}</span>
  </motion.div>
);

interface RoundsTableProps {
  rounds: RoundResult[];
  opponentName: string;
  reduceMotion: boolean;
}

/// Récapitulatif de fin : une colonne par manche, une ligne par joueur
const RoundsTable: React.FC<RoundsTableProps> = ({ rounds, opponentName, reduceMotion }) => {
  const cell = (value: boolean | null, delay: number) => (
    <motion.span
      className={`dg-cell ${value === null ? "is-none" : value ? "is-ok" : "is-ko"}`}
      initial={reduceMotion ? false : { scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 16, delay }}
    >
      {value === null ? "–" : value ? <Check size={16} strokeWidth={4} /> : <X size={16} strokeWidth={4} />}
    </motion.span>
  );

  return (
    <div className="dg-table-wrap">
      <table className="dg-table">
        <caption>Récap des manches</caption>
        <thead>
          <tr>
            <th scope="col"><span className="dg-sr-only">Joueur</span></th>
            {rounds.map((_, i) => (
              <th key={i} scope="col">Q{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Toi</th>
            {rounds.map((r, i) => <td key={i}>{cell(r.me, 1.2 + i * 0.1)}</td>)}
          </tr>
          <tr>
            <th scope="row">@{opponentName}</th>
            {rounds.map((r, i) => <td key={i}>{cell(r.opp, 1.3 + i * 0.1)}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DuelGame;
