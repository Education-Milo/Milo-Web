import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Download, Eye, Lightbulb, Send } from "lucide-react";
import APIAxios, { APIRoutes } from "@api/axios.api";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { ROUTES } from "@shared/constants/routes";
import { useGeneratedExerciseStore } from "../store/generatedExercise.store";
import type { GeneratedExercise } from "../types/ocr.types";
import "@features/ocr/styles/OcrScreen.css";

interface GeneratedExerciseLocationState {
	generatedExercise?: GeneratedExercise;
}

interface HintState {
	content: string | null;
	unlockAt: number | null;
	isLoading: boolean;
}

const HINT_WAIT_MS = 2 * 60 * 1000;
const HINT_COUNT = 3;

const formatTimeLeft = (milliseconds: number) => {
	const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const splitParagraphs = (content: string) =>
	content
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

const GeneratedExercisePage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const storedExercise = useGeneratedExerciseStore(
		(state) => state.generatedExercise,
	);

	const generatedExercise =
		(location.state as GeneratedExerciseLocationState | null)
			?.generatedExercise ?? storedExercise;

	const [hints, setHints] = useState<HintState[]>(
		Array.from({ length: HINT_COUNT }, () => ({
			content: null,
			unlockAt: null,
			isLoading: false,
		})),
	);
	const [studentAnswer, setStudentAnswer] = useState("");
	const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
	const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
	const [answerError, setAnswerError] = useState<string | null>(null);
	const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
	const [hintError, setHintError] = useState<string | null>(null);
	const [showAnswer, setShowAnswer] = useState(false);
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	const exerciseParagraphs = useMemo(
		() => splitParagraphs(generatedExercise?.exercise ?? ""),
		[generatedExercise?.exercise],
	);

	const answerParagraphs = useMemo(
		() => splitParagraphs(generatedExercise?.answer ?? ""),
		[generatedExercise?.answer],
	);

	const getHint = async (index: number) => {
		if (!generatedExercise) return;

		setHintError(null);
		setHints((current) =>
			current.map((hint, hintIndex) =>
				hintIndex === index ? { ...hint, isLoading: true } : hint,
			),
		);

		try {
			const formData = new FormData();
			formData.append(
				"chat_request",
				`Donne l'indice ${index + 1} pour aider l'élève à résoudre cet exercice. L'indice doit être progressif, sans donner la réponse complète.`,
			);
			formData.append("conversation_id", generatedExercise.conversationId);
			formData.append("context", generatedExercise.exercise);

			const { data } = await APIAxios.post(APIRoutes.POST_Free_Chat, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const content =
				data.reply ?? data.content ?? data.message ?? "Milo n'a pas renvoyé d'indice.";

			setHints((current) =>
				current.map((hint, hintIndex) => {
					if (hintIndex === index) {
						return { ...hint, content, isLoading: false };
					}

					if (hintIndex === index + 1) {
						return { ...hint, unlockAt: Date.now() + HINT_WAIT_MS };
					}

					return hint;
				}),
			);
		} catch {
			setHintError("Impossible de récupérer l'indice pour le moment.");
			setHints((current) =>
				current.map((hint, hintIndex) =>
					hintIndex === index ? { ...hint, isLoading: false } : hint,
				),
			);
		}
	};

	const submitAnswer = async () => {
		if (!generatedExercise || !studentAnswer.trim() || isSubmittingAnswer) return;

		setAnswerError(null);
		setIsSubmittingAnswer(true);

		try {
			const formData = new FormData();
			formData.append(
				"chat_request",
				`Tu es un professeur bienveillant qui corrige la réponse d'un élève.

				Énoncé de l'exercice : "${generatedExercise.exercise}"
				Réponse de l'élève : "${studentAnswer.trim()}"

				Donne un retour constructif et encourageant en 3 parties :
				1. Ce qui est bien dans la réponse
				2. Ce qui pourrait être amélioré ou complété
				3. Une piste courte pour finaliser, sans rédiger la solution complète

				Continue la conversation en cours sans saluer l'élève.
				Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".
				Sois chaleureux, bref et pédagogique.`,
			);
			formData.append("conversation_id", generatedExercise.conversationId);
			formData.append("context", generatedExercise.exercise);

			const { data } = await APIAxios.post(APIRoutes.POST_Free_Chat, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const content =
				data.reply ?? data.content ?? data.message ??
				"Milo n'a pas réussi à corriger ta réponse.";

			setAnswerFeedback(content);
			setHasSubmittedAnswer(true);
		} catch {
			setAnswerError("Impossible d'envoyer ta réponse pour le moment. Réessaie !");
		} finally {
			setIsSubmittingAnswer(false);
		}
	};

	const canUseHint = (index: number) => {
		if (!generatedExercise) return false;
		if (hints[index].content || hints[index].isLoading) return false;
		if (index === 0) return true;

		const previousHintRead = Boolean(hints[index - 1].content);
		const unlocked = hints[index].unlockAt !== null && now >= hints[index].unlockAt;
		return previousHintRead && unlocked;
	};

	const canShowAnswer =
		hasSubmittedAnswer || Boolean(hints[HINT_COUNT - 1].content);

	const printExercise = () => {
		window.print();
	};

	if (!generatedExercise) {
		return (
			<ScreenLayout>
				<div className="ocr-page">
					<div className="ocr-empty-state">
						<h1>Aucun exercice généré</h1>
						<p>Importe d'abord un exercice pour générer un énoncé similaire.</p>
						<button type="button" onClick={() => navigate(ROUTES.OCR)}>
							Retour à l'import
						</button>
					</div>
				</div>
			</ScreenLayout>
		);
	}

	return (
		<ScreenLayout>
			<div className="ocr-page">
				<div className={`ocr-ex-toolbar ocr-no-print`}>
					<button
						type="button"
						className="ocr-btn-secondary"
						onClick={() => navigate(ROUTES.OCR)}
					>
						<ArrowLeft size={18} />
						<span>Nouvel import</span>
					</button>
					<button type="button" className="ocr-btn-primary" onClick={printExercise}>
						<Download size={18} />
						<span>Exporter en PDF</span>
					</button>
				</div>

				<div className="ocr-ex-layout">
					<article className="ocr-ex-sheet">
						<header className="ocr-ex-sheet-header">
							<div>
								<p className="ocr-ex-eyebrow">Exercice similaire</p>
								<h1>Travail à faire</h1>
							</div>
							<div className="ocr-ex-sheet-meta">
								<span>Nom :</span>
								<span>Date :</span>
								<span>Classe :</span>
							</div>
						</header>

						<div className="ocr-ex-instructions">
							<p>
								Lis attentivement l'énoncé, rédige les étapes de ton raisonnement
								et justifie les résultats obtenus.
							</p>
						</div>

						<div className="ocr-ex-statement">
							{exerciseParagraphs.map((paragraph, index) => (
								<p key={`${paragraph}-${index}`}>{paragraph}</p>
							))}
						</div>
					</article>

					<aside className={`ocr-ex-help ocr-no-print`}>
						<section className="ocr-ex-answer-box">
							<h2>Ma réponse</h2>
							<textarea
								value={studentAnswer}
								onChange={(event) => setStudentAnswer(event.target.value)}
								placeholder="Écris ta réponse ici avant de demander trop d'aide..."
								disabled={isSubmittingAnswer}
							/>
							{answerError && <p className="ocr-hint-error">{answerError}</p>}
							<button
								type="button"
								className="ocr-btn-primary"
								style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
								onClick={submitAnswer}
								disabled={!studentAnswer.trim() || isSubmittingAnswer}
							>
								<Send size={18} />
								<span>
									{isSubmittingAnswer
										? "Milo corrige..."
										: answerFeedback
											? "Renvoyer ma réponse"
											: "Envoyer ma réponse à Milo"}
								</span>
							</button>
							{answerFeedback && (
								<div className="ocr-ex-feedback-box">
									<h3>Correction de Milo</h3>
									{splitParagraphs(answerFeedback).map((paragraph, index) => (
										<p key={`feedback-${paragraph}-${index}`}>{paragraph}</p>
									))}
								</div>
							)}
						</section>

						<section className="ocr-ex-hints-box">
							<h2>Indices de Milo</h2>
							{hintError && <p className="ocr-hint-error">{hintError}</p>}

							{hints.map((hint, index) => {
								const lockedUntil = hint.unlockAt ? hint.unlockAt - now : 0;
								const isLocked =
									index > 0 &&
									!hint.content &&
									(!hints[index - 1].content || lockedUntil > 0);

								return (
									<div
										key={`hint-${index + 1}`}
										className={`ocr-hint-card ${isLocked ? "ocr-hint-card-locked" : ""}`}
									>
										<div className="ocr-hint-header">
											<div>
												<span className="ocr-hint-icon">
													<Lightbulb size={16} />
												</span>
												<strong>Indice {index + 1}</strong>
											</div>
											{isLocked && lockedUntil > 0 && (
												<span className="ocr-hint-timer">
													<Clock size={14} />
													{formatTimeLeft(lockedUntil)}
												</span>
											)}
										</div>

										{hint.content ? (
											<p className="ocr-hint-content">{hint.content}</p>
										) : (
											<button
												type="button"
												onClick={() => getHint(index)}
												disabled={!canUseHint(index)}
												className="ocr-btn-hint"
											>
												{hint.isLoading ? "Milo réfléchit..." : "Afficher l'indice"}
											</button>
										)}
									</div>
								);
							})}

							{canShowAnswer && !showAnswer && (
								<button
									type="button"
									className="ocr-btn-show-answer"
									onClick={() => setShowAnswer(true)}
								>
									<Eye size={18} />
									<span>Afficher la réponse</span>
								</button>
							)}

							{showAnswer && (
								<div className="ocr-ex-solution-box">
									<h3>Correction</h3>
									{answerParagraphs.map((paragraph, index) => (
										<p key={`${paragraph}-${index}`}>{paragraph}</p>
									))}
								</div>
							)}
						</section>
					</aside>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default GeneratedExercisePage;