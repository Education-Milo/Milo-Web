import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useExerciseScreen } from '@hooks/useExercisePage';
import "@styles/ExerciseScreen.css";

const ExerciseScreen: React.FC = () => {
  const navigate = useNavigate();
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
    showStreakAnimation,
    showFireworks,
    streakMessage,
    selectAnswer,
    nextQuestion,
  } = useExerciseScreen();

  if (loading) {
    return (
      <div className="qcm-page">
        <div className="qcm-container">
          <div className="loading-state">Chargement du QCM...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qcm-page">
        <div className="qcm-container">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="action-btn secondary">Retour</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="qcm-page">
      {/* Fireworks */}
      {showFireworks && (
        <div className="fireworks-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="firework" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`
            }} />
          ))}
        </div>
      )}

      <div className="qcm-container">
        {/* Header */}
        <div className="header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
          </button>
          <h1>QCM</h1>
        </div>

        {/* Progress */}
        <div className="progress-bar-container">
          <div className="progress-info">
            <span className="question-counter">
              Question {currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <span className="score-display">
              Score : {score}/{totalQuestions}
              {streak >= 2 && (
                <span className="streak-indicator"> 🔥 {streak}</span>
              )}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Streak animation */}
        {showStreakAnimation && streakMessage && (
          <div className="streak-animation">
            <div className="streak-text">{streakMessage}</div>
            <div className="streak-count">{streak} D'AFFILÉE !</div>
          </div>
        )}

        {/* Question card */}
        <div className="question-card">
          <div className="question-number">QUESTION {currentQuestionIndex + 1}</div>
          <div className="question-text">{currentQuestion.question}</div>

          <div className="answers-grid">
            {currentQuestion.options.map((option, index) => {
              let btnClass = 'answer-btn';
              if (isAnswered) {
                if (option === currentQuestion.correct_answer) btnClass += ' correct';
                else if (option === selectedAnswer)            btnClass += ' incorrect';
              }
              return (
                <button
                  key={index}
                  className={btnClass}
                  onClick={() => selectAnswer(option)}
                  disabled={isAnswered}
                >
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div className={`inline-feedback ${isCorrect ? 'success' : 'error'}`}>
              <div className="feedback-message">
                {isCorrect ? '✅ Bonne réponse !' : (
                  <>
                    ❌ Mauvaise réponse —{' '}
                    <strong>Réponse correcte : {currentQuestion.correct_answer}</strong>
                  </>
                )}
              </div>
              <button className="next-btn" onClick={nextQuestion}>
                {currentQuestionIndex < totalQuestions - 1 ? 'Suivant →' : 'Voir les Résultats'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseScreen;