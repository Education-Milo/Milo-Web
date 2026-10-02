import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@features/landing/components/Navbar/Navbar.component";
import Footer from "@features/landing/components/Footer/Footer.component";
import Hero from "@features/landing/components/Hero/Hero.component";
import Manifesto from "@features/landing/components/Manifesto/Manifesto.component";
import Bands from "@features/landing/components/Bands/Bands.component";
import Missions from "@features/landing/components/Missions/Missions.component";
import ParentsStack from "@features/landing/components/ParentsStack/ParentsStack.component";
import FaqPreview from "@features/landing/components/FaqPreview/FaqPreview.component";
import Pricing from "@features/landing/components/Pricing/Pricing.component";
import FinalCta from "@features/landing/components/FinalCta/FinalCta.component";
import { useSmoothScroll } from "@features/landing/hooks/useSmoothScroll";
import { ScrollTrigger, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import "@features/landing/styles/landing.css";
import "@features/landing/styles/Vitrine.css";

/// Page d'accueil publique.
/// L'ordre des sections compte : les sections épinglées (Hero, Manifesto,
/// Missions) créent leurs ScrollTrigger dans l'ordre de la page.
const VitrinePage: React.FC = () => {
	const root = useRef<HTMLDivElement>(null);
	const { hash } = useLocation();
	useSmoothScroll();

	// Barre de progression de lecture
	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			gsap.to(".lp-scroll-progress", {
				scaleX: 1,
				ease: "none",
				scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
			});
		},
		{ scope: root },
	);

	// Les positions dépendent des polices (titres en Luckiest Guy)
	useEffect(() => {
		let cancelled = false;
		document.fonts.ready.then(() => {
			if (!cancelled) ScrollTrigger.refresh();
		});
		return () => {
			cancelled = true;
		};
	}, []);

	// Arrivée depuis une autre page sur une ancre (ex. /#parents)
	useEffect(() => {
		if (!hash) return;
		const id = decodeURIComponent(hash.slice(1));
		const timer = window.setTimeout(() => scrollToSection(id), 300);
		return () => window.clearTimeout(timer);
	}, [hash]);

	return (
		<div className="lp lp-root" ref={root}>
			<div className="lp-scroll-progress" aria-hidden="true" />
			<Navbar />
			<main>
				<Hero />
				<Manifesto />
				<Bands />
				<Missions />
				<section className="lp-parents">
					<div className="lp-wrap">
						<ParentsStack />
						<FaqPreview />
						<Pricing />
					</div>
				</section>
				<FinalCta />
			</main>
			<Footer />
		</div>
	);
};

export default VitrinePage;
