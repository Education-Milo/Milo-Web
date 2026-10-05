import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useExerciseScreen } from '@features/exercices/hooks/useExercisePage';
import MiloQcm3D from '@features/exercices/components/MiloQcm3D.component';
import type { MiloQcmState } from '@features/exercices/data/miloQcm.animations';
import QuizBoard from '@shared/components/quiz/QuizBoard.component';
import AnswerCard, { type AnswerCardState } from '@shared/components/quiz/AnswerCard.component';
import StreakFlame from '@shared/components/quiz/StreakFlame.component';
import StreakBurst from '@shared/components/quiz/StreakBurst.component';
import RoundTrack, { type RoundState } from '@shared/components/quiz/RoundTrack.component';
import QuizLoader from '@shared/components/quiz/QuizLoader.component';
import QuizBackdrop from '@shared/components/quiz/QuizBackdrop.component';
import { emojiSrc } from '@shared/components/quiz/quiz.assets';
import "@features/exercices/styles/ExerciseScreen.css";

const LOADING_MESSAGES = [
  "Je relis ta leçon…",
  "Je choisis les meilleures questions…",
  "Je mélange les réponses…",
  "Prêt ? Ça arrive !",
];

/// Au-delà, les pastilles ne tiennent plus sur une ligne : barre continue
const MAX_PIPS = 15;

const PRAISES = ["Bravo !", "Génial !", "Trop fort !", "Exact !", "Super !", "Bien vu !"];
const STREAK_PRAISES = ["Tu es en feu !", "Rien ne t'arrête !", "Quelle série !"];
const OOPS = ["Oups !", "Presque !", "Pas tout à fait…", "Raté, mais courage !"];

const ANSWER_KEYS: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3,
  a: 0, b: 1, c: 2, d: 3,
};

const ExerciseScreen: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    progress,
    loading,
    error,
    selectedAnswer,
    isAnswered,
    isCorrect,
    score,
    streak,
    burstStreak,
    dismissStreakBurst,
    history,
    selectAnswer,
    nextQuestion,
  } = useExerciseScreen();

  /// Clavier : 1-4 / A-D pour répondre, Entrée ou Espace pour continuer
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!currentQuestion || event.metaKey || event.ctrlKey || event.altKey) return;
      // Un bouton focalisé gère déjà Entrée/Espace lui-même
      if (event.target instanceof HTMLButtonElement && (event.key === 'Enter' || event.key === ' ')) return;

      if (!isAnswered) {
        const index = ANSWER_KEYS[event.key.toLowerCase()];
        if (index !== undefined && index < currentQuestion.options.length) {
          event.preventDefault();
          selectAnswer(currentQuestion.options[index]);
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        nextQuestion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentQuestion, isAnswered, selectAnswer, nextQuestion]);

  if (loading) {
    return (
      <QuizLoader
        variant="qcm"
        eyebrow="Préparation du QCM"
        title="Milo prépare tes questions"
        highlight="questions"
        messages={LOADING_MESSAGES}
      />
    );
  }

  if (error) {
    return (
      <div className="qcm-page qz-page-bg">
        <div className="qcm-container">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="qz-btn qz-btn--sec">Retour</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const miloState: MiloQcmState = !isAnswered
    ? 'waiting'
    : isCorrect
      ? 'correct'
      : 'wrong';

  const isLast = currentQuestionIndex >= totalQuestions - 1;

  const rounds: RoundState[] = Array.from({ length: totalQuestions }, (_, i) => {
    if (i < history.length) return history[i] ? 'correct' : 'wrong';
    return i === currentQuestionIndex ? 'current' : 'pending';
  });

  const cardState = (option: string): AnswerCardState => {
    if (!isAnswered) return 'idle';
    if (option === currentQuestion.correct_answer) return 'correct';
    if (option === selectedAnswer) return 'wrong';
    return 'dim';
  };

  const feedbackTitle = isCorrect
    ? streak >= 3
      ? STREAK_PRAISES[currentQuestionIndex % STREAK_PRAISES.length]
      : PRAISES[currentQuestionIndex % PRAISES.length]
    : OOPS[currentQuestionIndex % OOPS.length];

  return (
    <div className="qcm-page">
      <QuizBackdrop variant="qcm" />
      <MiloQcm3D state={miloState} />
      <StreakBurst streak={burstStreak} onDismiss={dismissStreakBurst} />

      <div className="qcm-container">
        {/* Barre du haut : retour, progression, score, série */}
        <header className="qcm-topbar">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="qz-btn qz-btn--sec qz-btn--icon"
            aria-label="Quitter le QCM"
          >
            <ArrowLeft size={22} strokeWidth={2.6} />
          </button>

          <div className="qcm-progress">
            {totalQuestions <= MAX_PIPS ? (
              <RoundTrack rounds={rounds} label="Progression du QCM" />
            ) : (
              <div className="qz-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <div className="qz-bar-fill" style={{ width: `${Math.max(progress, 4)}%` }} />
              </div>
            )}
          </div>

          <div className="qcm-score" aria-label={`Score : ${score} sur ${totalQuestions}`}>
            <img src={emojiSrc('glowing_star')} alt="" className="qcm-score-emoji" draggable={false} />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={score}
                className="qcm-score-value"
                initial={reduceMotion ? false : { y: 14, scale: 1.5, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={reduceMotion ? undefined : { y: -14, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 20 }}
              >
                {score}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence>
              {isAnswered && isCorrect && (
                <motion.span
                  key={`plus-${currentQuestionIndex}`}
                  className="qcm-score-plus"
                  initial={{ y: 0, opacity: 0, scale: 0.6 }}
                  animate={{ y: -34, opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  aria-hidden="true"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <StreakFlame streak={streak} />
        </header>

        {/* Tableau : question + réponses */}
        <QuizBoard
          tag={<>Question <strong>{currentQuestionIndex + 1}</strong> / {totalQuestions}</>}
          question={currentQuestion.question}
          questionKey={currentQuestionIndex}
          onFire={streak >= 5}
        >
          <div className="qz-answers" key={`answers-${currentQuestionIndex}`}>
            {currentQuestion.options.map((option, index) => {
              const state = cardState(option);
              return (
                <AnswerCard
                  key={index}
                  index={index}
                  text={option}
                  state={state}
                  disabled={isAnswered}
                  onSelect={() => selectAnswer(option)}
                  celebrate={state === 'correct' && option === selectedAnswer}
                />
              );
            })}
          </div>
        </QuizBoard>

        {/* Retour sur la réponse */}
        <div className="qcm-feedback-slot">
          <AnimatePresence mode="wait">
            {isAnswered ? (
              <motion.div
                key={`feedback-${currentQuestionIndex}`}
                className={`qcm-feedback ${isCorrect ? 'is-ok' : 'is-ko'}`}
                role="status"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              >
                <motion.span
                  className="qcm-feedback-icon"
                  initial={reduceMotion ? false : { scale: 0, rotate: -120 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.08 }}
                  aria-hidden="true"
                >
                  {isCorrect ? <Check size={28} strokeWidth={3.5} /> : <X size={28} strokeWidth={3.5} />}
                </motion.span>
                <div className="qcm-feedback-text">
                  <p className="qcm-feedback-title">{feedbackTitle}</p>
                  {!isCorrect && (
                    <p className="qcm-feedback-sub">
                      La bonne réponse : <strong>{currentQuestion.correct_answer}</strong>
                    </p>
                  )}
                  {isCorrect && streak >= 2 && (
                    <p className="qcm-feedback-sub">{streak} bonnes réponses d'affilée</p>
                  )}
                </div>
                <button
                  type="button"
                  className={`qz-btn ${isCorrect ? 'qz-btn--ok' : 'qz-btn--ko'} qcm-feedback-next`}
                  onClick={nextQuestion}
                  autoFocus
                >
                  {isLast ? 'Voir mes résultats' : 'Continuer'}
                  <ArrowRight size={20} strokeWidth={2.8} />
                </button>
              </motion.div>
            ) : (
              <motion.p
                key={`hint-${currentQuestionIndex}`}
                className="qcm-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.6 }}
              >
                Choisis une réponse — ou tape <span className="qz-kbd">1</span>…<span className="qz-kbd">4</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ExerciseScreen;
