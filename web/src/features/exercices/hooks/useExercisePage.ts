import { useState, useEffect, useRef } from "react";
import { useActivityTracker } from "@shared/hooks/useActivityTracker";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useExerciseStore } from "@features/exercices/store/exercise.store";
import { ROUTES } from "@shared/constants/routes";
import type { QcmQuestion } from "@features/exercices/store/exercise.model";
import { isStreakMilestone } from "@shared/components/quiz/streak.utils";
import { getAiErrorMessage } from "@shared/lib/aiRequests";

/// Durée de l'explosion plein écran au passage d'un palier de série
const STREAK_BURST_MS = 3400;

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
	/// Palier de série à célébrer (null : rien à afficher)
	const [burstStreak, setBurstStreak] = useState<number | null>(null);
	/// Résultat de chaque question déjà répondue, dans l'ordre
	const [history, setHistory] = useState<boolean[]>([]);
	const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Généré une seule fois par tentative : rend POST /tracking/performance idempotent.
	const [attemptId] = useState(createAttemptId);
	const [bestStreak, setBestStreak] = useState(0);
	const startedAtRef = useRef(Date.now());
	const numericLessonId = lessonId ? Number(lessonId) : undefined;

	// Télémétrie : durée de la session de QCM
	useActivityTracker({ activityType: "study_session", lessonId: numericLessonId });

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
			} catch (err) {
				setError(getAiErrorMessage(err, { fallback: "Impossible de charger le QCM." }));
			} finally {
				setLoading(false);
			}
		};

		fetchQcm();
		return () => {
			isIgnore = true;
		};
	}, [generatedQuestions, lessonId, postQcm]);

	useEffect(() => () => {
		if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
	}, []);

	// Données courantes
	const totalQuestions = questions.length;
	const currentQuestion = questions[currentQuestionIndex] ?? null;
	const isAnswered = selectedAnswer !== null;
	const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
	const progress =
		totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;

	const selectAnswer = (option: string) => {
		if (isAnswered || !currentQuestion) return;
		setSelectedAnswer(option);
		const correct = option === currentQuestion.correct_answer;
		setHistory((prev) => [...prev, correct]);

		if (correct) {
			setScore((prev) => prev + 1);
			const newStreak = streak + 1;
			setStreak(newStreak);
			setBestStreak((current) => Math.max(current, newStreak));

			if (isStreakMilestone(newStreak)) {
				setBurstStreak(newStreak);
				if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
				burstTimerRef.current = setTimeout(() => setBurstStreak(null), STREAK_BURST_MS);
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
				state: {
					score,
					total: totalQuestions,
					attemptId,
					bestStreak,
					durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
					lessonId: numericLessonId,
				},
			});
		}
	};

	const dismissStreakBurst = () => {
		if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
		setBurstStreak(null);
	};

	return {
		dismissStreakBurst,
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
		bestStreak,
		burstStreak,
		history,
		selectAnswer,
		nextQuestion,
	};
};
