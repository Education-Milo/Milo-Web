import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@features/landing/lib/gsap";
import { setLenis } from "@features/landing/lib/smoothScroll";

/// Défilement fluide (Lenis) synchronisé avec ScrollTrigger : Lenis est piloté
/// par le ticker GSAP pour que les animations scrubbées suivent exactement
/// la position de scroll. Désactivé si l'utilisateur réduit les animations.
export function useSmoothScroll() {
	useEffect(() => {
		if (prefersReducedMotion()) return;

		// Les ancres sont gérées par scrollToSection (navbar, boutons)
		const lenis = new Lenis({ lerp: 0.09 });
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
