import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import "@shared/styles/Quiz.css";

export type RoundState = "correct" | "wrong" | "current" | "pending";

interface RoundTrackProps {
	rounds: RoundState[];
	compact?: boolean;
	label?: string;
	className?: string;
}

/// Une pastille par question : verte si réussie, rouge si ratée, la
/// question en cours pulse.
const RoundTrack: React.FC<RoundTrackProps> = ({ rounds, compact = false, label, className = "" }) => {
	const reduceMotion = useReducedMotion();
	const iconSize = compact ? 12 : 15;

	return (
		<ol
			className={`qz-track ${compact ? "qz-track--compact" : ""} ${className}`}
			aria-label={label ?? "Progression"}
		>
			{rounds.map((state, i) => (
				<motion.li
					key={`${i}-${state}`}
					className={`qz-pip is-${state}`}
					aria-label={`Question ${i + 1} : ${
						state === "correct" ? "réussie" : state === "wrong" ? "ratée" : state === "current" ? "en cours" : "à venir"
					}`}
					initial={reduceMotion || state === "pending" ? false : { scale: 0.3 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 600, damping: 15 }}
				>
					{state === "correct" && <Check size={iconSize} strokeWidth={4} />}
					{state === "wrong" && <X size={iconSize} strokeWidth={4} />}
				</motion.li>
			))}
		</ol>
	);
};

export default RoundTrack;
