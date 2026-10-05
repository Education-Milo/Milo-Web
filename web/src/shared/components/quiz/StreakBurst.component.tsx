import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrandTitle from "@shared/components/quiz/BrandTitle.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import { STREAK_MILESTONES } from "@shared/components/quiz/streak.utils";
import { MASCOT_SRC, emojiSrc, type BrandEmoji } from "@shared/components/quiz/quiz.assets";
import "@shared/styles/Quiz.css";

const titleFor = (streak: number) => {
	if (streak >= 10) return "Inarrêtable !";
	if (streak >= 7) return "Légendaire !";
	if (streak >= 5) return "En feu !";
	return "En série !";
};

const miloLineFor = (streak: number) => {
	if (streak >= 10) return "Personne ne peut t'arrêter !";
	if (streak >= 7) return "C'est du jamais vu !";
	if (streak >= 5) return "Tu es en feu !!";
	return "Continue comme ça !";
};

/// Objets 3D projetés autour du chiffre : angle (degrés), distance (px)
const SATELLITES: { emoji: BrandEmoji; angle: number; distance: number; size: number }[] = [
	{ emoji: "high_voltage", angle: -155, distance: 260, size: 86 },
	{ emoji: "sparkles", angle: -25, distance: 270, size: 80 },
	{ emoji: "glowing_star", angle: 160, distance: 280, size: 76 },
	{ emoji: "hundred_points", angle: 15, distance: 290, size: 80 },
	{ emoji: "rocket", angle: -100, distance: 300, size: 70 },
	{ emoji: "trophy", angle: -65, distance: 300, size: 68 },
];

const FLAMES = 15;
const EMBERS = 46;

interface StreakBurstProps {
	/// Série à célébrer ; null masque la célébration
	streak: number | null;
	/// Clic, toucher ou Échap : on referme avant la fin
	onDismiss?: () => void;
}

/// Point de départ du rideau : la puce de série si elle est à l'écran
const useOrigin = (active: boolean) => {
	const [origin, setOrigin] = useState({ x: 0, y: 0 });
	useLayoutEffect(() => {
		if (!active) return;
		const chip = document.querySelector(".qz-streak");
		if (chip) {
			const rect = chip.getBoundingClientRect();
			setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
		} else {
			setOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
		}
	}, [active]);
	return origin;
};

/// Célébration plein écran d'un palier de série (3, 5, 7, 10…).
/// L'écran tremble, un rideau feu jaillit de la puce de série, un mur de
/// flammes 3D monte du bas, le chiffre géant s'écrase avec ondes de choc et
/// flash, objets 3D, braises, confettis, Milo qui débarque avec sa bulle,
/// jauge vers le palier suivant. Puis tout se replie dans la puce.
const StreakBurst: React.FC<StreakBurstProps> = ({ streak, onDismiss }) => {
	const reduceMotion = useReducedMotion();
	const active = streak !== null;
	const origin = useOrigin(active);
	const radius = typeof window !== "undefined" ? Math.hypot(window.innerWidth, window.innerHeight) * 1.05 : 2400;
	const legendary = (streak ?? 0) >= 7;

	const flames = useMemo(
		() =>
			Array.from({ length: streak === null ? 0 : FLAMES }, (_, i) => ({
				left: (i / (FLAMES - 1)) * 100 + (Math.random() - 0.5) * 4,
				size: 130 + Math.random() * 110,
				delay: 0.25 + Math.abs(i - FLAMES / 2) * 0.035 + Math.random() * 0.08,
				flicker: 0.5 + Math.random() * 0.35,
			})),
		[streak],
	);

	const embers = useMemo(
		() =>
			Array.from({ length: streak === null ? 0 : EMBERS }, () => ({
				left: Math.random() * 100,
				size: 4 + Math.random() * 11,
				delay: 0.3 + Math.random() * 1.6,
				duration: 1.4 + Math.random() * 1.3,
				drift: (Math.random() - 0.5) * 160,
				tone: Math.floor(Math.random() * 4),
			})),
		[streak],
	);

	/// Secousse de toute la page à l'impact du chiffre
	useEffect(() => {
		if (!active || reduceMotion) return;
		const root = document.getElementById("root");
		const id = window.setTimeout(() => {
			root?.animate(
				[
					{ transform: "translate(0, 0)" },
					{ transform: "translate(-14px, 8px) rotate(-0.4deg)" },
					{ transform: "translate(12px, -10px) rotate(0.4deg)" },
					{ transform: "translate(-9px, 6px)" },
					{ transform: "translate(6px, -4px)" },
					{ transform: "translate(-3px, 2px)" },
					{ transform: "translate(0, 0)" },
				],
				{ duration: 520, easing: "ease-out" },
			);
		}, 620);
		return () => window.clearTimeout(id);
	}, [active, streak, reduceMotion]);

	useEffect(() => {
		if (!active || !onDismiss) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onDismiss();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [active, onDismiss]);

	const value = streak ?? 0;
	const next = STREAK_MILESTONES.find((m) => m > value) ?? value + 5;
	const previous = [...STREAK_MILESTONES].reverse().find((m) => m < value) ?? 0;
	const progress = Math.max(0.08, Math.min((value - previous) / (next - previous), 1));
	const at = `${origin.x}px ${origin.y}px`;

	return (
		<AnimatePresence>
			{active && (
				<motion.div
					key="streak-fx"
					className={`qz-fx ${legendary ? "is-legendary" : ""}`}
					role="status"
					aria-live="assertive"
					aria-label={`${titleFor(value)} ${value} bonnes réponses d'affilée`}
					onClick={onDismiss}
					initial={reduceMotion ? { opacity: 0 } : { clipPath: `circle(0px at ${at})` }}
					animate={reduceMotion ? { opacity: 1 } : { clipPath: `circle(${radius}px at ${at})` }}
					exit={reduceMotion ? { opacity: 0 } : { clipPath: `circle(0px at ${at})` }}
					transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
				>
					<div className="qz-fx-dots" aria-hidden="true" />
					{!reduceMotion && <div className="qz-fx-rays" aria-hidden="true" />}
					{!reduceMotion && <div className="qz-fx-streaks" aria-hidden="true" />}

					{/* Braises */}
					{!reduceMotion && (
						<div className="qz-fx-embers" aria-hidden="true">
							{embers.map((ember, i) => (
								<motion.span
									key={i}
									className={`qz-fx-ember qz-fx-ember--${ember.tone}`}
									style={{ left: `${ember.left}%`, width: ember.size, height: ember.size }}
									initial={{ y: 0, x: 0, opacity: 0 }}
									animate={{ y: "-110vh", x: ember.drift, opacity: [0, 1, 1, 0] }}
									transition={{ duration: ember.duration, delay: ember.delay, ease: "easeOut", repeat: Infinity }}
								/>
							))}
						</div>
					)}

					{/* Mur de flammes 3D */}
					<div className="qz-fx-flames" aria-hidden="true">
						{flames.map((flame, i) => (
							<motion.img
								key={i}
								src={emojiSrc("fire")}
								alt=""
								className="qz-fx-flame"
								style={{ left: `${flame.left}%`, width: flame.size, height: flame.size, marginLeft: -flame.size / 2 }}
								initial={reduceMotion ? false : { y: "120%", scaleY: 0.4 }}
								animate={reduceMotion ? undefined : { y: "18%", scaleY: [0.4, 1.15, 0.95, 1.08, 1] }}
								transition={{
									y: { type: "spring", stiffness: 140, damping: 13, delay: flame.delay },
									scaleY: { duration: flame.flicker * 2, delay: flame.delay, repeat: Infinity, repeatType: "mirror" },
								}}
							/>
						))}
					</div>

					{/* Cœur : chiffre géant */}
					<div className="qz-fx-core">
						{!reduceMotion && (
							<>
								{[0, 1, 2].map((i) => (
									<motion.span
										key={i}
										className="qz-fx-shock"
										aria-hidden="true"
										initial={{ scale: 0.2, opacity: 0 }}
										animate={{ scale: [0.2, 3.2 + i], opacity: [0.95, 0] }}
										transition={{ duration: 0.9, delay: 0.62 + i * 0.12, ease: "easeOut" }}
									/>
								))}
								<motion.span
									className="qz-fx-flash"
									aria-hidden="true"
									initial={{ opacity: 0 }}
									animate={{ opacity: [0, 0.9, 0] }}
									transition={{ duration: 0.45, delay: 0.6, times: [0, 0.15, 1] }}
								/>
								{SATELLITES.map((sat, i) => {
									const rad = (sat.angle * Math.PI) / 180;
									const x = Math.cos(rad) * sat.distance;
									const y = Math.sin(rad) * sat.distance;
									return (
										<motion.img
											key={sat.emoji}
											src={emojiSrc(sat.emoji)}
											alt=""
											aria-hidden="true"
											className="qz-fx-sat"
											style={{ width: sat.size, height: sat.size, marginLeft: -sat.size / 2, marginTop: -sat.size / 2 }}
											initial={{ x: 0, y: 0, scale: 0, rotate: -120 }}
											animate={{ x, y: [y, y - 14, y], scale: 1, rotate: [0, i % 2 ? 10 : -10, 0] }}
											transition={{
												x: { type: "spring", stiffness: 130, damping: 11, delay: 0.7 + i * 0.04 },
												scale: { type: "spring", stiffness: 260, damping: 11, delay: 0.7 + i * 0.04 },
												y: { duration: 1.4, delay: 0.7 + i * 0.04, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
												rotate: { duration: 1.6, delay: 0.9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
											}}
										/>
									);
								})}
							</>
						)}

						<motion.img
							src={emojiSrc("fire")}
							alt=""
							aria-hidden="true"
							className="qz-fx-bigfire"
							initial={reduceMotion ? false : { scale: 0, y: 140 }}
							animate={reduceMotion ? undefined : { scale: [0, 1.2, 1], y: 0 }}
							transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
						/>

						<motion.div
							className="qz-fx-number"
							aria-hidden="true"
							initial={reduceMotion ? false : { scale: 5, opacity: 0, rotate: -18 }}
							animate={{ scale: 1, opacity: 1, rotate: -4 }}
							transition={{ type: "spring", stiffness: 520, damping: 17, delay: 0.5 }}
						>
							<span className="qz-fx-x">×</span>
							{value}
						</motion.div>
					</div>

					<div className="qz-fx-copy">
						<BrandTitle as="p" tone="creme" className="qz-fx-title" text={titleFor(value)} delay={0.85} />
						<motion.div
							className="qz-fx-meter"
							initial={reduceMotion ? false : { y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ type: "spring", stiffness: 380, damping: 20, delay: 1.1 }}
						>
							<span className="qz-fx-meter-label">
								{value} bonnes réponses d'affilée · prochain palier : {next}
							</span>
							<span className="qz-fx-meter-track">
								<motion.span
									className="qz-fx-meter-fill"
									initial={{ scaleX: 0 }}
									animate={{ scaleX: progress }}
									transition={{ type: "spring", stiffness: 90, damping: 14, delay: 1.3 }}
								/>
							</span>
						</motion.div>
					</div>

					{/* Milo débarque sur le côté */}
					<motion.div
						className="qz-fx-milo"
						aria-hidden="true"
						initial={reduceMotion ? false : { x: -320, rotate: -20 }}
						animate={{ x: 0, rotate: 0 }}
						transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.9 }}
					>
						<motion.div
							className="qz-bubble qz-fx-bubble"
							initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 420, damping: 14, delay: 1.25 }}
						>
							{miloLineFor(value)}
						</motion.div>
						<motion.img
							src={MASCOT_SRC}
							alt=""
							draggable={false}
							animate={reduceMotion ? undefined : { y: [0, -18, 0], rotate: [-3, 3, -3] }}
							transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
						/>
					</motion.div>

					<ConfettiBurst fixed count={legendary ? 150 : 100} spread={legendary ? 640 : 540} originX={50} originY={42} delay={0.62} />
					{legendary && <ConfettiBurst fixed count={80} spread={500} originX={20} originY={70} delay={1} />}
					{legendary && <ConfettiBurst fixed count={80} spread={500} originX={80} originY={70} delay={1.15} />}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default StreakBurst;
