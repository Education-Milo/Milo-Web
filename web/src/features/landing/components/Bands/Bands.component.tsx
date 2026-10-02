import React, { useRef } from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { BANDS } from "@features/landing/data/landing.data";
import { ScrollTrigger, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import "@features/landing/components/Bands/Bands.css";

/// Deux bandes croisées qui défilent en boucle ; leur vitesse et leur sens
/// suivent la vitesse de scroll, leur inclinaison suit la position.
const Bands: React.FC = () => {
	const root = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			const loops = q(".lp-bands__track").map((track, i) => {
				const loop = gsap.fromTo(
					track,
					{ xPercent: i ? 0 : -50 },
					{ xPercent: i ? -50 : 0, duration: i ? 28 : 36, ease: "none", repeat: -1 },
				);
				loop.totalTime(loop.duration() * 500); // marge pour pouvoir tourner à l'envers
				return loop;
			});

			let direction = 1;
			let boost = 0;
			ScrollTrigger.create({
				start: 0,
				end: "max",
				onUpdate: (self) => {
					const velocity = self.getVelocity();
					if (velocity) direction = velocity > 0 ? 1 : -1;
					boost = Math.max(boost, Math.min(Math.abs(velocity) / 300, 6));
				},
			});
			const tick = () => {
				boost *= 0.93;
				loops.forEach((loop) => loop.timeScale(direction * (1 + boost)));
			};
			gsap.ticker.add(tick);

			const tilt = { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true };
			gsap.fromTo(q(".lp-bands__band--front"), { rotate: -5 }, { rotate: -1, ease: "none", scrollTrigger: tilt });
			gsap.fromTo(q(".lp-bands__band--back"), { rotate: 5 }, { rotate: 1, ease: "none", scrollTrigger: tilt });

			return () => gsap.ticker.remove(tick);
		},
		{ scope: root },
	);

	return (
		<div className="lp-bands" ref={root} aria-hidden="true">
			{BANDS.map((items, i) => (
				<div key={i} className={`lp-bands__band ${i ? "lp-bands__band--front" : "lp-bands__band--back"}`}>
					<div className="lp-bands__track">
						{[0, 1].map((copy) => (
							<ul key={copy}>
								{items.map((item) => (
									<li key={item.label}>
										<Emoji3D name={item.icon} />
										{item.label}
									</li>
								))}
							</ul>
						))}
					</div>
				</div>
			))}
		</div>
	);
};

export default Bands;
