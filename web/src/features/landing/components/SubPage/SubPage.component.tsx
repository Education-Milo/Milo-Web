import React, { useEffect, useRef } from "react";
import Navbar from "@features/landing/components/Navbar/Navbar.component";
import Footer from "@features/landing/components/Footer/Footer.component";
import { useSmoothScroll } from "@features/landing/hooks/useSmoothScroll";
import { ScrollTrigger, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import "@features/landing/styles/landing.css";
import "@features/landing/components/SubPage/SubPage.css";

interface SubPageProps {
	/// En-tête de la page (PageHero), posé sur le fond crème
	hero: React.ReactNode;
	/// Contenu, posé sur le panneau clair aux coins arrondis
	children: React.ReactNode;
	className?: string;
}

/// Gabarit des pages secondaires du site vitrine (FAQ, Contact) : mêmes
/// fondations que la Vitrine (barre de progression, scroll fluide, navbar,
/// footer), un en-tête sur fond crème puis un panneau clair.
const SubPage: React.FC<SubPageProps> = ({ hero, children, className = "" }) => {
	const root = useRef<HTMLDivElement>(null);
	useSmoothScroll();

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

	return (
		<div className={`lp lp-root lp-sub ${className}`.trim()} ref={root}>
			<div className="lp-scroll-progress" aria-hidden="true" />
			<Navbar />
			<main>
				{hero}
				<div className="lp-sub__panel">
					<div className="lp-wrap">{children}</div>
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default SubPage;
