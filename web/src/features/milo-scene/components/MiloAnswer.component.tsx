import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Eye, PencilLine, Square, Volume2 } from "lucide-react";
import RichText from "@features/milo-scene/components/RichText.component";
import ChalkTitle from "@features/milo-scene/components/ChalkTitle.component";
import { useChalkReveal } from "@features/milo-scene/hooks/useChalkReveal";
import type { MiloAction, ThreadMessage } from "@features/milo-scene/hooks/useMiloScene";

/** Titre écrit au tableau au-dessus de la réponse de Milo */
const TITLES: Partial<Record<MiloAction, string>> = {
	question: "Milo te répond",
	explain: "Autrement dit…",
	example: "Un exemple",
	exercise: "À toi de jouer !",
	simplify: "Plus simplement",
	summary: "L'essentiel",
	answer: "Correction",
	solution: "Correction",
	quizWhy: "Pourquoi ?",
	openAnswer: "Correction",
	openHelp: "Un indice",
	notes: "Révise tes notes",
};

/** Le mot du titre écrit en couleur */
const HIGHLIGHTS: Partial<Record<MiloAction, string>> = {
	question: "répond",
	example: "exemple",
	exercise: "jouer",
	simplify: "simplement",
	summary: "L'essentiel",
	openHelp: "indice",
	notes: "notes",
};

interface MiloAnswerProps {
	/** Demande de l'élève (avec le passage concerné) */
	request?: ThreadMessage;
	answer: ThreadMessage;
	/** Retour au cours (absent en question ouverte) */
	backLabel?: string;
	onBack?: () => void;
	canListen: boolean;
	isSpeaking: boolean;
	onListen: () => void;
	onStopListening: () => void;
	isSaved: boolean;
	onSave?: () => void;
	onAnswerExercise: () => void;
	onRevealSolution: () => void;
}

/// Réponse de Milo écrite au tableau, à la craie, à la place du cours le
/// temps de la lire.
const MiloAnswer: React.FC<MiloAnswerProps> = ({
	request,
	answer,
	backLabel = "Revenir au cours",
	onBack,
	canListen,
	isSpeaking,
	onListen,
	onStopListening,
	isSaved,
	onSave,
	onAnswerExercise,
	onRevealSolution,
}) => {
	const reduceMotion = useReducedMotion();
	const reveal = useChalkReveal(answer.pending ? "" : answer.text, `${answer.id}-${answer.pending ? "p" : "r"}`);
	const exerciseOpen = answer.exercise?.status === "open";
	const ready = !answer.pending && reveal.done;

	return (
		<div className="cls-board-view">
			<header className="cls-board-head">
				<div className="cls-board-titles">
					<span className="cls-chalk-eyebrow">
						<i />
						{answer.pending ? "Milo réfléchit…" : answer.action === "exercise" ? "Exercice de Milo" : "Milo au tableau"}
					</span>
					<ChalkTitle
						text={answer.pending ? "Une seconde…" : (TITLES[answer.action] ?? "Milo te répond")}
						highlight={answer.pending ? undefined : HIGHLIGHTS[answer.action]}
					/>
				</div>
				{onBack && (
					<button type="button" className="cls-btn cls-btn--chalk cls-btn--sm" onClick={onBack}>
						<ArrowLeft size={18} aria-hidden="true" />
						{backLabel}
					</button>
				)}
			</header>

			{request?.quote && <blockquote className="cls-board-quote">« {request.quote} »</blockquote>}
			{request && !request.quote && (
				<p className="cls-board-asked">
					<span>Ta question</span> {request.text}
				</p>
			)}

			<div
				className={`cls-board-content${ready ? "" : " is-writing"}`}
				aria-live="polite"
				onClick={reveal.done ? undefined : reveal.skip}
			>
				{answer.pending ? (
					<span className="cls-chalk-dots" aria-label="Milo réfléchit">
						<i />
						<i />
						<i />
					</span>
				) : (
					<>
						<RichText text={reveal.text} className={`cls-rich${answer.failed ? " is-failed" : ""}`} />
						{!reveal.done && <span className="cls-chalk-caret" aria-hidden="true" />}
					</>
				)}
			</div>

			<AnimatePresence>
				{ready && !answer.failed && (
					<motion.footer
						className="cls-board-tools"
						initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 380, damping: 22 }}
					>
						{exerciseOpen && (
							<>
								<button type="button" className="cls-btn cls-btn--primary cls-btn--sm" onClick={onAnswerExercise}>
									<PencilLine size={18} aria-hidden="true" />
									Je réponds sur ma feuille
								</button>
								<button type="button" className="cls-btn cls-btn--chalk cls-btn--sm" onClick={onRevealSolution}>
									<Eye size={18} aria-hidden="true" />
									Voir la correction
								</button>
							</>
						)}
						<span className="cls-board-tools-spacer" />
						{canListen && (
							<button
								type="button"
								className={`cls-btn cls-btn--chalk cls-btn--sm${isSpeaking ? " is-on" : ""}`}
								onClick={isSpeaking ? onStopListening : onListen}
							>
								{isSpeaking ? <Square size={15} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
								{isSpeaking ? "Arrêter" : "Écouter"}
							</button>
						)}
						{onSave && (
							<button type="button" className="cls-btn cls-btn--chalk cls-btn--sm" onClick={onSave} disabled={isSaved}>
								{isSaved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
								{isSaved ? "Dans mes notes" : "Noter"}
							</button>
						)}
					</motion.footer>
				)}
			</AnimatePresence>
		</div>
	);
};

export default MiloAnswer;
