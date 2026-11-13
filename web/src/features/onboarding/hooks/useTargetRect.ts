import { useEffect, useState } from "react";

export interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

/**
 * Position à l'écran de l'élément visé, suivie à chaque image : la sidebar
 * s'anime, la caméra de la classe bouge, la fenêtre change de taille.
 * `allowInert` : accepte un élément décoratif rendu `inert` (maquette).
 */
export const useTargetRect = (selector: string | null, { allowInert = false } = {}) => {
	const [rect, setRect] = useState<Rect | null>(null);
	useEffect(() => {
		if (!selector) {
			setRect(null);
			return;
		}
		let raf = 0;
		let last = "";
		const loop = () => {
			const el = document.querySelector<HTMLElement>(selector);
			let next: Rect | null = null;
			if (el) {
				const r = el.getBoundingClientRect();
				const visible =
					r.width > 0 &&
					r.height > 0 &&
					r.right > 0 &&
					r.left < window.innerWidth &&
					r.bottom > 0 &&
					r.top < window.innerHeight &&
					(allowInert || !el.closest("[inert]"));
				if (visible) next = { top: r.top, left: r.left, width: r.width, height: r.height };
			}
			const key = next
				? `${Math.round(next.top)}:${Math.round(next.left)}:${Math.round(next.width)}:${Math.round(next.height)}`
				: "none";
			if (key !== last) {
				last = key;
				setRect(next);
			}
			raf = requestAnimationFrame(loop);
		};
		loop();
		return () => cancelAnimationFrame(raf);
	}, [selector, allowInert]);
	return rect;
};
