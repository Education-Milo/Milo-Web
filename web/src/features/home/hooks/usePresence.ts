import { useEffect, useState, type RefObject } from "react";

/// Garde un élément affiché le temps de son animation de sortie : `mounted`
/// reste vrai `exitMs` après la fermeture, avec `closing` pour la jouer.
export function usePresence(open: boolean, exitMs: number) {
	const [mounted, setMounted] = useState(open);
	const [closing, setClosing] = useState(false);

	useEffect(() => {
		if (open) {
			setMounted(true);
			setClosing(false);
			return;
		}
		setClosing(true);
		const id = window.setTimeout(() => {
			setMounted(false);
			setClosing(false);
		}, exitMs);
		return () => window.clearTimeout(id);
	}, [open, exitMs]);

	return { mounted: open || mounted, closing: !open && closing };
}

/// Fermeture au clavier (Échap) ; à l'ouverture, le focus passe sur la
/// fenêtre (Tab mène ensuite à ses boutons), puis revient où il était
export function useDialogKeys(open: boolean, onClose: () => void, focusTarget: RefObject<HTMLElement | null>) {
	useEffect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement | null;
		focusTarget.current?.focus({ preventScroll: true });
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.({ preventScroll: true });
		};
	}, [open, onClose, focusTarget]);
}
