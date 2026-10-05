import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrandTitle from "@shared/components/quiz/BrandTitle.component";
import { MASCOT_SRC, emojiSrc, type BrandEmoji } from "@shared/components/quiz/quiz.assets";
import "@shared/styles/Quiz.css";

const ORBITS: Record<"qcm" | "duel", BrandEmoji[]> = {
	qcm: ["books", "light_bulb", "brain", "glowing_star", "graduation_cap", "sparkles"],
	duel: ["crossed_swords", "trophy", "high_voltage", "fire", "sports_medal", "rocket"],
};

/// Petits objets qui flottent sur toute la page, en arrière-plan
const FLOATERS: { emoji: BrandEmoji; top: string; left: string; size: number; delay: number }[] = [
	{ emoji: "sparkles", top: "12%", left: "8%", size: 46, delay: 0 },
	{ emoji: "star", top: "72%", left: "6%", size: 40, delay: 0.8 },
	{ emoji: "coin", top: "18%", left: "88%", size: 44, delay: 0.4 },
	{ emoji: "gem_stone", top: "78%", left: "90%", size: 40, delay: 1.2 },
];

interface QuizLoaderProps {
	variant?: "qcm" | "duel";
	/// Étiquette au-dessus du titre
	eyebrow: string;
	title: string;
	/// Mot mis en avant dans le titre
	highlight?: string;
	/// Répliques de Milo, qui défilent dans la bulle
	messages: string[];
	/// Remplace la mascotte au centre du soleil
	art?: React.ReactNode;
	/// Sous la barre de progression (bouton Annuler…)
	children?: React.ReactNode;
	className?: string;
}

/// Écran d'attente de la charte : soleil feu à anneaux pointillés, Milo qui
/// flotte, objets 3D en orbite, bulle de dialogue et barre de progression.
const QuizLoader: React.FC<QuizLoaderProps> = ({
	variant = "qcm",
	eyebrow,
	title,
	highlight,
	messages,
	art,
	children,
	className = "",
}) => {
	const reduceMotion = useReducedMotion();
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (messages.length < 2) return;
		const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 2400);
		return () => clearInterval(id);
	}, [messages.length]);

	const orbit = ORBITS[variant];

	return (
		<div className={`qz-loader qz-loader--${variant} ${className}`} role="status" aria-live="polite">
			<div className="qz-loader-dots" aria-hidden="true" />

			{FLOATERS.map((f) => (
				<motion.img
					key={f.emoji}
					src={emojiSrc(f.emoji)}
					alt=""
					aria-hidden="true"
					className="qz-loader-floater"
					style={{ top: f.top, left: f.left, width: f.size, height: f.size }}
					initial={{ opacity: 0, scale: 0.4 }}
					animate={
						reduceMotion
							? { opacity: 0.9, scale: 1 }
							: { opacity: 0.9, scale: 1, y: [0, -16, 0], rotate: [-6, 6, -6] }
					}
					transition={{
						opacity: { delay: 0.4 + f.delay * 0.3 },
						scale: { type: "spring", stiffness: 300, damping: 14, delay: 0.4 + f.delay * 0.3 },
						y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: f.delay },
						rotate: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: f.delay },
					}}
				/>
			))}

			<div className="qz-loader-grid">
				{/* Scène : soleil, orbite, Milo */}
				<div className="qz-loader-stage" aria-hidden="true">
					<motion.div
						className="qz-loader-sun"
						initial={reduceMotion ? false : { scale: 0.2, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: "spring", stiffness: 180, damping: 14 }}
					>
						<span className="qz-loader-ring" />
						<span className="qz-loader-ring qz-loader-ring--2" />
						<span className="qz-loader-sun-dots" />
					</motion.div>

					<div className="qz-loader-orbit">
						{orbit.map((name, i) => (
							<span
								key={name}
								className="qz-loader-orbiter"
								style={{ "--a": `${(360 / orbit.length) * i}deg` } as React.CSSProperties}
							>
								<motion.img
									src={emojiSrc(name)}
									alt=""
									draggable={false}
									initial={reduceMotion ? false : { scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: "spring", stiffness: 320, damping: 12, delay: 0.35 + i * 0.08 }}
								/>
							</span>
						))}
					</div>

					<motion.div
						className="qz-loader-art"
						initial={reduceMotion ? false : { y: 80, opacity: 0, scale: 0.8 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						transition={{ type: "spring", stiffness: 220, damping: 13, delay: 0.15 }}
					>
						{art ?? <img src={MASCOT_SRC} alt="" className="qz-loader-mascot" draggable={false} />}
					</motion.div>
					<span className="qz-loader-shadow" />
				</div>

				{/* Texte */}
				<div className="qz-loader-copy">
					<motion.span
						className="qz-eyebrow"
						initial={reduceMotion ? false : { y: 12, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.1 }}
					>
						<i />
						{eyebrow}
					</motion.span>

					<BrandTitle as="h1" text={title} highlight={highlight} delay={0.2} className="qz-loader-title" />

					<div className="qz-bubble">
						<AnimatePresence mode="wait" initial={false}>
							<motion.span
								key={index}
								initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
								transition={{ duration: 0.25 }}
							>
								{messages[index]}
							</motion.span>
						</AnimatePresence>
					</div>

					<div className="qz-loader-bar" aria-hidden="true">
						<span className="qz-loader-bar-fill" />
					</div>

					{children && <div className="qz-loader-extra">{children}</div>}
				</div>
			</div>
		</div>
	);
};

export default QuizLoader;
