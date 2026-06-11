import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useExerciseStore } from "@features/exercices/store/exercise.store";
import { ROUTES } from "@shared/constants/routes";
import type { QcmQuestion } from "@features/exercices/store/exercise.model";

interface QcmLocationState {
	qcmQuestions?: QcmQuestion[];
}

const createAttemptId = () => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const useExerciseScreen = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { lessonId } = useParams<{ lessonId: string }>();
	const generatedQuestions = (location.state as QcmLocationState | null)
		?.qcmQuestions;
	const postQcm = useExerciseStore((state) => state.post_qcm);

	const [questions, setQuestions] = useState<QcmQuestion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [score, setScore] = useState(0);
	const [streak, setStreak] = useState(0);
	const [showStreakAnimation, setShowStreakAnimation] = useState(false);
	const [showFireworks, setShowFireworks] = useState(false);
	const [attemptId] = useState(createAttemptId);

	useEffect(() => {
		if (!lessonId) {
			const storedQuestions = useExerciseStore.getState().questions;
			const ocrQuestions = Array.isArray(generatedQuestions)
				? generatedQuestions
				: Array.isArray(storedQuestions)
					? storedQuestions
					: [];

			if (ocrQuestions.length === 0) {
				setError("Aucun QCM généré à afficher.");
			} else {
				setQuestions(ocrQuestions);
				setError(null);
			}
			setLoading(false);
			return;
		}

		let isIgnore = false;
		const fetchQcm = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await postQcm(Number(lessonId));
				if (!isIgnore) {
					setQuestions(data);
				}
			} catch {
				setError("Impossible de charger le QCM.");
			} finally {
				setLoading(false);
			}
		};

		fetchQcm();
		return () => {
			isIgnore = true;
		};
	}, [generatedQuestions, lessonId, postQcm]);

	// Données courantes
	const totalQuestions = questions.length;
	const currentQuestion = questions[currentQuestionIndex] ?? null;
	const isAnswered = selectedAnswer !== null;
	const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
	const progress =
		totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;

	const getStreakMessage = () => {
		if (streak >= 5) return "🔥 EN FEU ! 🔥";
		if (streak >= 3) return "⚡ INCROYABLE ! ⚡";
		return null;
	};

	const selectAnswer = (option: string) => {
		if (isAnswered || !currentQuestion) return;
		setSelectedAnswer(option);

		if (option === currentQuestion.correct_answer) {
			setScore((prev) => prev + 1);
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
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
		} else {
			navigate(ROUTES.EXERCISE_RESULT, {
				state: { score, total: totalQuestions, attemptId },
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
