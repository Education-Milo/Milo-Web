import React, { useEffect } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { streakTier } from "@shared/components/quiz/streak.utils";
import { emojiSrc } from "@shared/components/quiz/quiz.assets";
import "@shared/styles/Quiz.css";

interface StreakFlameProps {
	streak: number;
	/// Affiche « série » à côté du nombre
	showLabel?: boolean;
	/// Petite taille (tableau des scores du duel)
	compact?: boolean;
	className?: string;
}

/// Puce de série (charte : puce blanche à tranche sable, icône 3D). Elle
/// passe au dégradé feu à partir de 5. Seule animation : un saut ponctuel
/// de la flamme à chaque bonne réponse.
const StreakFlame: React.FC<StreakFlameProps> = ({ streak, showLabel = true, compact = false, className = "" }) => {
	const reduceMotion = useReducedMotion();
	const tier = streakTier(streak);
	const [scope, animate] = useAnimate<HTMLDivElement>();

	/// Chaque bonne réponse : la puce rebondit et la flamme s'emballe
	useEffect(() => {
		if (reduceMotion || streak === 0 || !scope.current) return;
		animate(
			".qz-streak-emoji",
			{ y: [0, -8, 0], scale: [1, 1.25, 1], rotate: [0, -10, 0] },
			{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
		);
	}, [streak, reduceMotion, animate, scope]);

	return (
		<div
			ref={scope}
			className={`qz-streak ${compact ? "qz-streak--compact" : ""} ${className}`}
			data-tier={tier}
			aria-label={`Série : ${streak} bonne${streak > 1 ? "s" : ""} réponse${streak > 1 ? "s" : ""} d'affilée`}
		>
			<img src={emojiSrc("fire")} alt="" className="qz-streak-emoji" draggable={false} />
			<span className="qz-streak-body">
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={streak}
						className="qz-streak-count"
						initial={reduceMotion ? false : { y: 18, opacity: 0, scale: 1.7 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={reduceMotion ? undefined : { y: -18, opacity: 0 }}
						transition={{ type: "spring", stiffness: 520, damping: 20 }}
					>
						{streak}
					</motion.span>
				</AnimatePresence>
				{showLabel && <span className="qz-streak-label">série</span>}
			</span>
		</div>
	);
};

export default StreakFlame;
