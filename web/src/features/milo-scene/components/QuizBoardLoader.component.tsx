import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import ChalkTitle from "@features/milo-scene/components/ChalkTitle.component";
import { emojiSrc, MASCOT_SRC, type BrandEmoji } from "@shared/components/quiz/quiz.assets";

/// Objets 3D qui tournent autour du soleil
const ORBIT: BrandEmoji[] = ["books", "light_bulb", "brain", "glowing_star", "graduation_cap", "sparkles"];

/// Ce que Milo est en train de faire : les étapes se cochent une à une
const STEPS = ["Je relis la leçon", "Je choisis les questions", "Je mélange les réponses", "Je vérifie tout"];

const LINES = [
	"Échauffe tes neurones !",
	"Pas de stress, c'est pour t'entraîner.",
	"Tu peux répondre au clavier : 1, 2, 3, 4.",
	"Une erreur ? Demande-moi « Pourquoi ? ».",
];

const STEP_MS = 1800;
const LINE_MS = 2600;

interface QuizBoardLoaderProps {
	onCancel: () => void;
}

/// Attente de la génération du quiz, dessinée sur le tableau : le soleil feu
/// de la charte et ses anneaux à la craie, Milo qui lit, les objets 3D en
/// orbite, et à droite les étapes que Milo coche au fur et à mesure.
const QuizBoardLoader: React.FC<QuizBoardLoaderProps> = ({ onCancel }) => {
	const reduceMotion = useReducedMotion();
	const [done, setDone] = useState(0);
	const [line, setLine] = useState(0);

	// La dernière étape reste « en cours » jusqu'à l'arrivée des questions
	useEffect(() => {
		if (done >= STEPS.length - 1) return;
		const t = setTimeout(() => setDone((n) => n + 1), STEP_MS);
		return () => clearTimeout(t);
	}, [done]);

	useEffect(() => {
		const id = setInterval(() => setLine((i) => (i + 1) % LINES.length), LINE_MS);
		return () => clearInterval(id);
	}, []);

	const spring = { type: "spring" as const, stiffness: 260, damping: 16 };

	return (
		<div className="cls-qload" role="status" aria-live="polite">
			{/* Scène : soleil feu, anneaux de craie, orbite, Milo */}
			<div className="cls-qload-stage" aria-hidden="true">
				<motion.span
					className="cls-qload-sun"
					initial={reduceMotion ? false : { scale: 0.2, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={spring}
				/>
				<span className="cls-qload-ring" />
				<span className="cls-qload-ring cls-qload-ring--2" />
				<div className="cls-qload-orbit">
					{ORBIT.map((name, i) => (
						<span
							key={name}
							className="cls-qload-orbiter"
							style={{ "--a": `${(360 / ORBIT.length) * i}deg` } as React.CSSProperties}
						>
							<motion.img
								src={emojiSrc(name)}
								alt=""
								initial={reduceMotion ? false : { scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ ...spring, stiffness: 340, damping: 12, delay: 0.3 + i * 0.08 }}
							/>
						</span>
					))}
				</div>
				<motion.img
					className="cls-qload-mascot"
					src={MASCOT_SRC}
					alt=""
					initial={reduceMotion ? false : { y: 70, opacity: 0, scale: 0.8 }}
					animate={{ y: 0, opacity: 1, scale: 1 }}
					transition={{ ...spring, delay: 0.15 }}
				/>
				<span className="cls-qload-shadow" />
			</div>

			{/* Texte : titre, étapes cochées, bulle de Milo */}
			<div className="cls-qload-copy">
				<span className="cls-chalk-eyebrow">
					<i />
					Quiz de la leçon
				</span>
				<ChalkTitle text="Milo prépare ton quiz !" highlight="quiz" className="cls-board-title cls-qload-title" />

				<ol className="cls-qload-steps">
					{STEPS.map((step, i) => {
						const state = i < done ? "is-done" : i === done ? "is-doing" : "is-todo";
						return (
							<motion.li
								key={step}
								className={state}
								initial={reduceMotion ? false : { opacity: 0, x: -12 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.25 + i * 0.1, duration: 0.3 }}
							>
								<span className="cls-qload-check" aria-hidden="true">
									<AnimatePresence>
										{i < done && (
											<motion.span
												initial={reduceMotion ? false : { scale: 0, rotate: -45 }}
												animate={{ scale: 1, rotate: 0 }}
												transition={{ type: "spring", stiffness: 500, damping: 16 }}
											>
												<Check size={16} strokeWidth={3.5} />
											</motion.span>
										)}
									</AnimatePresence>
								</span>
								{step}
								{i === done && (
									<span className="cls-qload-dots" aria-hidden="true">
										<i />
										<i />
										<i />
									</span>
								)}
							</motion.li>
						);
					})}
				</ol>

				<div className="cls-qload-bubble">
					<img src="/landing/emoji/fox.webp" alt="" aria-hidden="true" />
					<AnimatePresence mode="wait" initial={false}>
						<motion.span
							key={line}
							initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
							transition={{ duration: 0.25 }}
						>
							{LINES[line]}
						</motion.span>
					</AnimatePresence>
				</div>

				<div className="cls-qload-bar" aria-hidden="true">
					<span />
				</div>

				<button type="button" className="cls-btn cls-btn--chalk cls-btn--sm" onClick={onCancel}>
					Annuler
				</button>
			</div>
		</div>
	);
};

export default QuizBoardLoader;
