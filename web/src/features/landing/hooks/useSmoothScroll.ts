import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@features/landing/lib/gsap";
import { setLenis } from "@features/landing/lib/smoothScroll";

/// Vitesse maximale à la molette / au trackpad, exprimée en avance maximale
/// (px) de la cible de scroll sur la position affichée. Lenis rattrape une
/// fraction `LERP` de cet écart à chaque frame : la vitesse plafonne donc à
/// environ avance × LERP × 60 px/s (≈ 2 300 px/s hors animations, ≈ 1 000 px/s
/// dans les sections animées, assez lent pour que chaque étape soit vue).
const LERP = 0.09;
const MAX_LEAD = 420;
const MAX_LEAD_ANIMATED = 180;
/// Marge autour des sections épinglées où la vitesse est déjà réduite, pour
/// ne pas y entrer lancé à pleine vitesse
const ANIMATED_MARGIN = 0.5;

/// Vrai si la position de scroll est dans (ou juste avant) une section épinglée
function isInAnimatedZone(scroll: number) {
	const margin = window.innerHeight * ANIMATED_MARGIN;
	return ScrollTrigger.getAll().some((st) => st.pin && scroll > st.start - margin && scroll < st.end + margin * 0.5);
}

/// Défilement fluide (Lenis) synchronisé avec ScrollTrigger : Lenis est piloté
/// par le ticker GSAP pour que les animations scrubbées suivent exactement
/// la position de scroll. Désactivé si l'utilisateur réduit les animations.
export function useSmoothScroll() {
	useEffect(() => {
		if (prefersReducedMotion()) return;

		// Les ancres sont gérées par scrollToSection (navbar, boutons)
		// Le callback n'est appelé qu'aux événements, donc après l'affectation
		const lenis: Lenis = new Lenis({
			lerp: LERP,
			// Limiteur de vitesse : on rabote chaque événement de molette pour que
			// la cible ne prenne jamais plus de `max` px d'avance. Un scroll très
			// rapide ne saute donc plus par-dessus les animations scrubbées.
			virtualScroll: (data) => {
				if (!data.event.type.includes("wheel") || !data.deltaY) return true;
				const lead = lenis.targetScroll - lenis.animatedScroll;
				const max = isInAnimatedZone(lenis.animatedScroll) ? MAX_LEAD_ANIMATED : MAX_LEAD;
				const allowed = Math.max(-max, Math.min(max, lead + data.deltaY)) - lead;
				// Jamais 0 : Lenis laisserait alors passer le scroll natif (non lissé)
				data.deltaY = Math.sign(allowed) === Math.sign(data.deltaY) ? allowed : Math.sign(data.deltaY) * 0.01;
				return true;
			},
		});
		setLenis(lenis);
		lenis.on("scroll", ScrollTrigger.update);

		const tick = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(tick);
		gsap.ticker.lagSmoothing(0);

		return () => {
			gsap.ticker.remove(tick);
			gsap.ticker.lagSmoothing(500, 33);
			lenis.destroy();
			setLenis(null);
		};
	}, []);
}
