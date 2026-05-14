import React, { useEffect, useRef, useState } from "react";
import { useDuel } from "@features/duels/context/DuelContext";
import "@features/duels/styles/DuelsScreen.css";

const QUESTIONS_PER_DUEL = 5;

const DuelGame: React.FC = () => {
  const {
    currentQuestion,
    myIdx,
    lastResult,
    endData,
    answered,
    screen,
    sendAnswer,
    goToLobby,
  } = useDuel();

  const [scores, setScores] = useState<{ [k: number]: number }>({ 0: 0, 1: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [nextIn, setNextIn] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ── Bouton : classe + icône selon l'état ──────────────────────────────────
  type BtnState = { cls: string; icon: string | null };

  const getButtonState = (i: number): BtnState => {
    // Phase résultat : montrer correct / faux / neutre atténué
    if (lastResult) {
      const isCorrect = i === lastResult.good_answer;
      const isMyWrong = i === lastResult.my_answer && !isCorrect;
      if (isCorrect) return { cls: "duel-answer-btn duel-answer-correct", icon: "✓" };
      if (isMyWrong) return { cls: "duel-answer-btn duel-answer-wrong",   icon: "✗" };
      return { cls: "duel-answer-btn duel-answer-dim", icon: null };
    }

    // Phase attente résultat : surbrillance de la réponse choisie
    if (i === selectedIdx) return { cls: "duel-answer-btn duel-answer-selected", icon: null };

    return { cls: "duel-answer-btn", icon: null };
  };

  // ── Message de statut ─────────────────────────────────────────────────────
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

  // ── Écran de fin ──────────────────────────────────────────────────────────
  if (screen === "end" && endData && myIdx !== null) {
    const myScore  = endData.scores[myIdx] ?? 0;
    const oppScore = endData.scores[1 - myIdx] ?? 0;
    const isDraw   = myScore === oppScore;
    const isWin    = endData.winner === myIdx;

    return (
      <div className="duel-game-container">
        <div className="duel-end-card">
          <div className="duel-end-icon">{isDraw ? "🤝" : isWin ? "🏆" : "💀"}</div>
          <div className="duel-end-msg">
            {isDraw ? "Égalité !" : isWin ? "Tu as gagné !" : "Tu as perdu..."}
          </div>
          <div className="duel-scores">
            <div className="duel-score-box">
              <div className="duel-score-name">Toi</div>
              <div className="duel-score-pts">{myScore}</div>
            </div>
            <div className="duel-score-box">
              <div className="duel-score-name">Adversaire</div>
              <div className="duel-score-pts">{oppScore}</div>
            </div>
          </div>
          <button className="start-random-duel-btn" onClick={goToLobby}>
            🔄 Rejouer
          </button>
        </div>
      </div>
    );
  }

  // ── Écran de jeu ──────────────────────────────────────────────────────────
  if (!currentQuestion || myIdx === null) return null;

  const totalTime = currentQuestion.time_limit;
  const pct = (timeLeft / totalTime) * 100;
  const barColor = pct > 40 ? "#f97316" : pct > 20 ? "#d97706" : "#b91c1c";

  return (
    <div className="duel-game-container">
      <div className="duel-game-card">

        {/* En-tête */}
        <div className="duel-game-header">
          <span className="duel-question-num">
            Question {currentQuestion.number + 1} / {QUESTIONS_PER_DUEL}
          </span>
          <span className="duel-timer-text" style={{ color: barColor }}>
            {timeLeft}s
          </span>
        </div>

        {/* Barre timer */}
        <div className="duel-timer-bar-wrap">
          <div className="duel-timer-bar" style={{ width: `${pct}%`, background: barColor }} />
        </div>

        {/* Scores */}
        <div className="duel-scores">
          <div className="duel-score-box">
            <div className="duel-score-name">Toi</div>
            <div className="duel-score-pts">{scores[myIdx] ?? 0}</div>
          </div>
          <div className="duel-score-box">
            <div className="duel-score-name">Adversaire</div>
            <div className="duel-score-pts">{scores[1 - myIdx] ?? 0}</div>
          </div>
        </div>

        {/* Question */}
        <p className="duel-question-text">{currentQuestion.question}</p>

        {/* Réponses */}
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

        {/* Statut */}
        {statusMsg && (
          <div className={`duel-game-status ${lastResult ? (lastResult.my_answer === lastResult.good_answer ? "duel-status-correct" : "duel-status-wrong") : ""}`}>
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuelGame;
