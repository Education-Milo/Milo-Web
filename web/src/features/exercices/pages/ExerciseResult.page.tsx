import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, RefreshCcw, Trophy } from 'lucide-react';
import { recordQcmMissionProgress } from '@features/missions/store/dailyMissions.store';
import '@features/exercices/styles/ExerciseScreen.css';

const createFallbackAttemptId = () =>
  `result-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const ExerciseResultScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, total, theme, attemptId } = location.state || {};
  const fallbackAttemptId = useRef(createFallbackAttemptId());

  useEffect(() => {
    if (typeof score !== 'number' || typeof total !== 'number') return;

    recordQcmMissionProgress({
      attemptId: typeof attemptId === 'string' ? attemptId : fallbackAttemptId.current,
      score,
      total,
    });
  }, [attemptId, score, total]);

  if (typeof score === 'undefined' || typeof total === 'undefined') {
    return <Navigate to="/home" replace />;
  }

  const percentage = Math.round((score / total) * 100);
  let message = "";
  let emoji = "";

  if (percentage === 100) { message = "Parfait !"; emoji = "🌟"; }
  else if (percentage >= 50) { message = "Bien joué !"; emoji = "👍"; }
  else { message = "Continue tes efforts !"; emoji = "💪"; }

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="trophy-icon">
            <Trophy size={64} color="#FFD700" />
        </div>
        <h1>{message} {emoji}</h1>
        <p className="theme-subtitle">Thème : {theme}</p>

        <div className="score-display">
          <span className="score-big">{score}</span>
          <span className="score-total">/ {total}</span>
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
