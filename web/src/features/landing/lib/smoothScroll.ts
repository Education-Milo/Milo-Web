import type Lenis from "lenis";

/// Instance Lenis active (créée par useSmoothScroll sur la Vitrine).
/// Partagée ici pour que la Navbar et les boutons puissent défiler en douceur
/// sans dépendre d'un contexte React.
let lenis: Lenis | null = null;

/// Décalage sous la navbar fixe (vague)
export const SCROLL_OFFSET = -90;

export function setLenis(instance: Lenis | null) {
	lenis = instance;
}

/// Fait défiler jusqu'à une section de la page. Retourne false si l'élément
/// n'existe pas (on n'est pas sur la Vitrine).
export function scrollToSection(id: string) {
	const target = document.getElementById(id);
	if (!target) return false;
	if (lenis) {
		lenis.scrollTo(target, { offset: SCROLL_OFFSET, duration: 1.2 });
	} else {
		const top = target.getBoundingClientRect().top + window.scrollY + SCROLL_OFFSET;
		window.scrollTo({ top, behavior: "smooth" });
	}
	return true;
}

/// Défile jusqu'à une position absolue (utilisé par le carrousel épinglé)
export function scrollToY(y: number, duration = 1.2) {
	if (lenis) lenis.scrollTo(y, { duration });
	else window.scrollTo({ top: y, behavior: "smooth" });
}
