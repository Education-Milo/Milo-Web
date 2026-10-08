import React, { useEffect, useRef } from "react";
import { ArrowDown, SendHorizontal } from "lucide-react";
import type { OpenQuestionInputMode } from "@features/milo-scene/hooks/useMiloScene";

export type SheetMode =
	| { kind: "question" }
	| { kind: "exercise"; messageId: string; statement: string }
	| { kind: "open" };

interface SheetPaperProps {
	isEditing: boolean;
	mode: SheetMode;
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	onClose: () => void;
	maxLength: number;
	/** Milo répond encore à la demande précédente */
	busy: boolean;
	// Raccourcis du cours
	onSimplify?: () => void;
	onSummarize?: () => void;
	// Question ouverte
	openInputMode?: OpenQuestionInputMode;
	onOpenInputModeChange?: (mode: OpenQuestionInputMode) => void;
	/** Écran étroit : la feuille est loin, l'invitation passerait sur le décor */
	hideIdle?: boolean;
}

/** Le compteur n'apparaît qu'en approchant de la limite, pour ne pas distraire. */
const COUNTER_THRESHOLD = 0.8;

/// Contenu de la feuille posée sur le bureau : au repos, une invitation à
/// cliquer ; prise en main, l'élève y écrit directement à Milo.
const SheetPaper: React.FC<SheetPaperProps> = ({
	isEditing,
	mode,
	value,
	onChange,
	onSend,
	onClose,
	maxLength,
	busy,
	onSimplify,
	onSummarize,
	openInputMode = "answer",
	onOpenInputModeChange,
	hideIdle = false,
}) => {
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (!isEditing) return;
		// Tout de suite : l'élève peut écrire pendant que la feuille se soulève
		inputRef.current?.focus({ preventScroll: true });
	}, [isEditing, mode.kind]);

	if (!isEditing) {
		if (hideIdle) return null;
		return (
			<div className="cls-paper-idle">
				<img className="cls-paper-idle-emoji" src="/landing/emoji/fox.webp" alt="" aria-hidden="true" />
				<div>
					<p className="cls-paper-idle-title">
						Une <span className="cls-hl">question</span> ?
					</p>
					<p className="cls-paper-idle-sub">Clique ici pour écrire à Milo</p>
				</div>
			</div>
		);
	}

	const [titleStart, titleHl] =
		mode.kind === "exercise"
			? ["Ma", "réponse"]
			: mode.kind === "open"
				? openInputMode === "help"
					? ["Un", "indice"]
					: ["Ma", "réponse"]
				: ["Ma", "question"];
	const placeholder =
		mode.kind === "exercise"
			? "Écris ta réponse ici…"
			: mode.kind === "open"
				? openInputMode === "help"
					? "Sur quoi bloques-tu ?"
					: "Écris ta réponse ici…"
				: "Écris ta question ici…";
	const canSend = Boolean(value.trim()) && !busy;
	const showCounter = value.length >= maxLength * COUNTER_THRESHOLD;

	return (
		<form
			className="cls-paper-form"
			onSubmit={(e) => {
				e.preventDefault();
				if (canSend) onSend();
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onClose();
				}
			}}
		>
			<header className="cls-paper-head">
				<label htmlFor="cls-paper-input" className="cls-paper-title">
					{titleStart} <span className="cls-hl">{titleHl}</span>
				</label>
				<button type="button" className="cls-paper-close" onClick={onClose}>
					<ArrowDown size={16} aria-hidden="true" />
					Reposer
				</button>
			</header>

			{mode.kind === "exercise" && (
				<p className="cls-paper-statement">
					<img src="/landing/emoji/brain.webp" alt="" aria-hidden="true" />
					<span>{mode.statement}</span>
				</p>
			)}

			{mode.kind === "open" && onOpenInputModeChange && (
				<div className="cls-paper-toggle" role="radiogroup" aria-label="Ce que tu envoies à Milo">
					<button
						type="button"
						role="radio"
						aria-checked={openInputMode === "answer"}
						className={openInputMode === "answer" ? "is-on" : ""}
						onClick={() => onOpenInputModeChange("answer")}
					>
						<img src="/landing/emoji/student.webp" alt="" aria-hidden="true" />
						Je réponds
					</button>
					<button
						type="button"
						role="radio"
						aria-checked={openInputMode === "help"}
						className={openInputMode === "help" ? "is-on" : ""}
						onClick={() => onOpenInputModeChange("help")}
					>
						<img src="/landing/emoji/light_bulb.webp" alt="" aria-hidden="true" />
						Un indice
					</button>
				</div>
			)}

			<textarea
				id="cls-paper-input"
				ref={inputRef}
				className="cls-paper-input"
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						if (canSend) onSend();
					}
				}}
				maxLength={maxLength}
			/>

			<footer className="cls-paper-foot">
				{mode.kind === "question" && onSimplify && onSummarize ? (
					<div className="cls-paper-chips">
						<button type="button" className="cls-paper-chip" onClick={onSimplify} disabled={busy}>
							<img src="/landing/emoji/sparkles.webp" alt="" aria-hidden="true" />
							Je n'ai pas compris
						</button>
						<button type="button" className="cls-paper-chip" onClick={onSummarize} disabled={busy}>
							<img src="/landing/emoji/books.webp" alt="" aria-hidden="true" />
							Résume la partie
						</button>
					</div>
				) : (
					<span />
				)}
				{showCounter && (
					<span className={`cls-paper-count${value.length >= maxLength ? " is-full" : ""}`} aria-live="polite">
						{value.length} / {maxLength}
					</span>
				)}
				<button type="submit" className="cls-btn cls-btn--primary cls-btn--sm" disabled={!canSend}>
					Envoyer
					<SendHorizontal size={16} aria-hidden="true" />
				</button>
			</footer>
		</form>
	);
};

export default SheetPaper;
