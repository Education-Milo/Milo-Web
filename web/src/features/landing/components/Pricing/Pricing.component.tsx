import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import Eyebrow from "@features/landing/ui/Eyebrow.component";
import { PLANS, SECTION_IDS } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle } from "@features/landing/lib/animations";
import "@features/landing/components/Pricing/Pricing.css";

/// Formules d'abonnement : les cartes arrivent des côtés au rythme du scroll,
/// les prix comptent jusqu'à leur valeur.
const Pricing: React.FC = () => {
	const root = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			const plans = q(".lp-plan");
			revealTitle(q(".lp-pricing__title")[0]);

			plans.forEach((plan, i) =>
				gsap.fromTo(
					plan,
					{ xPercent: i ? 70 : -70, rotate: i ? 14 : -14, y: 120, opacity: 0 },
					{
						xPercent: 0,
						rotate: 0,
						y: 0,
						opacity: 1,
						ease: "power2.out",
						scrollTrigger: { trigger: q(".lp-pricing__plans")[0], start: "top bottom", end: "top 40%", scrub: 1 },
					},
				),
			);
			gsap.from(q(".lp-plan__icon, .lp-plan__ribbon"), {
				scale: 0,
				rotate: -30,
				duration: 0.7,
				stagger: 0.12,
				ease: "back.out(2.5)",
				scrollTrigger: { trigger: q(".lp-pricing__plans")[0], start: "top 60%", once: true },
			});
			q("[data-count]").forEach((el) => {
				const counter = { value: 0 };
				const target = Number(el.dataset.count);
				gsap.to(counter, {
					value: target,
					duration: 1.4,
					ease: "power2.out",
					onUpdate: () => {
						el.textContent = String(Math.round(counter.value));
					},
					scrollTrigger: { trigger: el, start: "top 85%", once: true },
				});
			});
			q(".lp-plan li").forEach((li) =>
				gsap.from(li, { x: -20, opacity: 0, duration: 0.5, ease: "power2.out", scrollTrigger: { trigger: li, start: "top 92%", once: true } }),
			);
		},
		{ scope: root },
	);

	return (
		<div className="lp-pricing" id={SECTION_IDS.pricing} ref={root}>
			<div className="lp-section-head">
				<Eyebrow>Abonnements</Eyebrow>
				<h2 className="lp-display lp-section-title lp-pricing__title">
					Adopte <span className="lp-hl">Milo</span>
				</h2>
			</div>
			<div className="lp-pricing__plans">
				{PLANS.map((plan) => (
					<article key={plan.name} className={`lp-plan${plan.featured ? " lp-plan--featured" : ""}`}>
						{plan.featured && (
							<span className="lp-plan__ribbon">
								<Emoji3D name="trophy" />
								Choix des parents
							</span>
						)}
						<div className="lp-plan__top">
							<span className="lp-plan__name">{plan.name}</span>
							<Emoji3D name={plan.icon} className="lp-plan__icon" />
						</div>
						<div className="lp-plan__price">
							<span data-count={plan.price}>{plan.price}</span>€<small>/mois</small>
						</div>
						<ul>
							{plan.features.map((feature) => (
								<li key={feature}>
									<span className="lp-plan__tick" aria-hidden="true">
										<Check size={15} strokeWidth={3.2} />
									</span>
									{feature}
								</li>
							))}
						</ul>
						<Link to="/register" className={`lp-btn ${plan.featured ? "lp-btn--cream" : "lp-btn--primary"}`}>
							{plan.cta}
						</Link>
					</article>
				))}
			</div>
		</div>
	);
};

export default Pricing;
