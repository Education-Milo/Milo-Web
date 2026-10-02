import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import HeroScene3D from "@features/landing/components/Hero/HeroScene3D.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { HERO_BUBBLE_LINES, SECTION_IDS } from "@features/landing/data/landing.data";
import { MEDIA_DESKTOP_PIN, MEDIA_NO_PIN, SplitText, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { heroState } from "@features/landing/lib/heroState";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import "@features/landing/components/Hero/Hero.css";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/// Nuages de fumée laissés au sol par la fusée : décalage horizontal (px)
const SMOKE_PUFFS = [-150, -80, 0, 80, 150];

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

			/* Règle anti-saccades : l'intro (jouée au temps) et la sortie (pilotée
			   par le scroll) ne se disputent jamais une propriété sans valeurs de
			   départ explicites (fromTo). Revenir en haut retrouve donc toujours
			   l'état de repos, même si l'on a scrollé pendant l'intro. */
			let intro: gsap.core.Timeline | null = null;
			let scrolled = false;
			const finishIntro = () => {
				scrolled = true;
				if (intro?.isActive()) intro.progress(1);
			};

			/* ---------- Entrée (après chargement des polices, pour un split juste) ---------- */
			const playIntro = contextSafe(() => {
				// Page rechargée au milieu du scroll : la sortie a déjà posé ses valeurs
				if (!root.current || scrolled || window.scrollY > 4) return;
				const split = SplitText.create(q(".lp-hero__title"), { type: "chars,words" });
				intro = gsap
					.timeline({ defaults: { ease: "back.out(1.7)" } })
					.from(split.chars, { y: "0.7em", opacity: 0, rotate: 12, scale: 0.6, duration: 0.8, stagger: 0.022 }, 0.1)
					.from(q("[data-hero-in]"), { opacity: 0, y: 26, duration: 0.7, stagger: 0.09, ease: "power3.out" }, "-=.55")
					.from(q(".lp-hero__sun"), { scale: 0.5, opacity: 0, duration: 1.1, ease: "elastic.out(1, .7)" }, 0.2)
					.from(q(".lp-hero__orbit"), { scale: 0.7, opacity: 0, duration: 1, ease: "power3.out" }, 0.35)
					.from(q(".lp-hero__bubble"), { opacity: 0, scale: 0.3, duration: 0.6 }, 0.9)
					.from(q(".lp-hero__floaty"), { opacity: 0, scale: 0, rotate: -40, duration: 0.8, stagger: 0.1 }, 0.6);
			});
			document.fonts.ready.then(playIntro);

			// Flottaison continue : sur l'image, pas sur son conteneur (animé par l'intro)
			q(".lp-hero__floaty img").forEach((el, i) =>
				gsap.to(el, { y: 16, rotate: i % 2 ? 8 : -8, duration: 3 + i * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" }),
			);

			const mm = gsap.matchMedia();

			/* ---------- Desktop : Milo décolle sur sa fusée, le soleil devient un portail ---------- */
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
				// Assez haut pour que la fusée et sa traînée sortent de l'écran
				const flyAway = () => -(window.innerHeight + stage.offsetHeight * 2.2);

				gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: root.current,
						start: "top top",
						end: "+=200%",
						pin: true,
						scrub: 1,
						invalidateOnRefresh: true,
						onUpdate: (self) => self.progress > 0 && finishIntro(),
					},
				})
					// La 3D suit la timeline (et donc son lissage), pas le scroll brut
					.fromTo(heroState, { progress: 0 }, { progress: 1, duration: 0.45 }, 0)
					.to(q(".lp-hero__copy"), { xPercent: -40, opacity: 0, ease: "power2.in", duration: 0.3 }, 0)
					.fromTo(q(".lp-hero__bubble"), { scale: 1, opacity: 1, rotate: 0 }, { scale: 0, opacity: 0, rotate: -25, duration: 0.2, ease: "power2.in" }, 0)
					.fromTo(q(".lp-hero__orbit"), { scale: 1, opacity: 1 }, { scale: 1.8, opacity: 0, duration: 0.3 }, 0)
					.to(q(".lp-hero__scroll-cue, .lp-hero__floats"), { opacity: 0, y: -80, duration: 0.15 }, 0)
					.to(stage, { x: toCenter, duration: 0.35, ease: "power2.inOut" }, 0.05)
					.to(q(".lp-hero__milo"), { scale: 1.12, duration: 0.25, ease: "power1.inOut" }, 0.1)
					.fromTo(sun, { scale: 1 }, { scale: sunScale, duration: 0.4, ease: "power2.in" }, 0.2)
					// Allumage : les réacteurs sortent, la fusée tremble et s'élève un peu
					.fromTo(heroState, { launch: 0 }, { launch: 0.3, duration: 0.17, ease: "power1.in" }, 0.3)
					// Décollage : la scène 3D entière s'envole, une traînée de feu derrière
					.to(heroState, { launch: 1, duration: 0.4 }, 0.47)
					.to(q(".lp-hero__milo"), { y: flyAway, rotate: 4, duration: 0.4, ease: "power2.in" }, 0.47)
					.fromTo(q(".lp-hero__trail"), { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.18, ease: "power2.out" }, 0.47)
					.fromTo(
						q(".lp-hero__smoke i"),
						{ scale: 0, opacity: 0, x: 0 },
						{ scale: 1, opacity: 0.95, x: (i) => SMOKE_PUFFS[i], duration: 0.14, stagger: 0.012, ease: "power2.out" },
						0.47,
					)
					.to(q(".lp-hero__smoke i"), { opacity: 0, scale: 1.5, y: -40, duration: 0.24, ease: "power1.in" }, 0.64)
					// Le dégradé plein écran prend le relais du soleil (fondu, sans redimensionner)
					.fromTo(q(".lp-hero__fill"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.56)
					.fromTo(sun, { opacity: 1 }, { opacity: 0, duration: 0.1, immediateRender: false }, 0.56)
					.fromTo(q(".lp-hero__portal"), { opacity: 0, scale: 0.4, rotate: -6 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.22, ease: "back.out(2)" }, 0.62)
					.to(q(".lp-hero__portal"), { opacity: 0, yPercent: -40, scale: 1.1, duration: 0.14, ease: "power2.in" }, 0.9);

				return () => {
					heroState.progress = 0;
					heroState.launch = 0;
				};
			});

			/* ---------- Mobile : sortie simple, sans épinglage ---------- */
			mm.add(MEDIA_NO_PIN, () => {
				gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: root.current,
						start: "top top",
						end: "bottom top",
						scrub: 0.5,
						onUpdate: (self) => self.progress > 0 && finishIntro(),
					},
				})
					.fromTo(heroState, { progress: 0 }, { progress: 1 }, 0)
					.to(q(".lp-hero__stage"), { scale: 0.85, yPercent: 10 }, 0)
					.fromTo(q(".lp-hero__bubble"), { scale: 1, opacity: 1 }, { scale: 0, opacity: 0, duration: 0.5 }, 0);

				return () => {
					heroState.progress = 0;
				};
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
				<div className="lp-hero__floats">
					<div className="lp-hero__floaty lp-hero__floaty--bulb">
						<Emoji3D name="light_bulb" />
					</div>
					<div className="lp-hero__floaty lp-hero__floaty--globe">
						<Emoji3D name="globe" />
					</div>
				</div>
			</div>

			{/* Dégradé de la charte, plein écran : relie le hero au manifeste */}
			<div className="lp-hero__fill" aria-hidden="true" />

			<div className="lp-wrap lp-hero__grid">
				<div className="lp-hero__copy">
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
				</div>

				<div className={`lp-hero__stage${is3DReady ? " is-3d" : ""}`}>
					<div className="lp-hero__orbit" aria-hidden="true">
						<span className="lp-hero__orbit-ring">
							<i />
							<i />
						</span>
					</div>
					<div className="lp-hero__sun" aria-hidden="true" />
					<div className="lp-hero__smoke" aria-hidden="true">
						{SMOKE_PUFFS.map((x) => (
							<i key={x} />
						))}
					</div>
					<div className="lp-hero__milo">
						<span className="lp-hero__trail" aria-hidden="true" />
						<img className="lp-hero__fallback" src="/landing/milo-reading.webp" alt="Milo, le renard mascotte" />
						<HeroScene3D reducedMotion={reducedMotion} onReady={onSceneReady} />
					</div>
					<HeroBubble enabled={!reducedMotion} />
				</div>
			</div>

			<div className="lp-hero__portal" aria-hidden="true">
				En route pour
				<br />
				l'aventure !
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
