import React, { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

interface ClassSheetProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	/** Petit texte au-dessus du titre */
	eyebrow?: string;
	icon?: React.ReactNode;
	/** « side » : panneau latéral · « center » : fenêtre centrée */
	variant?: "side" | "center";
	/** Largeur d'une fenêtre centrée */
	size?: "md" | "xl";
	footer?: React.ReactNode;
	children: React.ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/// Panneau de la salle de classe (leçons, fiche, aide…) : Échap pour fermer,
/// focus gardé à l'intérieur et rendu à l'élément d'origine à la fermeture.
const ClassSheet: React.FC<ClassSheetProps> = ({
	isOpen,
	onClose,
	title,
	eyebrow,
	icon,
	variant = "side",
	size = "md",
	footer,
	children,
}) => {
	const reduceMotion = useReducedMotion();
	const titleId = useId();
	const panelRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!isOpen) return;
		returnFocusRef.current = document.activeElement as HTMLElement | null;
		// Focus sur le contenu (l'action principale) plutôt que sur « Fermer »
		const frame = requestAnimationFrame(() => {
			const panel = panelRef.current;
			(
				panel?.querySelector<HTMLElement>(`.cls-sheet-body :is(${FOCUSABLE})`) ??
				panel?.querySelector<HTMLElement>(`.cls-sheet-foot :is(${FOCUSABLE})`) ??
				panel?.querySelector<HTMLElement>(FOCUSABLE)
			)?.focus();
		});

		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.stopPropagation();
				onClose();
				return;
			}
			if (event.key !== "Tab" || !panelRef.current) return;
			const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
			if (items.length === 0) return;
			const first = items[0];
			const last = items[items.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		window.addEventListener("keydown", onKey, true);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("keydown", onKey, true);
			returnFocusRef.current?.focus?.();
		};
	}, [isOpen, onClose]);

	const panelMotion =
		variant === "side"
			? reduceMotion
				? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
				: { initial: { x: "104%" }, animate: { x: 0 }, exit: { x: "104%" } }
			: reduceMotion
				? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
				: { initial: { opacity: 0, y: 24, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 12, scale: 0.98 } };

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className={`cls-sheet-overlay cls-sheet-overlay--${variant}`}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					onMouseDown={(e) => {
						if (e.target === e.currentTarget) onClose();
					}}
				>
					<motion.div
						ref={panelRef}
						className={`cls-sheet cls-sheet--${variant} cls-sheet--${size}`}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						{...panelMotion}
						transition={{ type: "spring", stiffness: 380, damping: 36 }}
					>
						<header className="cls-sheet-head">
							{icon && <span className="cls-sheet-icon">{icon}</span>}
							<div className="cls-sheet-titles">
								{eyebrow && <span className="cls-eyebrow">{eyebrow}</span>}
								<h2 id={titleId}>{title}</h2>
							</div>
							<button type="button" className="cls-icon-btn" onClick={onClose} aria-label="Fermer">
								<X size={20} />
							</button>
						</header>
						<div className="cls-sheet-body">{children}</div>
						{footer && <footer className="cls-sheet-foot">{footer}</footer>}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default ClassSheet;
