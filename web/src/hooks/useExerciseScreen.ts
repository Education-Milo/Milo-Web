import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExerciseStore } from '@store/exercise/exercise.store';
import { ROUTES } from '@constants/routes';
import type { QcmQuestion } from '@store/exercise/exercise.model';

export const useExerciseScreen = () => {
    const navigate = useNavigate();
    const { lessonId } = useParams<{ lessonId: string }>();

    const { post_qcm } = useExerciseStore();

    const [questions, setQuestions] = useState<QcmQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showStreakAnimation, setShowStreakAnimation] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);

    useEffect(() => {
        if (!lessonId) {
            navigate(ROUTES.COURSES);
            return;
        }
        let isIgnore = false;
        const fetchQcm = async () => {
            try {
                setLoading(true);
                const data = await post_qcm(Number(lessonId));
                if (!isIgnore) {
                    setQuestions(data);
                }
            } catch {
                setError('Impossible de charger le QCM.');
            } finally {
                setLoading(false);
            }
        };

        fetchQcm();
        return () => {
            isIgnore = true;
        };
    }, [lessonId]);

    // Données courantes
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQuestionIndex] ?? null;
    const isAnswered = selectedAnswer !== null;
    const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
    const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;

    const getStreakMessage = () => {
        if (streak >= 5) return "🔥 EN FEU ! 🔥";
        if (streak >= 3) return "⚡ INCROYABLE ! ⚡";
        return null;
    };

    const selectAnswer = (option: string) => {
        if (isAnswered || !currentQuestion) return;
        setSelectedAnswer(option);

        if (option === currentQuestion.correct_answer) {
            setScore(prev => prev + 1);
            const newStreak = streak + 1;
            setStreak(newStreak);

            if (newStreak >= 3) {
                setShowStreakAnimation(true);
                setTimeout(() => setShowStreakAnimation(false), 2000);
            }
            if (newStreak >= 5) {
                setShowFireworks(true);
                setTimeout(() => setShowFireworks(false), 3000);
            }
        } else {
            setStreak(0);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex + 1 < totalQuestions) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            navigate(ROUTES.EXERCISE_RESULT, {
                state: { score, total: totalQuestions }
            });
        }
    };

    return {
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
        streakMessage: getStreakMessage(),
        selectAnswer,
        nextQuestion,
    };
};