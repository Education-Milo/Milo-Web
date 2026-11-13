import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Swords } from "lucide-react";
import DuelMilo3D, { type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";

interface DuelArenaProps {
	firstName?: string;
	equippedMeshNames: string[];
	onlineCount: number;
	onStart: () => void;
}

/// Danses jouées quand on clique sur son Milo
const TAUNTS = ["67", "Hello", "HatLook"];

/**
 * L'arène : ton Milo en 3D (avec ta tenue) face à un adversaire mystère,
 * un grand « VS » qui claque à l'arrivée, et le bouton pour se lancer.
 * Cliquer sur Milo le fait danser, comme pour provoquer l'adversaire.
 */
const DuelArena: React.FC<DuelArenaProps> = ({ firstName, equippedMeshNames, onlineCount, onStart }) => {
	const reduceMotion = useReducedMotion();
	const [dance, setDance] = useState<DuelDance | null>(null);
	const seq = useRef(0);

	const taunt = () => {
		seq.current += 1;
		setDance({ clip: TAUNTS[seq.current % TAUNTS.length], seq: seq.current });
	};

	return (
		<section className="dz-arena" aria-labelledby="dz-arena-title">
			<span className="dz-arena__dots" aria-hidden="true" />
			<span className="dz-arena__floor" aria-hidden="true" />

			<div className="dz-arena__titles">
				<motion.h1
					id="dz-arena-title"
					className="dz-arena__title"
					initial={reduceMotion ? false : { y: -30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 160, damping: 14 }}
				>
					Prêt pour le <span className="dz-hl">duel</span> ?
				</motion.h1>
				<p className="dz-arena__lead">5 questions, un adversaire, et le plus rapide l'emporte.</p>
			</div>

			<div className="dz-arena__stage">
				{/* Toi */}
				<motion.div
					className="dz-fighter dz-fighter--me"
					initial={reduceMotion ? false : { x: -120, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 110, damping: 13, delay: 0.15 }}
				>
					<button type="button" className="dz-fighter__milo" onClick={taunt} aria-label="Faire danser ton Milo">
						<DuelMilo3D equippedMeshNames={equippedMeshNames} state="waiting" dance={dance} facing="right" />
					</button>
					<span className="dz-fighter__tag">{firstName || "Toi"}</span>
				</motion.div>

				{/* VS */}
				<div className="dz-versus">
					<motion.span
						className="dz-versus__text"
						aria-hidden="true"
						initial={reduceMotion ? false : { scale: 3.2, opacity: 0, rotate: -12 }}
						animate={{ scale: 1, opacity: 1, rotate: -6 }}
						transition={{ type: "spring", stiffness: 420, damping: 12, delay: 0.55 }}
					>
						VS
					</motion.span>
					<motion.span
						className="dz-versus__swords"
						aria-hidden="true"
						initial={reduceMotion ? false : { scale: 0, rotate: -90 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.75 }}
					>
						<Emoji3D name="crossed_swords" />
					</motion.span>
				</div>

				{/* Adversaire mystère */}
				<motion.div
					className="dz-fighter dz-fighter--foe"
					initial={reduceMotion ? false : { x: 120, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 110, damping: 13, delay: 0.3 }}
				>
					<motion.span
						className="dz-mystery"
						aria-hidden="true"
						whileHover={reduceMotion ? undefined : { rotate: [0, -10, 10, -6, 0], scale: 1.05 }}
						transition={{ duration: 0.6 }}
					>
						<img src="/duels/milo-chevalier.webp" alt="" className="dz-mystery__knight" draggable={false} />
						<span className="dz-mystery__mark">?</span>
					</motion.span>
					<span className="dz-fighter__tag">Adversaire mystère</span>
				</motion.div>
			</div>

			<motion.div
				className="dz-arena__cta"
				initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.9 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.95 }}
			>
				<button type="button" className="dz-btn dz-btn--cta" onClick={onStart}>
					<Swords size={24} strokeWidth={2.6} aria-hidden="true" />
					Lancer un duel
				</button>
				<p className="dz-arena__hint">
					{onlineCount > 0
						? `${onlineCount} ${onlineCount > 1 ? "amis sont" : "ami est"} en ligne. Ou défie-les directement plus bas.`
						: "Un adversaire de ton niveau, tiré au hasard."}
				</p>
			</motion.div>
		</section>
	);
};

export default DuelArena;
