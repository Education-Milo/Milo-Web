import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { emojiSrc, type BrandEmoji } from "@shared/components/quiz/quiz.assets";

interface RewardRainProps {
	emojis: BrandEmoji[];
	count?: number;
	delay?: number;
}

/// Pluie d'objets 3D (pièces, étoiles…) jouée une seule fois : chaque objet
/// tombe en tournant puis disparaît. Uniquement transform et opacity.
const RewardRain: React.FC<RewardRainProps> = ({ emojis, count = 16, delay = 0 }) => {
	const reduceMotion = useReducedMotion();
	const drops = useMemo(
		() =>
			Array.from({ length: count }, (_, i) => ({
				emoji: emojis[i % emojis.length],
				left: 4 + Math.random() * 92,
				size: 30 + Math.random() * 30,
				delay: delay + Math.random() * 0.9,
				duration: 1.6 + Math.random() * 1.1,
				spin: (Math.random() - 0.5) * 540,
				drift: (Math.random() - 0.5) * 120,
			})),
		[emojis, count, delay],
	);

	if (reduceMotion) return null;

	return (
		<div className="qz-rain" aria-hidden="true">
			{drops.map((drop, i) => (
				<motion.img
					key={i}
					src={emojiSrc(drop.emoji)}
					alt=""
					className="qz-rain-drop"
					style={{ left: `${drop.left}%`, width: drop.size, height: drop.size }}
					initial={{ y: "-15vh", x: 0, rotate: 0, opacity: 0 }}
					animate={{ y: "110vh", x: drop.drift, rotate: drop.spin, opacity: [0, 1, 1, 0] }}
					transition={{ duration: drop.duration, delay: drop.delay, ease: [0.45, 0, 0.75, 0.6], opacity: { duration: drop.duration, delay: drop.delay, times: [0, 0.1, 0.8, 1] } }}
				/>
			))}
		</div>
	);
};

export default RewardRain;
