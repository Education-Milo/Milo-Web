import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled]):not([type='hidden'])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(",");

interface DialogFocusOptions {
	/** La fenêtre est-elle affichée ? */
	open: boolean;
	/** Conteneur de la fenêtre (élément `role="dialog"`) */
	containerRef: RefObject<HTMLElement | null>;
	/** Élément qui reçoit le focus à l'ouverture (sinon le premier focusable) */
	initialFocusRef?: RefObject<HTMLElement | null>;
	/** Appelé sur Échap ; omis = Échap ne ferme pas */
	onEscape?: () => void;
}

/**
 * Comportement clavier d'une fenêtre modale (WCAG 2.1.2, 2.4.3) :
 * focus placé dans la fenêtre à l'ouverture, Tab / Maj+Tab piégés
 * à l'intérieur, Échap ferme, et le focus revient à l'élément qui
 * avait ouvert la fenêtre à la fermeture.
 */
export function useDialogFocus({ open, containerRef, initialFocusRef, onEscape }: DialogFocusOptions) {
	// Échap lu via une ref : un parent qui recrée son callback à chaque
	// rendu ne doit pas relancer l'effet (et donc re-voler le focus)
	const escapeRef = useRef(onEscape);
	escapeRef.current = onEscape;

	useEffect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement | null;

		// La fenêtre est souvent montée par une animation : on attend le tour suivant
		const timer = window.setTimeout(() => {
			const container = containerRef.current;
			const target =
				initialFocusRef?.current ?? container?.querySelector<HTMLElement>(FOCUSABLE) ?? container;
			target?.focus({ preventScroll: true });
		}, 0);

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && escapeRef.current) {
				e.stopPropagation();
				escapeRef.current();
				return;
			}
			if (e.key !== "Tab") return;
			const container = containerRef.current;
			if (!container) return;
			const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
				(el) => el.offsetParent !== null || el === document.activeElement,
			);
			if (items.length === 0) {
				e.preventDefault();
				return;
			}
			const first = items[0];
			const last = items[items.length - 1];
			const active = document.activeElement;
			if (e.shiftKey && (active === first || !container.contains(active))) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && (active === last || !container.contains(active))) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", onKey);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("keydown", onKey);
			// Rend le focus à l'élément d'origine s'il est toujours dans la page
			if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
		};
	}, [open, containerRef, initialFocusRef]);
}
