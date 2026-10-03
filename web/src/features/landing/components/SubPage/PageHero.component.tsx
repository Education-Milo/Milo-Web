import React, { useRef } from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle } from "@features/landing/lib/animations";

interface PageHeroProps {
	/// Grande icône 3D au-dessus du titre
	icon: Emoji3DName;
	/// Deux icônes qui flottent de part et d'autre
	floats: [Emoji3DName, Emoji3DName];
	/// Petite étiquette au-dessus du titre
	eyebrow: string;
	title: React.ReactNode;
	lead: React.ReactNode;
	/// Contenu sous l'accroche (ex. barre de recherche)
	children?: React.ReactNode;
}

/// En-tête des pages secondaires : le décor du hero de la Vitrine (pois,
/// halos, icônes 3D flottantes) autour d'un titre révélé lettre par lettre.
const PageHero: React.FC<PageHeroProps> = ({ icon, floats, eyebrow, title, lead, children }) => {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			revealTitle(q(".lp-page-hero__title")[0]);
			gsap.from(q(".lp-page-hero__icon"), { scale: 0, rotate: -45, duration: 0.9, ease: "back.out(2.2)" });
			gsap.from(q("[data-hero-up]"), { y: 30, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.25, ease: "power3.out" });
			q(".lp-page-hero__float").forEach((el, i) => {
				gsap.from(el, { scale: 0, duration: 0.8, delay: 0.4 + i * 0.15, ease: "back.out(2)" });
				gsap.to(el, { y: i ? 12 : -12, rotate: i ? 8 : -8, duration: 2.6 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
			});
		},
		{ scope: root },
	);

	return (
		<header className="lp-page-hero" ref={root}>
			<div className="lp-page-hero__bg" aria-hidden="true">
				<div className="lp-page-hero__dots" />
				<div className="lp-page-hero__blob lp-page-hero__blob--1" />
				<div className="lp-page-hero__blob lp-page-hero__blob--2" />
				<Emoji3D name={floats[0]} className="lp-page-hero__float lp-page-hero__float--left" />
				<Emoji3D name={floats[1]} className="lp-page-hero__float lp-page-hero__float--right" />
			</div>

			<div className="lp-wrap lp-page-hero__inner">
				<Emoji3D name={icon} className="lp-page-hero__icon" loading="eager" />
				<span className="lp-page-hero__eyebrow" data-hero-up>
					{eyebrow}
				</span>
				<h1 className="lp-display lp-page-hero__title">{title}</h1>
				<p className="lp-lead lp-page-hero__lead" data-hero-up>
					{lead}
				</p>
				{children && (
					<div className="lp-page-hero__extra" data-hero-up>
						{children}
					</div>
				)}
			</div>
		</header>
	);
};

export default PageHero;
