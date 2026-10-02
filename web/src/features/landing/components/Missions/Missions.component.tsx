import React, { useRef } from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { MISSIONS, SECTION_IDS } from "@features/landing/data/landing.data";
import { MEDIA_DESKTOP_PIN, MEDIA_NO_PIN, ScrollTrigger, SplitText, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle } from "@features/landing/lib/animations";
import { scrollToY } from "@features/landing/lib/smoothScroll";
import "@features/landing/components/Missions/Missions.css";

const PINNED_CLASS = "is-pinned";

/// Les 3 missions des enfants.
/// Desktop : section épinglée et grand format, le scroll fait défiler les
/// missions (portail circulaire, tablette qui atterrit en 3D, reflet, halo
/// tournant, titres mot à mot, compteur géant). Mobile : liste classique.
const Missions: React.FC = () => {
	const root = useRef<HTMLElement>(null);
	const count = MISSIONS.length;

	useGSAP(
		() => {
			const q = gsap.utils.selector(root);
			if (prefersReducedMotion()) return;
			revealTitle(q(".lp-missions__title")[0]);

			const mm = gsap.matchMedia();

			mm.add(MEDIA_DESKTOP_PIN, () => {
				const section = root.current;
				if (!section) return;
				section.classList.add(PINNED_CLASS);

				const devices = q(".lp-mission__device-wrap");
				const screens = devices.map((d) => d.querySelector(".lp-mission__device") as HTMLElement);
				const shines = q(".lp-mission__shine");
				const texts = q(".lp-mission__text");
				// Titre découpé en mots (révélés un par un), puis le reste du texte
				const titles = texts.map((t) => SplitText.create(t.querySelector("h3"), { type: "words" }).words);
				const bodies = texts.map((t) => Array.from(t.querySelectorAll(".lp-mission__badge, .lp-lead, .lp-mission__tags li")));
				const decor = q(".lp-mission__decor").map((d) => Array.from(d.children));
				const dots = q(".lp-missions__dots button");
				const setCurrent = (index: number) =>
					dots.forEach((dot, j) => dot.setAttribute("aria-current", String(j === index)));

				gsap.set(devices, { transformPerspective: 1400, transformOrigin: "50% 60%" });
				gsap.set(screens.slice(1), { clipPath: "circle(0% at 50% 50%)" });
				gsap.set(texts.slice(1), { autoAlpha: 0 });
				gsap.set(titles.slice(1).flat(), { yPercent: 110, rotate: 6, opacity: 0 });
				gsap.set(bodies.slice(1).flat(), { y: 40, opacity: 0 });
				gsap.set(decor.slice(1).flat(), { scale: 0, rotate: -40 });

				// Entrée : la tablette arrive de loin en basculant, le titre monte mot à mot
				const enter = { trigger: section, start: "top bottom", end: "top top", scrub: true };
				gsap.fromTo(
					q(".lp-missions__list"),
					{ scale: 0.7, rotateX: 40, y: 160, transformPerspective: 1400, opacity: 0.2 },
					{ scale: 1, rotateX: 0, y: 0, opacity: 1, ease: "none", scrollTrigger: enter },
				);
				gsap.fromTo(
					q(".lp-missions__num"),
					{ yPercent: 60, opacity: 0 },
					{ yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 60%", end: "top top", scrub: true } },
				);
				gsap
					.timeline({ scrollTrigger: { trigger: section, start: "top 55%", end: "top 5%", scrub: true } })
					.from(titles[0], { yPercent: 110, rotate: 6, opacity: 0, stagger: 0.08, ease: "back.out(1.6)" }, 0)
					.from(bodies[0], { y: 40, opacity: 0, stagger: 0.06, ease: "power2.out" }, 0.15)
					.to(shines[0], { xPercent: 340, ease: "power2.inOut", duration: 0.8 }, 0.2);

				// Mission sur laquelle l'aimantation s'est posée en dernier
				let settled = 0;
				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: section,
						start: "top top",
						end: () => "+=" + window.innerHeight * (count - 0.2) * 1.15,
						pin: true,
						scrub: 0.8,
						onUpdate: (self) => setCurrent(Math.round(self.progress * (count - 1))),
						// Point de départ de l'aimantation selon le côté par lequel on entre
						onEnter: () => (settled = 0),
						onEnterBack: () => (settled = count - 1),
					},
				});
				tl.to(q(".lp-missions__progress span"), { scaleX: 1, ease: "none", duration: count - 1 }, 0);

				for (let i = 1; i < count; i++) {
					const t0 = i - 1;
					const prev = i - 1;
					tl
						// Sortie : le texte s'envole, la tablette bascule vers l'arrière
						.to(titles[prev], { yPercent: -110, rotate: -6, opacity: 0, stagger: 0.02, duration: 0.25, ease: "power2.in" }, t0 + 0.04)
						.to(bodies[prev], { y: -40, opacity: 0, stagger: 0.02, duration: 0.25, ease: "power2.in" }, t0 + 0.08)
						.to(texts[prev], { autoAlpha: 0, duration: 0.01 }, t0 + 0.4)
						.to(decor[prev], { scale: 0, rotate: 40, duration: 0.22, stagger: 0.03, ease: "power2.in" }, t0 + 0.04)
						.to(devices[prev], { rotateY: -28, rotateX: 10, xPercent: -14, scale: 0.78, opacity: 0, duration: 0.55, ease: "power2.in" }, t0 + 0.12)
						// Le halo de couleur tourne et change de côté
						.to(q(".lp-missions__glow"), { rotate: 140 * i, xPercent: i % 2 ? 14 : -10, scale: i % 2 ? 1.15 : 0.95, duration: 0.7, ease: "power2.inOut" }, t0 + 0.1)
						// Entrée : portail circulaire, la tablette atterrit en 3D
						.to(screens[i], { clipPath: "circle(100% at 50% 50%)", duration: 0.55, ease: "power3.inOut" }, t0 + 0.2)
						.fromTo(
							devices[i],
							{ rotateY: 30, rotateX: -8, xPercent: 12, scale: 1.18 },
							{ rotateY: 0, rotateX: 0, xPercent: 0, scale: 1, duration: 0.6, ease: "power3.out", immediateRender: false },
							t0 + 0.2,
						)
						// Reflet qui balaie l'écran une fois posé
						.to(shines[i], { xPercent: 340, duration: 0.45, ease: "power2.inOut" }, t0 + 0.5)
						.to(q(".lp-missions__num-col"), { yPercent: (-100 / count) * i, duration: 0.6, ease: "power3.inOut" }, t0 + 0.15)
						.to(texts[i], { autoAlpha: 1, duration: 0.01 }, t0 + 0.42)
						.to(titles[i], { yPercent: 0, rotate: 0, opacity: 1, stagger: 0.04, duration: 0.32, ease: "back.out(1.6)" }, t0 + 0.45)
						.to(bodies[i], { y: 0, opacity: 1, stagger: 0.04, duration: 0.3, ease: "power3.out" }, t0 + 0.55)
						.to(decor[i], { scale: 1, rotate: 0, stagger: 0.05, duration: 0.3, ease: "back.out(2)" }, t0 + 0.6);
				}

				// Le décor 3D flotte en continu
				decor.flat().forEach((img, k) =>
					gsap.to(img, { y: k % 2 ? 12 : -12, duration: 2 + (k % 3) * 0.4, repeat: -1, yoyo: true, ease: "sine.inOut" }),
				);

				// Aimantation directionnelle quand le scroll s'arrête : un petit pas
				// dans un sens suffit pour passer à la mission suivante (ou revenir),
				// au lieu d'être ramené à la plus proche. Le `snap` de ScrollTrigger
				// se battait avec Lenis (à-coups) : on passe par Lenis.
				const SNAP_THRESHOLD = 0.06;
				const snapToMission = () => {
					const st = tl.scrollTrigger;
					if (!st?.isActive) return;
					const position = st.progress * (count - 1);
					const delta = position - settled;
					let index = settled;
					if (delta > SNAP_THRESHOLD) index = Math.ceil(position - SNAP_THRESHOLD);
					else if (delta < -SNAP_THRESHOLD) index = Math.floor(position + SNAP_THRESHOLD);
					index = Math.max(0, Math.min(count - 1, index));
					settled = index;
					const target = st.start + (st.end - st.start) * (index / (count - 1));
					if (Math.abs(st.scroll() - target) > 2) scrollToY(target, 0.8);
				};
				ScrollTrigger.addEventListener("scrollEnd", snapToMission);

				const handlers = dots.map((dot, j) => {
					const onClick = () => {
						const st = tl.scrollTrigger;
						if (!st) return;
						settled = j;
						scrollToY(st.start + (st.end - st.start) * (j / (count - 1)) + 2);
					};
					dot.addEventListener("click", onClick);
					return onClick;
				});

				return () => {
					ScrollTrigger.removeEventListener("scrollEnd", snapToMission);
					section.classList.remove(PINNED_CLASS);
					dots.forEach((dot, j) => dot.removeEventListener("click", handlers[j]));
				};
			});

			mm.add(MEDIA_NO_PIN, () => {
				q(".lp-mission").forEach((mission) => {
					gsap.from(mission.querySelector(".lp-mission__device"), {
						y: 80,
						rotate: -4,
						opacity: 0,
						duration: 0.9,
						ease: "power3.out",
						scrollTrigger: { trigger: mission, start: "top 85%", once: true },
					});
					gsap.from(mission.querySelectorAll(".lp-mission__text > *, .lp-mission__tags li"), {
						y: 30,
						opacity: 0,
						stagger: 0.06,
						duration: 0.6,
						ease: "power3.out",
						scrollTrigger: { trigger: mission, start: "top 70%", once: true },
					});
				});
			});
		},
		{ scope: root },
	);

	return (
		<section className="lp-missions" id={SECTION_IDS.kids} ref={root}>
			<div className="lp-wrap lp-missions__inner">
				<div className="lp-missions__num" aria-hidden="true">
					<div className="lp-missions__num-col">
						{MISSIONS.map((_, i) => (
							<span key={i}>{String(i + 1).padStart(2, "0")}</span>
						))}
					</div>
				</div>

				<div className="lp-missions__head">
					<h2 className="lp-display lp-section-title lp-missions__title">
						Choisis ta <span className="lp-hl">mission</span>
					</h2>
				</div>

				<div className="lp-missions__list">
					<div className="lp-missions__glow" aria-hidden="true" />
					{MISSIONS.map((mission, i) => (
						<article className="lp-mission" key={mission.navLabel}>
							<div className="lp-mission__device-wrap">
								<div className="lp-mission__device">
									<div className="lp-mission__screen">
										<img src={mission.image} alt={mission.imageAlt} loading={i ? "lazy" : "eager"} />
										<span className="lp-mission__shine" aria-hidden="true" />
									</div>
								</div>
								<div className="lp-mission__decor" aria-hidden="true">
									{mission.decor.map((name) => (
										<Emoji3D key={name} name={name} />
									))}
								</div>
							</div>
							<div className="lp-mission__text">
								<span className="lp-mission__badge">
									MISSION {i + 1}/{count}
								</span>
								<h3 className="lp-display">
									{mission.title} <span className="lp-hl">{mission.highlight}</span>
								</h3>
								<p className="lp-lead">{mission.description}</p>
								<ul className="lp-mission__tags">
									{mission.tags.map((tag) => (
										<li key={tag.label}>
											<Emoji3D name={tag.icon} />
											{tag.label}
										</li>
									))}
								</ul>
							</div>
						</article>
					))}
				</div>

				<div className="lp-missions__nav">
					<div className="lp-missions__dots">
						{MISSIONS.map((mission, i) => (
							<button key={mission.navLabel} type="button" aria-current={i === 0}>
								{mission.navLabel}
							</button>
						))}
					</div>
					<div className="lp-missions__progress" aria-hidden="true">
						<span />
					</div>
				</div>
			</div>
		</section>
	);
};

export default Missions;
