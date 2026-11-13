import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ProgressRingProps {
	value: number;
	total: number;
	size?: number;
	stroke?: number;
	children?: React.ReactNode;
}

/** Anneau de progression qui se remplit à l'arrivée sur la page */
const ProgressRing: React.FC<ProgressRingProps> = ({ value, total, size = 220, stroke = 20, children }) => {
	const reduceMotion = useReducedMotion();
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const ratio = total > 0 ? Math.min(value / total, 1) : 0;

	return (
		<div className="mp-ring" style={{ width: size, height: size }}>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
				<defs>
					<linearGradient id="mp-ring-feu" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#F4922A" />
						<stop offset="55%" stopColor="#EF4F1A" />
						<stop offset="100%" stopColor="#ED3C1D" />
					</linearGradient>
				</defs>
				<circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F6EBDF" strokeWidth={stroke} />
				<motion.circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="url(#mp-ring-feu)"
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={circumference}
					initial={{ strokeDashoffset: reduceMotion ? circumference * (1 - ratio) : circumference }}
					animate={{ strokeDashoffset: circumference * (1 - ratio) }}
					transition={{ duration: 1.3, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</svg>
			<div className="mp-ring__center">{children}</div>
		</div>
	);
};

export default ProgressRing;
