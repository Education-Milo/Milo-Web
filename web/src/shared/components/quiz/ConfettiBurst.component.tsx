import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/// Palette de la charte : orange Milo, nuances du dégradé feu, sable, crème
const COLORS = [
	"var(--milo-orange)",
	"var(--qz-mandarine)",
	"var(--qz-vermillon)",
	"var(--qz-sable)",
	"var(--qz-creme)",
	"var(--milo-pompon)",
	"#ffffff",
];

interface ConfettiBurstProps {
	/// Nombre de confettis
	count?: number;
	/// Point de départ, en % du conteneur (ou de l'écran si `fixed`)
	originX?: number;
	originY?: number;
	/// Distance maximale parcourue, en px
	spread?: number;
	/// Pluie sur tout l'écran plutôt qu'une gerbe dans le conteneur
	fixed?: boolean;
	/// Attente avant le départ, en secondes
	delay?: number;
}

interface Piece {
	dx: number;
	dy: number;
	fall: number;
	rotate: number;
	size: number;
	ratio: number;
	color: string;
	delay: number;
	duration: number;
	round: boolean;
}

/// Gerbe de confettis jouée une seule fois au montage : changer la `key`
/// du composant pour la relancer.
const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
	count = 26,
	originX = 50,
	originY = 50,
	spread = 160,
	fixed = false,
	delay = 0,
}) => {
	const reduceMotion = useReducedMotion();

	const pieces = useMemo<Piece[]>(
		() =>
			Array.from({ length: count }, () => {
				const angle = Math.random() * Math.PI * 2;
				const distance = spread * (0.45 + Math.random() * 0.55);
				return {
					dx: Math.cos(angle) * distance,
					dy: Math.sin(angle) * distance * 0.8 - spread * 0.35,
					fall: spread * (0.5 + Math.random() * 0.6),
					rotate: (Math.random() - 0.5) * 720,
					size: 7 + Math.random() * 7,
					ratio: Math.random() > 0.5 ? 0.45 : 1,
					color: COLORS[Math.floor(Math.random() * COLORS.length)],
					delay: delay + Math.random() * 0.08,
					duration: 0.95 + Math.random() * 0.6,
					round: Math.random() > 0.7,
				};
			}),
		[count, spread, delay],
	);

	if (reduceMotion) return null;

	return (
		<div
			className={`qz-confetti ${fixed ? "qz-confetti--fixed" : ""}`}
			aria-hidden="true"
		>
			{pieces.map((piece, i) => (
				<motion.span
					key={i}
					className="qz-confetti-piece"
					style={{
						left: `${originX}%`,
						top: `${originY}%`,
						width: piece.size,
						height: piece.size * piece.ratio,
						background: piece.color,
						borderRadius: piece.round ? "50%" : 2,
					}}
					initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
					animate={{
						x: piece.dx,
						y: [0, piece.dy, piece.dy + piece.fall],
						opacity: [1, 1, 0],
						rotate: piece.rotate,
						scale: 1,
					}}
					transition={{
						duration: piece.duration,
						delay: piece.delay,
						ease: "easeOut",
						y: { duration: piece.duration, delay: piece.delay, times: [0, 0.45, 1], ease: ["easeOut", "easeIn"] },
						opacity: { duration: piece.duration, delay: piece.delay, times: [0, 0.7, 1] },
					}}
				/>
			))}
		</div>
	);
};

export default ConfettiBurst;
