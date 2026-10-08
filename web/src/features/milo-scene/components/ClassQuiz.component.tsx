import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircleQuestion, RotateCcw, X } from "lucide-react";
import AnswerCard, { type AnswerCardState } from "@shared/components/quiz/AnswerCard.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import QuizBoardLoader from "@features/milo-scene/components/QuizBoardLoader.component";
import { emojiSrc } from "@shared/components/quiz/quiz.assets";
import { useExerciseStore } from "@features/exercices/store/exercise.store";
import type { QcmQuestion } from "@features/exercices/store/exercise.model";
import { postPerformance } from "@shared/api/tracking.api";
import { refreshAfterServerAction } from "@shared/lib/serverActions";
import { getAiErrorMessage } from "@shared/lib/aiRequests";
import { showToast } from "@shared/store/toast/toast.store";
import type { MiloAnimation } from "@features/milo-scene/hooks/useMiloScene";
import "@shared/styles/Quiz.css";

type QuizStep = "intro" | "loading" | "playing" | "done" | "error";

interface Answered {
	question: QcmQuestion;
	picked: string;
	correct: boolean;
}

interface ClassQuizProps {
	lessonId: number;
	lessonTitle: string;
	onClose: () => void;
	/** Milo réagit en 3D à chaque réponse */
	onReact: (animation: MiloAnimation, durationMs?: number) => void;
	/** « Pourquoi ? » : la question part dans la discussion avec Milo */
	onAskWhy: (question: string, picked: string, correct: string) => void;
}

const createAttemptId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/// 3 étoiles : sans faute · 2 : au moins 70 % · 1 : au moins 40 %
const starsFor = (percentage: number) =>
	percentage === 100 ? 3 : percentage >= 70 ? 2 : percentage >= 40 ? 1 : 0;

const VERDICTS = [
	"On revoit ça ensemble ?",
	"Pas mal, encore un effort !",
	"Super boulot !",
	"Sans faute, champion !",
];

/// Le quiz se joue directement au tableau : Milo reste à côté, réagit à
/// chaque réponse et explique les erreurs dans la discussion.
const ClassQuiz: React.FC<ClassQuizProps> = ({ lessonId, lessonTitle, onClose, onReact, onAskWhy }) => {
	const reduceMotion = useReducedMotion();
	const postQcm = useExerciseStore((state) => state.post_qcm);
	const [step, setStep] = useState<QuizStep>("intro");
	const [error, setError] = useState<string | null>(null);
	const [questions, setQuestions] = useState<QcmQuestion[]>([]);
	const [index, setIndex] = useState(0);
	const [picked, setPicked] = useState<string | null>(null);
	const [answers, setAnswers] = useState<Answered[]>([]);
	const [streak, setStreak] = useState(0);
	const [bestStreak, setBestStreak] = useState(0);
	const [rewardStreak, setRewardStreak] = useState<number | null>(null);
	const attemptRef = useRef(createAttemptId());
	const startedAtRef = useRef(Date.now());
	const sentRef = useRef(false);
	const runRef = useRef(0);
	const nextBtnRef = useRef<HTMLButtonElement>(null);

	const start = useCallback(async () => {
		const run = ++runRef.current;
		setStep("loading");
		setError(null);
		setIndex(0);
		setPicked(null);
		setAnswers([]);
		setStreak(0);
		setBestStreak(0);
		setRewardStreak(null);
		attemptRef.current = createAttemptId();
		sentRef.current = false;
		try {
			const data = await postQcm(lessonId);
			if (run !== runRef.current) return;
			if (!data?.length) throw new Error("QCM vide");
			setQuestions(data);
			startedAtRef.current = Date.now();
			setStep("playing");
		} catch (err) {
			if (run !== runRef.current) return;
			setError(getAiErrorMessage(err, { fallback: "Milo n'a pas réussi à préparer le quiz. Réessaie dans un instant." }));
			setStep("error");
		}
	}, [lessonId, postQcm]);


	// On ignore une génération en cours si l'élève ferme le quiz
	useEffect(() => () => void (runRef.current += 1), []);

	const question = questions[index] ?? null;
	const total = questions.length;
	const score = answers.filter((a) => a.correct).length;

	const choose = (option: string) => {
		if (!question || picked) return;
		const correct = option === question.correct_answer;
		setPicked(option);
		setAnswers((current) => [...current, { question, picked: option, correct }]);
		if (correct) {
			const next = streak + 1;
			setStreak(next);
			setBestStreak((best) => Math.max(best, next));
			onReact("Explaining", 1800);
		} else {
			setStreak(0);
			onReact("Wrong", 2400);
		}
		requestAnimationFrame(() => nextBtnRef.current?.focus());
	};

	const goNext = () => {
		if (index + 1 < total) {
			setIndex((i) => i + 1);
			setPicked(null);
		} else {
			setStep("done");
		}
	};

	// Fin du quiz : le résultat compte pour l'XP, la série et les missions
	useEffect(() => {
		if (step !== "done" || sentRef.current) return;
		sentRef.current = true;
		const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
		onReact(percentage >= 50 ? "Explaining" : "Disapointed", 3200);

		void postPerformance({
			kind: "qcm",
			lesson_id: lessonId,
			score,
			max_score: total,
			best_streak: bestStreak,
			duration_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
			attempt_id: attemptRef.current,
		})
			.then((result) => {
				if (result.duplicate) return;
				setRewardStreak(result.streak);
				result.missions_completed.forEach((mission) => {
					showToast(
						`Mission terminée : ${mission.title} +${mission.reward_xp} XP +${mission.reward_coins} coins`,
						"success",
					);
				});
				refreshAfterServerAction();
			})
			.catch((err) => console.error("Erreur lors de l'envoi du résultat :", err));
	}, [step, score, total, bestStreak, lessonId, onReact]);

	// Clavier : 1-4 pour répondre, Entrée pour continuer
	useEffect(() => {
		if (step !== "playing" || !question) return;
		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (target.closest("input, textarea")) return;
			const n = Number(event.key);
			if (!picked && n >= 1 && n <= question.options.length) {
				event.preventDefault();
				choose(question.options[n - 1]);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const cardState = (option: string): AnswerCardState => {
		if (!picked || !question) return "idle";
		if (option === question.correct_answer) return "correct";
		if (option === picked) return "wrong";
		return "dim";
	};

	const lastAnswer = picked ? answers[answers.length - 1] : null;
	const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
	const stars = starsFor(percentage);
	const mistakes = answers.filter((a) => !a.correct);

	const fade = reduceMotion
		? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
		: {
				initial: { opacity: 0, y: 18 },
				animate: { opacity: 1, y: 0 },
				exit: { opacity: 0, y: -12 },
			};

	return (
		<div className="cls-quiz">
			<header className={`cls-quiz-head${step === "loading" ? " cls-sr-only" : ""}`}>
				<div className="cls-quiz-title">
					<img src={emojiSrc("bullseye")} alt="" aria-hidden="true" />
					<div>
						<span className="cls-eyebrow">Quiz de la leçon</span>
						<strong>{lessonTitle}</strong>
					</div>
				</div>
				<button type="button" className="cls-icon-btn cls-icon-btn--chalk" onClick={onClose} aria-label="Quitter le quiz">
					<X size={20} />
				</button>
			</header>

			<AnimatePresence mode="wait">
				{step === "intro" && (
					<motion.div key="intro" className="cls-quiz-center" {...fade}>
						<img className="cls-quiz-hero-img" src={emojiSrc("brain")} alt="" aria-hidden="true" />
						<h2 className="cls-quiz-display">Teste-toi !</h2>
						<p className="cls-quiz-lead">
							Milo prépare quelques questions sur <b>toute la leçon</b>. Tu as la correction tout de suite, et chaque
							bonne réponse te rapporte de l'XP.
						</p>
						<ul className="cls-quiz-rules">
							<li>
								<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> pour répondre au clavier
							</li>
							<li>Une erreur ? Demande « Pourquoi ? » à Milo</li>
						</ul>
						<div className="cls-quiz-actions">
							<button type="button" className="cls-btn cls-btn--ghost-chalk" onClick={onClose}>
								Plus tard
							</button>
							<button type="button" className="cls-btn cls-btn--primary cls-btn--lg" onClick={start} autoFocus>
								Lancer le quiz
								<ArrowRight size={20} aria-hidden="true" />
							</button>
						</div>
					</motion.div>
				)}

				{step === "loading" && (
					<motion.div key="loading" className="cls-quiz-loading-wrap" {...fade}>
						<QuizBoardLoader onCancel={onClose} />
					</motion.div>
				)}

				{step === "error" && (
					<motion.div key="error" className="cls-quiz-center" {...fade} role="alert">
						<img className="cls-quiz-hero-img" src={emojiSrc("light_bulb")} alt="" aria-hidden="true" />
						<p className="cls-quiz-lead">{error}</p>
						<div className="cls-quiz-actions">
							<button type="button" className="cls-btn cls-btn--ghost-chalk" onClick={onClose}>
								Retour à la leçon
							</button>
							<button type="button" className="cls-btn cls-btn--primary" onClick={start}>
								<RotateCcw size={18} aria-hidden="true" />
								Réessayer
							</button>
						</div>
					</motion.div>
				)}

				{step === "playing" && question && (
					<motion.div key={`q-${index}`} className="cls-quiz-play" {...fade}>
						<div className="cls-quiz-progress">
							<span className="cls-quiz-count">
								Question <b>{index + 1}</b> sur {total}
							</span>
							<ol className="cls-quiz-track" aria-hidden="true">
								{questions.map((_, i) => {
									const a = answers[i];
									return (
										<li
											key={i}
											className={a ? (a.correct ? "is-ok" : "is-ko") : i === index ? "is-current" : ""}
										/>
									);
								})}
							</ol>
							{streak >= 2 && (
								<span className="cls-quiz-streak">
									<img src={emojiSrc("fire")} alt="" aria-hidden="true" />
									{streak} d'affilée
								</span>
							)}
						</div>

						<h2 className="cls-quiz-question">{question.question}</h2>

						<div className="qz-answers cls-quiz-answers">
							{question.options.map((option, i) => (
								<AnswerCard
									key={option}
									index={i}
									text={option}
									state={cardState(option)}
									disabled={Boolean(picked)}
									onSelect={() => choose(option)}
									celebrate={picked === option && option === question.correct_answer}
								/>
							))}
						</div>

						<AnimatePresence>
							{lastAnswer && (
								<motion.div
									className={`cls-quiz-feedback ${lastAnswer.correct ? "is-ok" : "is-ko"}`}
									initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
									animate={{ opacity: 1, y: 0 }}
									role="status"
								>
									<div className="cls-quiz-feedback-text">
										<strong>{lastAnswer.correct ? "Bien joué !" : "Pas tout à fait…"}</strong>
										{!lastAnswer.correct && (
											<span>
												La bonne réponse : <b>{question.correct_answer}</b>
											</span>
										)}
									</div>
									<div className="cls-quiz-feedback-actions">
										{!lastAnswer.correct && (
											<button
												type="button"
												className="cls-btn cls-btn--secondary cls-btn--sm"
												onClick={() => onAskWhy(question.question, lastAnswer.picked, question.correct_answer)}
											>
												<MessageCircleQuestion size={16} aria-hidden="true" />
												Pourquoi ?
											</button>
										)}
										<button ref={nextBtnRef} type="button" className="cls-btn cls-btn--primary cls-btn--sm" onClick={goNext}>
											{index + 1 < total ? "Question suivante" : "Voir mon score"}
											<ArrowRight size={16} aria-hidden="true" />
										</button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}

				{step === "done" && (
					<motion.div key="done" className="cls-quiz-center cls-quiz-done" {...fade}>
						{stars >= 2 && <ConfettiBurst count={40} spread={220} originX={50} originY={30} />}
						<div className="cls-quiz-stars" aria-label={`${stars} étoile${stars > 1 ? "s" : ""} sur 3`}>
							{[0, 1, 2].map((i) => (
								<motion.img
									key={i}
									src={emojiSrc("star")}
									alt=""
									className={i < stars ? "is-won" : ""}
									initial={reduceMotion ? false : { scale: 0, rotate: -40 }}
									animate={{ scale: 1, rotate: 0 }}
									transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.2 + i * 0.18 }}
								/>
							))}
						</div>
						<p className="cls-quiz-score">
							{score}
							<span>/{total}</span>
						</p>
						<h2 className="cls-quiz-verdict">{VERDICTS[stars]}</h2>
						{rewardStreak !== null && rewardStreak > 0 && (
							<p className="cls-quiz-reward">
								<img src={emojiSrc("fire")} alt="" aria-hidden="true" />
								Série de {rewardStreak} jour{rewardStreak > 1 ? "s" : ""} !
							</p>
						)}

						{mistakes.length > 0 && (
							<div className="cls-quiz-mistakes">
								<span className="cls-eyebrow">À revoir avec Milo</span>
								<ul>
									{mistakes.map((m, i) => (
										<li key={i}>
											<span>{m.question.question}</span>
											<button
												type="button"
												className="cls-btn cls-btn--secondary cls-btn--sm"
												onClick={() => onAskWhy(m.question.question, m.picked, m.question.correct_answer)}
											>
												<MessageCircleQuestion size={15} aria-hidden="true" />
												Pourquoi ?
											</button>
										</li>
									))}
								</ul>
							</div>
						)}

						<div className="cls-quiz-actions">
							<button type="button" className="cls-btn cls-btn--ghost-chalk" onClick={start}>
								<RotateCcw size={18} aria-hidden="true" />
								Nouveau quiz
							</button>
							<button type="button" className="cls-btn cls-btn--primary" onClick={onClose} autoFocus>
								Retour à la leçon
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

		</div>
	);
};

export default ClassQuiz;
