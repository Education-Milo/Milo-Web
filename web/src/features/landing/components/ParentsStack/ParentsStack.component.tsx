import React, { useRef } from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { PARENT_FEATURES, SECTION_IDS } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle, revealUp } from "@features/landing/lib/animations";
import "@features/landing/components/ParentsStack/ParentsStack.css";

/// Fonctionnalités parents en cartes empilées : chaque carte reste collée
/// (position: sticky) et la suivante vient la recouvrir pendant le scroll.
const ParentsStack: React.FC = () => {
	const root = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			revealTitle(q(".lp-parents__title")[0]);
			revealUp(q(".lp-parents__intro"));

			const cards = q(".lp-stack-card");
			cards.forEach((card, i) => {
				gsap.fromTo(
					card.querySelector(".lp-stack-card__art img"),
					{ rotate: -25, scale: 0.6, y: 60 },
					{ rotate: 12, scale: 1.08, y: -30, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } },
				);
				gsap.from(card, {
					y: 140,
					rotateX: -18,
					transformPerspective: 1200,
					opacity: 0,
					ease: "none",
					scrollTrigger: { trigger: card, start: "top bottom", end: "top 55%", scrub: true },
				});

				// La carte recouverte rétrécit et s'assombrit. L'ombre est un calque
				// dont on anime l'opacité : un `filter` animé repeindrait toute la
				// carte à chaque frame.
				const next = cards[i + 1];
				if (!next) return;
				gsap
					.timeline({
						defaults: { ease: "none" },
						scrollTrigger: {
							trigger: next,
							start: "top bottom",
							end: () => `top ${parseFloat(getComputedStyle(next).top) || 120}px`,
							scrub: 0.4,
							invalidateOnRefresh: true,
						},
					})
					.fromTo(card, { scale: 1 }, { scale: 0.9 - (cards.length - 2 - i) * 0.03 }, 0)
					.fromTo(card.querySelector(".lp-stack-card__shade"), { opacity: 0 }, { opacity: 1 }, 0);
			});
		},
		{ scope: root },
	);

	return (
		<div ref={root} id={SECTION_IDS.parents}>
			<div className="lp-section-head">
				<h2 className="lp-display lp-section-title lp-parents__title">
					L'allié des <span className="lp-hl">parents</span>
				</h2>
				<p className="lp-lead lp-parents__intro">Votre enfant s'amuse, vous gardez la main. Sereinement.</p>
			</div>

			<div className="lp-stack">
				{PARENT_FEATURES.map((feature, i) => (
					<article key={feature.title} className="lp-stack-card" style={{ "--i": i } as React.CSSProperties}>
						<div className="lp-stack-card__copy">
							<span className="lp-stack-card__num">{String(i + 1).padStart(2, "0")}</span>
							<h3 className="lp-display">{feature.title}</h3>
							<p className="lp-lead">{feature.description}</p>
						</div>
						<div className="lp-stack-card__art" style={{ "--art": feature.art } as React.CSSProperties}>
							<Emoji3D name={feature.icon} />
						</div>
						<span className="lp-stack-card__shade" aria-hidden="true" />
					</article>
				))}
			</div>
		</div>
	);
};

export default ParentsStack;
