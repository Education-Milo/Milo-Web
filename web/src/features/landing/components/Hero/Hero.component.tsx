import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import HeroScene3D from "@features/landing/components/Hero/HeroScene3D.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import Eyebrow from "@features/landing/ui/Eyebrow.component";
import { HERO_BUBBLE_LINES, HERO_CHIPS, HERO_PROOFS, SECTION_IDS } from "@features/landing/data/landing.data";
import { MEDIA_DESKTOP_PIN, MEDIA_NO_PIN, SplitText, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { heroState } from "@features/landing/lib/heroState";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import "@features/landing/components/Hero/Hero.css";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/// Bulle de Milo : les phrases s'écrivent puis s'effacent en boucle
function useTypedLines(lines: string[], enabled: boolean) {
	const [text, setText] = useState(lines[0]);
	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		(async () => {
			await wait(1800);
			for (let index = 0; !cancelled; index++) {
				const line = lines[index % lines.length];
				for (let i = 0; i <= line.length && !cancelled; i++) {
					setText(line.slice(0, i));
					await wait(45);
				}
				await wait(2600);
				for (let i = line.length; i >= 0 && !cancelled; i--) {
					setText(line.slice(0, i));
					await wait(18);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [lines, enabled]);
	return text;
}

/// Isolée dans son composant : la frappe re-rend la bulle seule, pas la scène 3D
const HeroBubble: React.FC<{ enabled: boolean }> = ({ enabled }) => {
	const text = useTypedLines(HERO_BUBBLE_LINES, enabled);
	return (
		<div className="lp-hero__bubble" aria-live="polite">
			{text}
			<span className="lp-hero__caret" aria-hidden="true" />
		</div>
	);
};

const Hero: React.FC = () => {
	const root = useRef<HTMLElement>(null);
	const [reducedMotion] = useState(prefersReducedMotion);
	const [is3DReady, setIs3DReady] = useState(false);
	const onSceneReady = useCallback(() => setIs3DReady(true), []);

	// Position de la souris partagée avec la scène 3D
	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			heroState.pointerX = e.clientX / window.innerWidth - 0.5;
			heroState.pointerY = e.clientY / window.innerHeight - 0.5;
		};
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, []);

	useGSAP(
		(_, contextSafe) => {
			if (reducedMotion || !contextSafe) return;
			const q = gsap.utils.selector(root);

			/* ---------- Entrée (après chargement des polices, pour un split juste) ---------- */
			const playIntro = contextSafe(() => {
				if (!root.current) return;
				const split = SplitText.create(q(".lp-hero__title"), { type: "chars,words" });
				gsap.timeline({ defaults: { ease: "back.out(1.7)" } })
					.from(split.chars, { y: "0.7em", opacity: 0, rotate: 12, scale: 0.6, duration: 0.8, stagger: 0.022 }, 0.1)
					.from(q("[data-hero-in]"), { opacity: 0, y: 26, duration: 0.7, stagger: 0.09, ease: "power3.out" }, "-=.55")
					.from(q(".lp-hero__sun"), { scale: 0.5, opacity: 0, duration: 1.1, ease: "elastic.out(1, .7)" }, 0.2)
					.from(q(".lp-hero__orbit"), { scale: 0.7, opacity: 0, duration: 1, ease: "power3.out" }, 0.35)
					.from(q(".lp-hero__chip, .lp-hero__bubble"), { opacity: 0, scale: 0.3, duration: 0.6, stagger: 0.12 }, 0.9)
					.from(q(".lp-hero__floaty"), { opacity: 0, scale: 0, rotate: -40, duration: 0.8, stagger: 0.1 }, 0.6);
			});
			document.fonts.ready.then(playIntro);

			q(".lp-hero__chip").forEach((el, i) =>
				gsap.to(el, { y: i % 2 ? 10 : -12, duration: 2.2 + i * 0.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.6 }),
			);
			q(".lp-hero__floaty").forEach((el, i) =>
				gsap.to(el, { y: "+=16", rotate: i % 2 ? 8 : -8, duration: 3 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" }),
			);

			const mm = gsap.matchMedia();

			/* ---------- Desktop : le soleil devient un portail, Milo plonge dedans ---------- */
			mm.add(MEDIA_DESKTOP_PIN, () => {
				const sun = q(".lp-hero__sun")[0];
				const stage = q(".lp-hero__stage")[0];
				// Échelle pour que le soleil couvre tout l'écran depuis son centre
				const sunScale = () => {
					const r = sun.getBoundingClientRect();
					const cx = r.left + r.width / 2;
					const cy = r.top + r.height / 2;
					const far = Math.max(
						Math.hypot(cx, cy),
						Math.hypot(window.innerWidth - cx, cy),
						Math.hypot(cx, window.innerHeight - cy),
						Math.hypot(window.innerWidth - cx, window.innerHeight - cy),
					);
					return (far * 2.1) / r.width;
				};
				const toCenter = () => {
					const r = stage.getBoundingClientRect();
					return window.innerWidth / 2 - (r.left + r.width / 2);
				};

				gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: root.current,
						start: "top top",
						end: "+=190%",
						pin: true,
						scrub: 1,
						anticipatePin: 1,
						invalidateOnRefresh: true,
						onUpdate: (self) => (heroState.progress = Math.min(1, self.progress * 2.2)),
					},
				})
					.to(q(".lp-hero__copy"), { xPercent: -40, opacity: 0, ease: "power2.in", duration: 0.3 }, 0)
					.to(q(".lp-hero__chip, .lp-hero__bubble"), { scale: 0, opacity: 0, rotate: (i) => (i % 2 ? 25 : -25), stagger: 0.03, duration: 0.2, ease: "power2.in" }, 0)
					.to(q(".lp-hero__orbit"), { scale: 1.8, opacity: 0, duration: 0.3 }, 0)
					.to(q(".lp-hero__scroll-cue, .lp-hero__floaty"), { opacity: 0, y: -80, duration: 0.15 }, 0)
					.to(stage, { x: toCenter, duration: 0.35, ease: "power2.inOut" }, 0.05)
					.to(q(".lp-hero__milo"), { scale: 1.2, duration: 0.3, ease: "power1.inOut" }, 0.1)
					.to(q(".lp-hero__sun-fill"), { opacity: 1, duration: 0.2 }, 0.2)
					.to(q(".lp-hero__sun, .lp-hero__sun-fill"), { scale: sunScale, duration: 0.4, ease: "power2.in" }, 0.2)
					.to(q(".lp-hero__milo"), { yPercent: 140, scale: 0.45, rotate: -14, duration: 0.3, ease: "back.in(1.6)" }, 0.58)
					.fromTo(q(".lp-hero__portal"), { opacity: 0, scale: 0.4, rotate: -6 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.22, ease: "back.out(2)" }, 0.66)
					.to(q(".lp-hero__portal"), { opacity: 0, yPercent: -60, scale: 1.15, duration: 0.14, ease: "power2.in" }, 0.9);

				return () => {
					heroState.progress = 0;
				};
			});

			/* ---------- Mobile : sortie simple, sans épinglage ---------- */
			mm.add(MEDIA_NO_PIN, () => {
				gsap.timeline({
					scrollTrigger: {
						trigger: root.current,
						start: "top top",
						end: "bottom top",
						scrub: true,
						onUpdate: (self) => (heroState.progress = self.progress),
					},
				})
					.to(q(".lp-hero__stage"), { scale: 0.85, yPercent: 10, ease: "none" }, 0)
					.to(q(".lp-hero__chip, .lp-hero__bubble"), { scale: 0, opacity: 0, stagger: 0.05, ease: "none" }, 0);
			});
		},
		{ scope: root },
	);

	return (
		<section className="lp-hero" id={SECTION_IDS.concept} ref={root}>
			<div className="lp-hero__bg" aria-hidden="true">
				<div className="lp-hero__dots" />
				<div className="lp-hero__blob lp-hero__blob--1" />
				<div className="lp-hero__blob lp-hero__blob--2" />
				<Emoji3D name="light_bulb" className="lp-hero__floaty lp-hero__floaty--bulb" />
				<Emoji3D name="globe" className="lp-hero__floaty lp-hero__floaty--globe" />
			</div>

			<div className="lp-wrap lp-hero__grid">
				<div className="lp-hero__copy">
					<span data-hero-in>
						<Eyebrow>Le tuteur IA des collégiens</Eyebrow>
					</span>
					<h1 className="lp-display lp-hero__title">
						Apprendre est un <span className="lp-hl">jeu d'enfant.</span>
					</h1>
					<p className="lp-lead" data-hero-in>
						Les révisions n'ont jamais été aussi amusantes qu'avec Milo. Chaque session devient une aventure
						ludique, interactive et faite pour toi.
					</p>
					<div className="lp-hero__actions" data-hero-in>
						<Link to="/register" className="lp-btn lp-btn--primary">
							Rejoindre l'aventure <ArrowRight size={22} />
						</Link>
						<a
							href={`#${SECTION_IDS.kids}`}
							className="lp-btn lp-btn--ghost"
							onClick={(e) => {
								if (scrollToSection(SECTION_IDS.kids)) e.preventDefault();
							}}
						>
							Voir les missions
						</a>
					</div>
					<div className="lp-hero__meta" data-hero-in>
						<div className="lp-hero__avatars" aria-hidden="true">
							{(["student", "teacher", "fox"] as const).map((name) => (
								<span key={name}>
									<Emoji3D name={name} loading="eager" />
								</span>
							))}
						</div>
						<p>
							<strong>Pensé pour les collégiens</strong>
							<br />
							de la 6ᵉ à la 3ᵉ, et leurs parents
						</p>
					</div>
					<ul className="lp-hero__proofs" data-hero-in>
						{HERO_PROOFS.map((proof) => (
							<li key={proof}>
								<Check size={17} strokeWidth={3} />
								{proof}
							</li>
						))}
					</ul>
				</div>

				<div className={`lp-hero__stage${is3DReady ? " is-3d" : ""}`}>
					<div className="lp-hero__orbit" aria-hidden="true">
						<i />
						<i />
					</div>
					<div className="lp-hero__sun" aria-hidden="true" />
					<div className="lp-hero__sun-fill" aria-hidden="true" />
					<div className="lp-hero__milo">
						<img className="lp-hero__fallback" src="/landing/milo-reading.webp" alt="Milo, le renard mascotte" />
						<HeroScene3D reducedMotion={reducedMotion} onReady={onSceneReady} />
					</div>
					<HeroBubble enabled={!reducedMotion} />
					{HERO_CHIPS.map((chip, i) => (
						<div key={chip.title} className={`lp-hero__chip lp-hero__chip--${i + 1}`} aria-hidden="true">
							<Emoji3D name={chip.icon} loading="eager" />
							<div>
								<span className={chip.accent ? "lp-hero__xp" : undefined}>{chip.title}</span>
								<small>{chip.subtitle}</small>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="lp-hero__portal" aria-hidden="true">
				<Emoji3D name="rocket" />
				<span>
					En route pour
					<br />
					l'aventure !
				</span>
			</div>

			<a
				href={`#${SECTION_IDS.manifesto}`}
				className="lp-hero__scroll-cue"
				onClick={(e) => {
					if (scrollToSection(SECTION_IDS.manifesto)) e.preventDefault();
				}}
			>
				<span className="lp-hero__mouse" aria-hidden="true" />
				Scrolle pour l'aventure
			</a>
		</section>
	);
};

export default Hero;
