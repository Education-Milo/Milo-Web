import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, RefreshCcw, Trophy } from 'lucide-react';
import { postPerformance } from '@shared/api/tracking.api';
import { refreshAfterServerAction } from '@shared/lib/serverActions';
import { showToast } from '@shared/store/toast/toast.store';
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

const ExerciseResultScreen: React.FC = () => {
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

  if (typeof score !== 'number' || typeof total !== 'number') {
    return <Navigate to="/home" replace />;
  }

  if (isSending) {
    return (
      <div className="result-container">
        <div className="result-card">
          <div className="trophy-icon">
            <Trophy size={56} color="#E8A94A" />
          </div>
          <h1 className="result-title">Calcul de ton score...</h1>
        </div>
      </div>
    );
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  let message = "";
  let emoji = "";

  if (percentage === 100) { message = "Parfait !"; emoji = "🌟"; }
  else if (percentage >= 50) { message = "Bien joué !"; emoji = "👍"; }
  else { message = "Continue tes efforts !"; emoji = "💪"; }

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="trophy-icon">
            <Trophy size={56} color="#E8A94A" />
        </div>
        <h1 className="result-title">{message} {emoji}</h1>

        <div className="result-score-wrap">
          <span className="result-score-value">{score} / {total}</span>
          <span className="result-score-label">bonnes réponses</span>
        </div>

        <div className="result-actions">
          <button className="home-btn" onClick={() => navigate('/home')}>
            <Home size={20} /> Retour à l'accueil
          </button>
          <button className="retry-btn" onClick={() => navigate('/courses')}>
            <RefreshCcw size={20} /> Autres cours
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseResultScreen;
