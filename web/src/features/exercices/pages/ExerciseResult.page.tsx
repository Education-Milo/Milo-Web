import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, RefreshCcw } from 'lucide-react';
import { postPerformance } from '@shared/api/tracking.api';
import { refreshAfterServerAction } from '@shared/lib/serverActions';
import { showToast } from '@shared/store/toast/toast.store';
import ConfettiBurst from '@shared/components/quiz/ConfettiBurst.component';
import BrandTitle from '@shared/components/quiz/BrandTitle.component';
import QuizLoader from '@shared/components/quiz/QuizLoader.component';
import QuizBackdrop from '@shared/components/quiz/QuizBackdrop.component';
import CountUp from '@shared/components/quiz/CountUp.component';
import RewardRain from '@shared/components/quiz/RewardRain.component';
import MiloQcm3D from '@features/exercices/components/MiloQcm3D.component';
import type { MiloQcmState } from '@features/exercices/data/miloQcm.animations';
import type { PerformanceResponse } from '@shared/types/tracking';
import { MASCOT_SRC, emojiSrc, type BrandEmoji } from '@shared/components/quiz/quiz.assets';
import '@shared/styles/Quiz.css';
import '@features/exercices/styles/ExerciseScreen.css';

interface ExerciseResultState {
  score?: number;
  total?: number;
  attemptId?: string;
  bestStreak?: number;
  durationSeconds?: number;
  lessonId?: number;
  subject?: string;
}

const createFallbackAttemptId = () =>
  `result-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/// 3 étoiles : sans faute · 2 : au moins 70 % · 1 : au moins 40 %
const starsFor = (percentage: number) =>
  percentage === 100 ? 3 : percentage >= 70 ? 2 : percentage >= 40 ? 1 : 0;

const formatDuration = (seconds?: number) => {
  if (typeof seconds !== 'number' || seconds <= 0) return '—';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m${String(rest).padStart(2, '0')}` : `${rest}s`;
};

const MILO_LINES: Record<number, string> = {
  3: "Sans faute ! Tu es un vrai champion !",
  2: "Super boulot, tu maîtrises bien !",
  1: "Pas mal ! Encore un petit effort.",
  0: "On recommence ensemble ? Tu vas y arriver !",
};

const ExerciseResultScreen: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    score,
    total,
    attemptId,
    bestStreak,
    durationSeconds,
    lessonId,
    subject,
  } = (location.state as ExerciseResultState | null) ?? {};
  const fallbackAttemptId = useRef(createFallbackAttemptId());
  const hasSentRef = useRef(false);
  // Le score n'est affiché qu'une fois le résultat envoyé au backend
  // (ou en cas d'échec, pour ne jamais bloquer l'élève).
  const [isSending, setIsSending] = useState(true);
  /// Récompenses renvoyées par le serveur (série de jours, missions)
  const [reward, setReward] = useState<PerformanceResponse | null>(null);
  /// Milo attend que les étoiles tombent pour réagir
  const [miloState, setMiloState] = useState<MiloQcmState>('waiting');

  useEffect(() => {
    if (typeof score !== 'number' || typeof total !== 'number') return;
    if (hasSentRef.current) return;
    hasSentRef.current = true;

    const send = async () => {
      try {
        const result = await postPerformance({
          kind: 'qcm',
          ...(typeof lessonId === 'number' && !Number.isNaN(lessonId)
            ? { lesson_id: lessonId }
            : {}),
          ...(subject ? { subject } : {}),
          score,
          max_score: total,
          best_streak: typeof bestStreak === 'number' ? bestStreak : 0,
          duration_seconds:
            typeof durationSeconds === 'number' ? durationSeconds : 0,
          // Même identifiant sur un re-render ou un refresh : le back
          // répond duplicate=true et ne recompte rien.
          attempt_id:
            typeof attemptId === 'string' ? attemptId : fallbackAttemptId.current,
        });

        setReward(result);
        if (!result.duplicate) {
          result.missions_completed.forEach((mission) => {
            showToast(
              `Mission terminée : ${mission.title} +${mission.reward_xp} XP +${mission.reward_coins} coins`,
              'success',
            );
          });
          // XP, coins, streak et missions ont changé côté serveur
          refreshAfterServerAction();
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi du résultat :", error);
      } finally {
        setIsSending(false);
      }
    };

    void send();
  }, [attemptId, bestStreak, durationSeconds, lessonId, score, subject, total]);

  const percentage = typeof score === 'number' && typeof total === 'number' && total > 0
    ? Math.round((score / total) * 100)
    : 0;
  const stars = starsFor(percentage);

  useEffect(() => {
    if (isSending) return;
    const id = setTimeout(() => setMiloState(stars >= 1 ? 'correct' : 'wrong'), 1300);
    return () => clearTimeout(id);
  }, [isSending, stars]);

  if (typeof score !== 'number' || typeof total !== 'number') {
    return <Navigate to="/home" replace />;
  }

  if (isSending) {
    return (
      <QuizLoader
        variant="qcm"
        eyebrow="QCM terminé"
        title="Milo compte tes points"
        highlight="points"
        messages={["Je vérifie tes réponses…", "Je calcule ton score…", "Encore une seconde !"]}
      />
    );
  }

  const message =
    percentage === 100 ? { text: 'Parfait !', highlight: 'Parfait' }
    : stars >= 2 ? { text: 'Bien joué !', highlight: 'joué' }
    : stars === 1 ? { text: 'Beau travail !', highlight: 'travail' }
    : { text: 'Tu y es presque !', highlight: 'presque' };

  const stats: { emoji: BrandEmoji; value: number; suffix?: string; text?: string; label: string }[] = [
    { emoji: 'bullseye', value: percentage, suffix: '%', label: 'Précision' },
    { emoji: 'fire', value: bestStreak ?? 0, label: 'Meilleure série' },
    { emoji: 'high_voltage', value: 0, text: formatDuration(durationSeconds), label: 'Temps' },
  ];

  const missions = reward && !reward.duplicate ? reward.missions_completed : [];
  const dailyStreak = reward?.streak ?? 0;
  const hasRewards = missions.length > 0 || dailyStreak > 0;

  return (
    <div className="qcm-result-page">
      <QuizBackdrop variant="fete" />
      <MiloQcm3D state={miloState} />

      {/* Milo commente le résultat */}
      <motion.div
        className="qz-bubble qcm-result-speech"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 1.5 }}
      >
        {MILO_LINES[stars]}
      </motion.div>

      {stars >= 2 && <ConfettiBurst fixed count={stars === 3 ? 110 : 70} spread={520} originX={50} originY={22} delay={1.1} />}
      {stars >= 1 && <RewardRain emojis={['coin', 'glowing_star', 'sparkles']} count={6 + stars * 5} delay={1.4} />}

      <motion.div
        className="qcm-result-card"
        initial={reduceMotion ? false : { opacity: 0, y: 80, scale: 0.9, rotate: -2 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <img src={MASCOT_SRC} alt="" className="qcm-result-mascot-mobile" draggable={false} />

        {/* Bannière façon fin de niveau */}
        <motion.div
          className="qz-ribbon"
          initial={reduceMotion ? false : { scaleX: 0.2, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.25 }}
        >
          <BrandTitle as="h1" tone="creme" className="result-title" text={message.text} delay={0.45} />
        </motion.div>

        {/* Étoiles qui s'écrasent une à une */}
        <ul className="qcm-result-stars" aria-label={`${stars} étoile${stars > 1 ? 's' : ''} sur 3`}>
          {[0, 1, 2].map((i) => {
            const on = i < stars;
            const delay = 0.8 + i * 0.28;
            return (
              <li key={i} className={`qcm-result-star ${on ? 'is-on' : ''}`}>
                {on && !reduceMotion && (
                  <motion.span
                    className="qcm-result-star-shock"
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.6, delay: delay + 0.18, ease: 'easeOut' }}
                  />
                )}
                <motion.img
                  src={emojiSrc('glowing_star')}
                  alt=""
                  draggable={false}
                  initial={reduceMotion ? false : { scale: on ? 3 : 0, opacity: 0, rotate: on ? -60 : 0, y: on ? -60 : 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                  transition={on
                    ? { type: 'spring', stiffness: 520, damping: 16, delay }
                    : { duration: 0.3, delay }}
                />
              </li>
            );
          })}
        </ul>

        <div className="qcm-result-score">
          <span className="qcm-result-score-value">
            <CountUp value={score} delay={0.6} /> <small>/ {total}</small>
          </span>
          <span className="qcm-result-score-label">bonnes réponses</span>
        </div>

        <div className="qcm-result-stats">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="qcm-result-stat"
              initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 15, delay: 1.7 + i * 0.12 }}
            >
              <img src={emojiSrc(stat.emoji)} alt="" draggable={false} />
              <span className="qcm-result-stat-value">
                {stat.text ?? <CountUp value={stat.value} suffix={stat.suffix} delay={1.8 + i * 0.12} />}
              </span>
              <span className="qcm-result-stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {hasRewards && (
          <motion.div
            className="qcm-result-rewards"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 2.2 }}
          >
            <span className="qcm-result-rewards-title">Tes récompenses</span>
            {dailyStreak > 0 && (
              <div className="qz-reward">
                <img src={emojiSrc('fire')} alt="" />
                <span>Série de <strong>{dailyStreak} jour{dailyStreak > 1 ? 's' : ''}</strong><small>Reviens demain pour la garder !</small></span>
              </div>
            )}
            {missions.map((mission, i) => (
              <motion.div
                key={mission.id}
                className="qz-reward"
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.4 + i * 0.15 }}
              >
                <img src={emojiSrc('trophy')} alt="" />
                <span>{mission.title}<small>Mission terminée</small></span>
                <span className="qz-reward-gain">
                  <span>+<CountUp value={mission.reward_xp} delay={2.5 + i * 0.15} /> XP</span>
                  <span><img src={emojiSrc('coin')} alt="" />+<CountUp value={mission.reward_coins} delay={2.5 + i * 0.15} /></span>
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="result-actions"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <button className="qz-btn" onClick={() => navigate('/home')}>
            <Home size={20} /> Accueil
          </button>
          <button className="qz-btn qz-btn--sec" onClick={() => navigate('/courses')}>
            <RefreshCcw size={20} /> Autres cours
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ExerciseResultScreen;
