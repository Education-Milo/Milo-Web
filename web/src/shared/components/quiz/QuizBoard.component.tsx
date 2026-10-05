import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import "@shared/styles/Quiz.css";

interface QuizBoardProps {
	/// Étiquette à craie en haut à gauche (ex. « Question 3/10 »)
	tag: React.ReactNode;
	/// Contenu en haut à droite (chrono, série…)
	aside?: React.ReactNode;
	question: string;
	/// Change à chaque question : relance l'écriture à la craie
	questionKey: string | number;
	/// Série en cours : le cadre s'embrase
	onFire?: boolean;
	/// Cartes-réponses
	children: React.ReactNode;
	className?: string;
}

/// Tableau à craie : la question s'écrit mot par mot, les réponses sont
/// aimantées dessous.
const QuizBoard: React.FC<QuizBoardProps> = ({
	tag,
	aside,
	question,
	questionKey,
	onFire = false,
	children,
	className = "",
}) => {
	const reduceMotion = useReducedMotion();
	const words = question.split(/(\s+)/).filter(Boolean);

	return (
		<section className={`qz-board ${onFire ? "is-on-fire" : ""} ${className}`}>
			<div className="qz-board-slate">
				<div className="qz-board-head">
					<span className="qz-chalk-tag">{tag}</span>
					{aside}
				</div>

				<motion.h2
					key={`question-${questionKey}`}
					className="qz-question"
					aria-live="polite"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.035 } },
					}}
				>
					{words.map((word, i) => (
						<motion.span
							key={i}
							className="qz-question-word"
							variants={{
								hidden: { opacity: 0, y: reduceMotion ? 0 : 8, filter: "blur(3px)" },
								visible: { opacity: 1, y: 0, filter: "blur(0px)" },
							}}
							transition={{ duration: 0.28, ease: "easeOut" }}
						>
							{word}
						</motion.span>
					))}
					<svg className="qz-question-underline" viewBox="0 0 120 10" aria-hidden="true">
						<motion.path
							d="M2 6 C 20 2, 35 9, 55 5 S 95 2, 118 6"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							variants={{
								hidden: { pathLength: 0 },
								visible: { pathLength: 1 },
							}}
							transition={{ duration: 0.5, delay: reduceMotion ? 0 : Math.min(words.length * 0.035, 1) }}
						/>
					</svg>
				</motion.h2>

				{children}
			</div>

			<div className="qz-board-tray" aria-hidden="true">
				<span className="qz-chalk" />
				<span className="qz-chalk qz-chalk--pompon" />
				<span className="qz-eraser" />
				<span className="qz-chalk qz-chalk--orange" />
			</div>
		</section>
	);
};

export default QuizBoard;
