import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Volume2, X } from "lucide-react";
import {
	flattenSentences,
	BOX_EMOJI,
	parseBoardText,
	plainText,
	type BoardBlock,
	type BoardNode,
} from "@features/milo-scene/utils/lessonText";
import InlineText from "@features/milo-scene/components/InlineText.component";

export type PassageAction = "explain" | "example" | "exercise" | "listen" | "save";

interface ToolbarTarget {
	text: string;
	/** Phrase survolée (null : texte sélectionné à la souris) */
	index: number | null;
	/** Ouverte au clic / clavier : ne se ferme pas quand la souris s'éloigne */
	pinned: boolean;
	top: number;
	left: number;
	below: boolean;
	/** Hauteur de la phrase, pour passer la barre en dessous si besoin */
	lineHeight?: number;
}

interface LessonBoardProps {
	text: string;
	isWriting: boolean;
	/** Les phrases ne sont survolables qu'une fois la partie écrite */
	interactive: boolean;
	/** Phrase lue à voix haute en ce moment */
	speakingIndex: number | null;
	/** Phrases déjà épinglées dans « Ma fiche » (texte brut) */
	savedTexts: Set<string>;
	canListen: boolean;
	onAction: (action: PassageAction, text: string) => void;
	/** Un clic n'importe où sur le tableau pendant l'écriture affiche tout */
	onSkip: () => void;
	/** Écran étroit : les actions s'ouvrent en feuille au bas de l'écran */
	compact?: boolean;
}

const TOOLBAR_WIDTH = 600;
const TOOLBAR_HEIGHT = 52;
const HOVER_HIDE_DELAY = 260;

/// Icônes 3D de la charte (/public/landing/emoji) ; « Écouter » n'a pas
/// d'équivalent 3D : il garde un pictogramme dans une pastille
const ACTIONS: { id: PassageAction; label: string; hint: string; emoji?: string }[] = [
	{ id: "explain", label: "Ré-expliquer", hint: "Milo t'explique ce passage autrement", emoji: "speech_balloon" },
	{ id: "example", label: "Un exemple", hint: "Milo te donne un exemple concret", emoji: "light_bulb" },
	{ id: "exercise", label: "Exercice", hint: "Milo invente un exercice sur ce passage", emoji: "brain" },
	{ id: "listen", label: "Écouter", hint: "Milo te lit ce passage" },
	{ id: "save", label: "Noter", hint: "Coller ce passage sur ton post-it « Mes notes »", emoji: "card_index_dividers" },
];

/// Le tableau de la classe : la partie s'y écrit à la craie, et chaque phrase
/// devient un point d'entrée vers Milo (survol, clic, clavier ou sélection).
const LessonBoard: React.FC<LessonBoardProps> = ({
	text,
	isWriting,
	interactive,
	speakingIndex,
	savedTexts,
	canListen,
	onAction,
	onSkip,
	compact = false,
}) => {
	const reduceMotion = useReducedMotion();
	const contentRef = useRef<HTMLDivElement>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastFocused = useRef<HTMLElement | null>(null);
	const [target, setTarget] = useState<ToolbarTarget | null>(null);

	const nodes: BoardNode[] = useMemo(() => parseBoardText(text), [text]);

	const cancelHide = () => {
		if (hideTimer.current) clearTimeout(hideTimer.current);
		hideTimer.current = null;
	};

	const close = useCallback((restoreFocus = false) => {
		cancelHide();
		setTarget(null);
		if (restoreFocus) lastFocused.current?.focus();
	}, []);

	// Nouveau texte : on range la barre d'outils
	useEffect(() => close(), [text, interactive, close]);
	useEffect(() => () => cancelHide(), []);

	/// Position de la barre : au-dessus de la première ligne de la phrase, ou
	/// en dessous de la dernière s'il n'y a pas la place.
	const placeFor = useCallback((rects: DOMRect[]) => {
		const content = contentRef.current;
		if (!content || rects.length === 0) return null;
		const box = content.getBoundingClientRect();
		/// Le tableau 3D est mis à l'échelle par la caméra : les mesures à
		/// l'écran sont ramenées en pixels CSS du tableau
		const scale = box.width / (content.offsetWidth || box.width) || 1;
		const first = rects[0];
		const last = rects[rects.length - 1];
		const boxWidth = content.clientWidth;
		const width = Math.min(TOOLBAR_WIDTH, boxWidth);
		const left = Math.min(Math.max((first.left - box.left) / scale, 0), Math.max(boxWidth - width, 0));
		const above = (first.top - box.top) / scale + content.scrollTop - TOOLBAR_HEIGHT - 10;
		const below = above < content.scrollTop;
		return {
			left,
			below,
			top: below ? (last.bottom - box.top) / scale + content.scrollTop + 10 : above,
			lineHeight: (last.bottom - first.top) / scale,
		};
	}, []);

	const openForSentence = (element: HTMLElement, index: number, sentence: string, pinned: boolean) => {
		if (!interactive) return;
		cancelHide();
		const place = placeFor(Array.from(element.getClientRects()));
		if (!place) return;
		setTarget({ text: plainText(sentence), index, pinned, ...place });
	};

	const scheduleHide = () => {
		if (target?.pinned) return;
		cancelHide();
		hideTimer.current = setTimeout(() => setTarget((t) => (t?.pinned ? t : null)), HOVER_HIDE_DELAY);
	};

	/// Texte sélectionné à la souris : mêmes actions que pour une phrase
	const handleMouseUp = () => {
		if (!interactive) return;
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed || !contentRef.current) return;
		const selected = selection.toString().trim();
		if (selected.length < 3) return;
		const range = selection.getRangeAt(0);
		if (!contentRef.current.contains(range.commonAncestorContainer)) return;
		const place = placeFor(Array.from(range.getClientRects()));
		if (place) setTarget({ text: plainText(selected), index: null, pinned: true, ...place });
	};

	// Clic en dehors / Échap : on ferme une barre épinglée
	useEffect(() => {
		if (!target?.pinned) return;
		const onPointer = (event: PointerEvent) => {
			const node = event.target as Node;
			if (toolbarRef.current?.contains(node)) return;
			if ((node as HTMLElement).closest?.(".cls-sentence")) return;
			close();
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") close(true);
		};
		window.addEventListener("pointerdown", onPointer);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("pointerdown", onPointer);
			window.removeEventListener("keydown", onKey);
		};
	}, [target?.pinned, close]);

	/// Une fois affichée, la barre est mesurée : si elle dépasse à droite ou en
	/// haut / en bas de la zone du tableau, on la recale pour qu'elle reste
	/// entièrement visible.
	useLayoutEffect(() => {
		const toolbar = toolbarRef.current;
		const content = contentRef.current;
		if (!target || !toolbar || !content || compact) return;
		const width = toolbar.offsetWidth;
		const height = toolbar.offsetHeight;
		const maxLeft = Math.max(0, content.clientWidth - width - 6);
		const left = Math.min(Math.max(target.left, 0), maxLeft);
		let top = target.top;
		let below = target.below;
		const viewTop = content.scrollTop;
		const viewBottom = content.scrollTop + content.clientHeight;
		if (!below && top < viewTop) {
			below = true;
			top = target.top + TOOLBAR_HEIGHT + 10 + (target.lineHeight ?? 0) + 10;
		}
		if (below && top + height > viewBottom) {
			// Pas la place en dessous non plus : on la garde dans la zone visible
			top = Math.max(viewTop, viewBottom - height - 6);
		}
		if (left !== target.left || top !== target.top || below !== target.below) {
			setTarget((t) => (t ? { ...t, left, top, below } : t));
		}
	}, [target, compact]);

	// Barre ouverte au clavier : le focus passe sur sa première action
	useLayoutEffect(() => {
		if (target?.pinned && lastFocused.current?.classList.contains("cls-sentence")) {
			toolbarRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
		}
	}, [target?.pinned, target?.index]);

	const runAction = (action: PassageAction) => {
		if (!target) return;
		onAction(action, target.text);
		window.getSelection()?.removeAllRanges();
		close();
	};

	const handleToolbarKeys = (event: React.KeyboardEvent) => {
		if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
		const buttons = Array.from(toolbarRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
		const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
		const next = buttons[(i + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length];
		next?.focus();
		event.preventDefault();
	};

	const isSaved = target ? savedTexts.has(target.text) : false;

	/// Bureau : barre flottante au-dessus de la phrase · Mobile : feuille
	/// d'actions en bas de l'écran, avec de grands boutons libellés
	const renderMenu = (asSheet: boolean) =>
		target && (
			<motion.div
				key="toolbar"
				ref={toolbarRef}
				className={asSheet ? "cls-passage-sheet" : `cls-passage-toolbar${target.below ? " is-below" : ""}`}
				style={asSheet ? undefined : { top: target.top, left: target.left }}
				role="menu"
				aria-label="Que veux-tu faire avec ce passage ?"
				initial={reduceMotion ? { opacity: 0 } : asSheet ? { y: "110%" } : { opacity: 0, y: target.below ? -6 : 6, scale: 0.96 }}
				animate={asSheet ? { y: 0, opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
				exit={asSheet && !reduceMotion ? { y: "110%" } : { opacity: 0, transition: { duration: 0.1 } }}
				transition={asSheet ? { type: "spring", stiffness: 420, damping: 38 } : { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
				onMouseEnter={cancelHide}
				onMouseLeave={scheduleHide}
				onKeyDown={handleToolbarKeys}
				onMouseDown={(e) => e.preventDefault()}
			>
				{asSheet && (
					<div className="cls-passage-sheet-head">
						<p className="cls-passage-sheet-quote">« {target.text} »</p>
						<button type="button" className="cls-icon-btn cls-icon-btn--sm" onClick={() => close(true)} aria-label="Fermer">
							<X size={18} />
						</button>
					</div>
				)}
				<div className="cls-passage-actions">
					{ACTIONS.filter((a) => a.id !== "listen" || canListen).map(({ id, label, hint, emoji }) => {
						const saved = id === "save" && isSaved;
						return (
							<button
								key={id}
								type="button"
								role="menuitem"
								className={`cls-passage-action cls-passage-action--${id}`}
								title={hint}
								disabled={saved}
								onClick={() => runAction(id)}
							>
								{saved ? (
									<span className="cls-passage-icon is-done" aria-hidden="true">
										<Check size={14} strokeWidth={3} />
									</span>
								) : emoji ? (
									<img className="cls-passage-emoji" src={`/landing/emoji/${emoji}.webp`} alt="" aria-hidden="true" />
								) : (
									<span className="cls-passage-icon" aria-hidden="true">
										<Volume2 size={14} strokeWidth={2.6} />
									</span>
								)}
								<span>{saved ? "Déjà dans mes notes" : asSheet ? hint : label}</span>
							</button>
						);
					})}
				</div>
			</motion.div>
		);
	const lastIndex = useMemo(() => {
		const sentences = flattenSentences(nodes);
		return sentences.length ? sentences[sentences.length - 1].index : -1;
	}, [nodes]);

	const renderSentence = (sentence: { index: number; text: string }) => {
		const plain = plainText(sentence.text);
		const classes = [
			"cls-sentence",
			target?.index === sentence.index ? "is-active" : "",
			speakingIndex === sentence.index ? "is-speaking" : "",
			savedTexts.has(plain) ? "is-saved" : "",
		]
			.filter(Boolean)
			.join(" ");
		return (
			<span
				key={sentence.index}
				className={classes}
				data-index={sentence.index}
				tabIndex={interactive ? 0 : -1}
				role={interactive ? "button" : undefined}
				aria-haspopup={interactive ? "menu" : undefined}
				aria-describedby={interactive ? "cls-board-hint" : undefined}
				onMouseEnter={(e) => openForSentence(e.currentTarget, sentence.index, sentence.text, false)}
				onMouseLeave={scheduleHide}
				onFocus={(e) => (lastFocused.current = e.currentTarget)}
				onClick={(e) => {
					if (!interactive) return;
					if (window.getSelection()?.toString().trim()) return;
					openForSentence(e.currentTarget, sentence.index, sentence.text, true);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						lastFocused.current = e.currentTarget;
						openForSentence(e.currentTarget, sentence.index, sentence.text, true);
					}
				}}
			>
				<InlineText text={sentence.text} />
				{isWriting && sentence.index === lastIndex && <span className="cls-chalk-caret" aria-hidden="true" />}
			</span>
		);
	};

	const renderBlock = (block: BoardBlock, key: React.Key) => {
		if (block.kind === "spacer") return <div key={key} className="cls-board-spacer" />;
		const Tag = block.kind === "heading" ? "h3" : "p";
		return (
			<Tag key={key} className={`cls-board-block cls-board-block--${block.kind}`}>
				{block.marker && (
					<span className="cls-board-marker" aria-hidden="true">
						{block.marker === "•" ? "" : block.marker}
					</span>
				)}
				<span>{block.sentences.map(renderSentence)}</span>
			</Tag>
		);
	};

	return (
		<div
			className={`cls-board-content${isWriting ? " is-writing" : ""}${interactive ? " is-interactive" : ""}`}
			ref={contentRef}
			onMouseUp={handleMouseUp}
			onClick={isWriting ? onSkip : undefined}
		>
			{nodes.map((node, nodeIndex) =>
				node.kind === "box" ? (
					<section key={nodeIndex} className={`cls-board-box cls-board-box--${node.variant}`}>
						<span className="cls-board-box-label">
							<img src={`/landing/emoji/${BOX_EMOJI[node.variant]}.webp`} alt="" aria-hidden="true" />
							{node.title}
						</span>
						{node.blocks.map((block, i) => renderBlock(block, i))}
					</section>
				) : (
					renderBlock(node, nodeIndex)
				),
			)}

			{compact
				? createPortal(<AnimatePresence>{target && renderMenu(true)}</AnimatePresence>, document.body)
				: <AnimatePresence>{target && renderMenu(false)}</AnimatePresence>}
		</div>
	);
};

export default LessonBoard;
