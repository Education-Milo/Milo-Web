import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle } from "@features/landing/lib/animations";
import "@features/landing/components/FinalCta/FinalCta.css";

const CONFETTI: Emoji3DName[] = ["party_popper", "sparkles", "star", "coin"];

/// Appel à l'action final : la carte s'étend jusqu'aux bords de l'écran
/// pendant que Milo surgit par le bas.
const FinalCta: React.FC = () => {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			revealTitle(q(".lp-cta__title")[0]);
			gsap.timeline({
				defaults: { ease: "none" },
				scrollTrigger: { trigger: q(".lp-cta")[0], start: "top bottom", end: "top 15%", scrub: 0.8 },
			})
				.fromTo(q(".lp-cta")[0], { clipPath: "inset(12% 10% 0% 10% round 80px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
				.from(q(".lp-cta__copy"), { y: 120, opacity: 0 }, 0.15)
				.from(q(".lp-cta__milo"), { yPercent: 90, rotate: -12, scale: 0.7 }, 0.1)
				.from(q(".lp-cta__confetti"), { scale: 0, rotate: -90, stagger: 0.06, ease: "back.out(2)" }, 0.4);

			q(".lp-cta__confetti").forEach((el, i) =>
				gsap.to(el, { y: i % 2 ? 10 : -10, rotate: i % 2 ? 8 : -8, duration: 2 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut" }),
			);
		},
		{ scope: root },
	);

	return (
		<section className="lp-cta-section" aria-labelledby="lp-cta-title" ref={root}>
			<div className="lp-cta">
				<div className="lp-wrap lp-cta__grid">
					<div className="lp-cta__copy">
						<h2 className="lp-display lp-cta__title" id="lp-cta-title">
							Prêt à adopter Milo ?
						</h2>
						<p>
							L'accompagnement scolaire sur-mesure est un droit, pas un privilège. Donnez à votre enfant le
							pouvoir de réussir.
						</p>
						<Link to="/register" className="lp-btn lp-btn--cream">
							Rejoindre l'aventure <ArrowRight size={22} />
						</Link>
					</div>
					<div className="lp-cta__art">
						{CONFETTI.map((name, i) => (
							<Emoji3D key={name} name={name} className={`lp-cta__confetti lp-cta__confetti--${i + 1}`} />
						))}
						<img className="lp-cta__milo" src="/landing/milo-reading.webp" alt="Milo plongé dans son livre" loading="lazy" />
					</div>
				</div>
			</div>
		</section>
	);
};

export default FinalCta;
