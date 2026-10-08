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
/// n'existe pas (on n'est pas sur la page qui la contient).
///
/// Une section épinglée par GSAP (Hero, Manifeste, Missions) est enveloppée
/// dans un `.pin-spacer` et décalée à l'intérieur pendant l'épinglage : sa
/// propre position ne dit plus où elle commence. On vise alors le haut de
/// l'enveloppe, sans décalage, puisque l'épinglage démarre en « top top ».
export function scrollToSection(id: string, offset = SCROLL_OFFSET) {
	const target = document.getElementById(id);
	if (!target) return false;
	const spacer = target.parentElement?.classList.contains("pin-spacer") ? target.parentElement : null;
	const anchor = spacer ?? target;
	const top = anchor.getBoundingClientRect().top + window.scrollY + (spacer ? 0 : offset);
	scrollToY(Math.max(0, top));
	return true;
}

/// Défile jusqu'à une position absolue (utilisé par le carrousel épinglé)
export function scrollToY(y: number, duration = 1.2) {
	if (lenis) lenis.scrollTo(y, { duration });
	else window.scrollTo({ top: y, behavior: "smooth" });
}
