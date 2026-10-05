import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";

export type AnswerCardState = "idle" | "selected" | "correct" | "wrong" | "dim";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface AnswerCardProps {
	index: number;
	text: string;
	state: AnswerCardState;
	disabled: boolean;
	onSelect: () => void;
	/// Gerbe de confettis : bonne réponse choisie par le joueur
	celebrate?: boolean;
	/// Joueurs ayant choisi cette réponse (duels)
	pickers?: { label: string; kind: "me" | "opp" }[];
}

const stateAnimation = (state: AnswerCardState, reduceMotion: boolean) => {
	if (reduceMotion) return { x: 0, scale: 1 };
	if (state === "wrong") return { x: [0, -10, 9, -6, 4, -2, 0], scale: 1 };
	if (state === "correct") return { x: 0, scale: [1, 1.07, 0.98, 1.02, 1] };
	if (state === "dim") return { x: 0, scale: 0.97 };
	return { x: 0, scale: 1 };
};

/// Carte-réponse aimantée au tableau : lettre colorée, tranche 3D, et
/// réaction (secousse, rebond, confettis) selon le résultat.
const AnswerCard: React.FC<AnswerCardProps> = ({
	index,
	text,
	state,
	disabled,
	onSelect,
	celebrate = false,
	pickers = [],
}) => {
	const reduceMotion = Boolean(useReducedMotion());
	const interactive = !disabled;
	const letter = LETTERS[index] ?? String(index + 1);

	return (
		<motion.button
			type="button"
			className={`qz-answer is-${state}`}
			onClick={onSelect}
			disabled={disabled}
			aria-label={`Réponse ${letter} : ${text}`}
			aria-pressed={state === "selected" || undefined}
			initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, ...stateAnimation(state, reduceMotion) }}
			transition={{
				opacity: { duration: 0.25, delay: 0.25 + index * 0.07 },
				y: { type: "spring", stiffness: 420, damping: 22, delay: 0.25 + index * 0.07 },
				x: { duration: 0.45 },
				scale: { duration: state === "correct" ? 0.55 : 0.25 },
			}}
			whileHover={interactive && !reduceMotion ? { y: -5, scale: 1.02, rotate: 0 } : undefined}
			whileTap={interactive && !reduceMotion ? { y: 4, scale: 0.98 } : undefined}
		>
			<span className="qz-answer-letter" aria-hidden="true">{letter}</span>
			<span className="qz-answer-text">{text}</span>

			{state === "correct" || state === "wrong" ? (
				<motion.span
					className="qz-answer-mark"
					initial={reduceMotion ? false : { scale: 0, rotate: -90 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: "spring", stiffness: 500, damping: 18 }}
					aria-hidden="true"
				>
					{state === "correct" ? <Check size={20} strokeWidth={3.5} /> : <X size={20} strokeWidth={3.5} />}
				</motion.span>
			) : (
				interactive && <span className="qz-answer-key" aria-hidden="true">{index + 1}</span>
			)}

			{pickers.length > 0 && (
				<span className="qz-answer-pickers">
					{pickers.map((picker, i) => (
						<motion.span
							key={picker.kind}
							className={`qz-picker qz-picker--${picker.kind}`}
							initial={reduceMotion ? false : { scale: 0, y: 8 }}
							animate={{ scale: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 520, damping: 20, delay: 0.15 + i * 0.12 }}
						>
							{picker.label}
						</motion.span>
					))}
				</span>
			)}

			{celebrate && <ConfettiBurst count={22} spread={130} originX={10} originY={50} />}
		</motion.button>
	);
};

export default AnswerCard;
