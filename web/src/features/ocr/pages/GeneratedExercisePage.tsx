import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Download, Eye, Lightbulb } from "lucide-react";
import APIAxios, { APIRoutes } from "@api/axios.api";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { ROUTES } from "@shared/constants/routes";
import { useGeneratedExerciseStore } from "../store/generatedExercise.store";
import type { GeneratedExercise } from "../types/ocr.types";
import styles from "./GeneratedExercisePage.module.css";

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

	const canUseHint = (index: number) => {
		if (!generatedExercise) return false;
		if (hints[index].content || hints[index].isLoading) return false;
		if (index === 0) return true;

		const previousHintRead = Boolean(hints[index - 1].content);
		const unlocked = hints[index].unlockAt !== null && now >= hints[index].unlockAt;
		return previousHintRead && unlocked;
	};

	const canShowAnswer =
		Boolean(hints[HINT_COUNT - 1].content) && studentAnswer.trim().length === 0;

	const printExercise = () => {
		window.print();
	};

	if (!generatedExercise) {
		return (
			<ScreenLayout>
				<section className={styles.page}>
					<div className={styles.emptyState}>
						<h1>Aucun exercice généré</h1>
						<p>Importe d'abord un exercice pour générer un énoncé similaire.</p>
						<button type="button" onClick={() => navigate(ROUTES.OCR)}>
							Retour à l'import
						</button>
					</div>
				</section>
			</ScreenLayout>
		);
	}

	return (
		<ScreenLayout>
			<section className={styles.page}>
				<div className={`${styles.toolbar} ${styles.noPrint}`}>
					<button
						type="button"
						className={styles.secondaryButton}
						onClick={() => navigate(ROUTES.OCR)}
					>
						<ArrowLeft size={18} />
						<span>Nouvel import</span>
					</button>
					<button type="button" className={styles.primaryButton} onClick={printExercise}>
						<Download size={18} />
						<span>Exporter en PDF</span>
					</button>
				</div>

				<div className={styles.layout}>
					<article className={styles.exerciseSheet}>
						<header className={styles.sheetHeader}>
							<div>
								<p className={styles.sheetEyebrow}>Exercice similaire</p>
								<h1>Travail à faire</h1>
							</div>
							<div className={styles.sheetMeta}>
								<span>Nom :</span>
								<span>Date :</span>
								<span>Classe :</span>
							</div>
						</header>

						<div className={styles.instructions}>
							<p>
								Lis attentivement l'énoncé, rédige les étapes de ton raisonnement
								et justifie les résultats obtenus.
							</p>
						</div>

						<div className={styles.statement}>
							{exerciseParagraphs.map((paragraph, index) => (
								<p key={`${paragraph}-${index}`}>{paragraph}</p>
							))}
						</div>
					</article>

					<aside className={`${styles.helpPanel} ${styles.noPrint}`}>
						<section className={styles.answerBox}>
							<h2>Ma réponse</h2>
							<textarea
								value={studentAnswer}
								onChange={(event) => setStudentAnswer(event.target.value)}
								placeholder="Écris ta réponse ici avant de demander trop d'aide..."
							/>
						</section>

						<section className={styles.hintsBox}>
							<h2>Indices de Milo</h2>
							{hintError && <p className={styles.errorMessage}>{hintError}</p>}

							{hints.map((hint, index) => {
								const lockedUntil = hint.unlockAt ? hint.unlockAt - now : 0;
								const isLocked =
									index > 0 &&
									!hint.content &&
									(!hints[index - 1].content || lockedUntil > 0);

								return (
									<div
										key={`hint-${index + 1}`}
										className={`${styles.hintCard} ${isLocked ? styles.locked : ""}`}
									>
										<div className={styles.hintHeader}>
											<div>
												<span className={styles.hintIcon}>
													<Lightbulb size={16} />
												</span>
												<strong>Indice {index + 1}</strong>
											</div>
											{isLocked && lockedUntil > 0 && (
												<span className={styles.timer}>
													<Clock size={14} />
													{formatTimeLeft(lockedUntil)}
												</span>
											)}
										</div>

										{hint.content ? (
											<p className={styles.hintContent}>{hint.content}</p>
										) : (
											<button
												type="button"
												onClick={() => getHint(index)}
												disabled={!canUseHint(index)}
												className={styles.hintButton}
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
									className={styles.answerButton}
									onClick={() => setShowAnswer(true)}
								>
									<Eye size={18} />
									<span>Afficher la réponse</span>
								</button>
							)}

							{showAnswer && (
								<div className={styles.solutionBox}>
									<h3>Correction</h3>
									{answerParagraphs.map((paragraph, index) => (
										<p key={`${paragraph}-${index}`}>{paragraph}</p>
									))}
								</div>
							)}
						</section>
					</aside>
				</div>
			</section>
		</ScreenLayout>
	);
};

export default GeneratedExercisePage;
