import React, { useRef } from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { SECTION_IDS } from "@features/landing/data/landing.data";
import { SplitText, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import "@features/landing/components/Manifesto/Manifesto.css";

/// Objets 3D qui surgissent des bords pendant la lecture
const DECOR: { name: Emoji3DName; side: "left" | "right"; className: string }[] = [
	{ name: "books", side: "left", className: "lp-manifesto__deco--1" },
	{ name: "light_bulb", side: "right", className: "lp-manifesto__deco--2" },
	{ name: "brain", side: "left", className: "lp-manifesto__deco--3" },
	{ name: "trophy", side: "right", className: "lp-manifesto__deco--4" },
	{ name: "glowing_star", side: "left", className: "lp-manifesto__deco--5" },
];

/// Mot-clé suivi de son icône 3D, sans retour à la ligne entre les deux
const Key: React.FC<{ word: string; icon: Emoji3DName; after?: string }> = ({ word, icon, after = "" }) => (
	<span className="lp-manifesto__nowrap">
		<span className="lp-manifesto__key">{word}</span>
		{" "}
		<Emoji3D name={icon} className="lp-manifesto__inline" loading="eager" />
		{after}
	</span>
);

/// Positionnement de la charte : épinglé, les mots s'allument au fil du scroll
const Manifesto: React.FC = () => {
	const root = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			const decos = q(".lp-manifesto__deco");
			const split = SplitText.create(q(".lp-manifesto__text"), { type: "words" });
			gsap.set(split.words, { opacity: 0.18 });
			gsap.set(q(".lp-manifesto__inline"), { scale: 0, rotate: -30 });

			const tl = gsap.timeline({
				defaults: { ease: "none" },
				scrollTrigger: { trigger: root.current, start: "top top", end: "+=140%", pin: true, scrub: 0.7 },
			});
			tl.from(
				decos,
				{
					x: (i) => (DECOR[i].side === "left" ? -1 : 1) * window.innerWidth * 0.45,
					y: (i) => (i % 2 ? 160 : -160),
					rotate: (i) => (i % 2 ? 120 : -120),
					scale: 0.2,
					opacity: 0,
					duration: 0.5,
					stagger: 0.06,
					ease: "power3.out",
				},
				0,
			)
				.to(split.words, { opacity: 1, stagger: 0.05, duration: 0.2 }, 0.1)
				.from(split.words, { y: 24, stagger: 0.05, duration: 0.2 }, 0.1)
				.from(q(".lp-manifesto__sign"), { y: 40, opacity: 0, duration: 0.2 }, 0.1 + split.words.length * 0.05);

			// Chaque icône apparaît juste après le mot qui la précède
			q(".lp-manifesto__inline").forEach((img) => {
				let index = 0;
				split.words.forEach((word, k) => {
					if (word.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING) index = k;
				});
				tl.to(img, { scale: 1, rotate: 0, ease: "back.out(3)", duration: 0.2 }, 0.1 + index * 0.05);
			});
			tl.to(decos, { y: (i) => (i % 2 ? -60 : 60), rotate: (i) => (i % 2 ? 20 : -20), duration: 0.4 }, ">-0.2");

			decos.forEach((el, i) =>
				gsap.to(el, { yPercent: i % 2 ? 12 : -12, duration: 2.4 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut" }),
			);
		},
		{ scope: root },
	);

	return (
		<section className="lp-manifesto" id={SECTION_IDS.manifesto} ref={root}>
			{DECOR.map((deco) => (
				<Emoji3D key={deco.name} name={deco.name} className={`lp-manifesto__deco ${deco.className}`} />
			))}
			<div className="lp-wrap">
				<p className="lp-manifesto__text">
					Face aux révisions austères, Milo modernise l'apprentissage avec un accompagnement{" "}
					<Key word="instantané" icon="high_voltage" after="," /> <Key word="sur-mesure" icon="bullseye" /> et{" "}
					<Key word="gamifié" icon="video_game" /> pour redonner à chaque élève le contrôle de sa réussite.
				</p>
				<div className="lp-manifesto__sign">
					<Emoji3D name="graduation_cap" />
					L'accompagnement sur-mesure est un droit, pas un privilège.
				</div>
			</div>
			<div className="lp-manifesto__wave" aria-hidden="true">
				<svg viewBox="0 0 1440 90" preserveAspectRatio="none">
					<path d="M0,40 C240,90 480,90 720,55 C960,20 1200,10 1440,45 L1440,90 L0,90 Z" />
				</svg>
			</div>
		</section>
	);
};

export default Manifesto;
