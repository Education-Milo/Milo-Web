import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Swords } from "lucide-react";
import DuelMilo3D, { type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { rankImage, type DuelRank } from "@features/duels/components/lobby/duelRanks";

interface DuelArenaProps {
	firstName?: string;
	rank: DuelRank;
	equippedMeshNames: string[];
	onlineCount: number;
	onStart: () => void;
}

/// Fanions de la guirlande, dans la palette de la charte (crème, sable, blanc, braise)
const PENNANTS = ["#FFFBF6", "#F1D2B2", "#C73A0C", "#FFFFFF", "#F6EBDF", "#C73A0C", "#FFFBF6", "#F1D2B2", "#C73A0C", "#FFFFFF", "#F6EBDF", "#C73A0C"];

/// Objets 3D qui flottent autour de la scène
const FLOATERS: { name: Emoji3DName; className: string; delay: number }[] = [
	{ name: "trophy", className: "dz-float--1", delay: 0 },
	{ name: "coin", className: "dz-float--2", delay: 0.8 },
	{ name: "glowing_star", className: "dz-float--3", delay: 1.6 },
	{ name: "high_voltage", className: "dz-float--4", delay: 0.4 },
	{ name: "gem_stone", className: "dz-float--5", delay: 1.2 },
];

/**
 * L'arène, façon écran de sélection de jeu de combat, dans la charte :
 * aplat feu à pois, soleil, guirlande de fanions, objets 3D qui flottent.
 * Ta carte (ton Milo en 3D, ton logo de rang à côté de ton prénom) fait
 * face à l'adversaire mystère. Cliquer sur ton Milo le fait danser.
 */
/// Danses jouées quand on clique sur son Milo
const TAUNTS = ["67", "Hello", "HatLook"];

const DuelArena: React.FC<DuelArenaProps> = ({ firstName, rank, equippedMeshNames, onlineCount, onStart }) => {
	const reduceMotion = useReducedMotion();
	const [dance, setDance] = useState<DuelDance | null>(null);
	const seq = useRef(0);

	const taunt = () => {
		seq.current += 1;
		setDance({ clip: TAUNTS[seq.current % TAUNTS.length], seq: seq.current });
	};
	const enter = (from: number, delay: number) =>
		reduceMotion
			? {}
			: {
					initial: { x: from, opacity: 0, rotate: from < 0 ? -8 : 8 },
					animate: { x: 0, opacity: 1, rotate: from < 0 ? -2 : 2 },
					transition: { type: "spring" as const, stiffness: 120, damping: 12, delay },
				};

	return (
		<section className="dz-arena" aria-labelledby="dz-arena-title">
			<span className="dz-arena__dots" aria-hidden="true" />

			{/* Guirlande de fanions */}
			<ul className="dz-pennants" aria-hidden="true">
				{PENNANTS.map((color, i) => (
					<motion.li
						key={i}
						style={{ background: color }}
						initial={reduceMotion ? false : { y: -40, rotate: -20 }}
						animate={{ y: 0, rotate: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 9, delay: 0.05 * i }}
					/>
				))}
			</ul>

			{/* Objets 3D flottants */}
			{FLOATERS.map((f) => (
				<motion.span
					key={f.name}
					className={`dz-float ${f.className}`}
					aria-hidden="true"
					initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
					animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -10, 0] }}
					transition={
						reduceMotion
							? undefined
							: {
									opacity: { delay: 0.6 + f.delay * 0.3 },
									scale: { type: "spring", stiffness: 260, damping: 12, delay: 0.6 + f.delay * 0.3 },
									y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: f.delay },
								}
					}
				>
					<Emoji3D name={f.name} />
				</motion.span>
			))}

			<div className="dz-arena__titles">
				<motion.h1
					id="dz-arena-title"
					className="dz-arena__title"
					initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.1 }}
				>
					Prêt pour le <span className="dz-hl">duel</span> ?
				</motion.h1>
				<p className="dz-arena__lead">5 questions, un adversaire, et le plus rapide l'emporte.</p>
			</div>

			<div className="dz-arena__stage">
				{/* Ta carte : ton Milo en 3D, ton logo de rang à côté de ton prénom */}
				<motion.div className="dz-card dz-card--me" {...enter(-160, 0.2)}>
					<span className="dz-card__tag">Toi</span>
					<button type="button" className="dz-card__art" onClick={taunt} aria-label="Faire danser ton Milo">
						<span className="dz-card__sun" aria-hidden="true" />
						{/* Milo chevalier en attendant la 3D (ou si elle ne se charge pas) */}
						<img src="/duels/milo-chevalier.webp" alt="" className="dz-card__fallback" draggable={false} />
						<DuelMilo3D equippedMeshNames={equippedMeshNames} state="waiting" dance={dance} facing="right" />
					</button>
					<span className="dz-card__plate">
						<span className="dz-card__name">{firstName || "Toi"}</span>
						<img src={rankImage(rank)} alt={`Rang ${rank.name}`} title={`Rang ${rank.name}`} className="dz-card__logo" draggable={false} />
					</span>
				</motion.div>

				{/* Médaillon VS */}
				<div className="dz-versus">
					<motion.span
						className="dz-versus__medal"
						aria-hidden="true"
						initial={reduceMotion ? false : { scale: 3.4, opacity: 0, rotate: -40 }}
						animate={{ scale: 1, opacity: 1, rotate: -8 }}
						transition={{ type: "spring", stiffness: 380, damping: 11, delay: 0.6 }}
					>
						VS
					</motion.span>
					<motion.span
						className="dz-versus__swords"
						aria-hidden="true"
						initial={reduceMotion ? false : { scale: 0, rotate: -160 }}
						animate={{ scale: 1, rotate: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 9, delay: 0.85 }}
					>
						<Emoji3D name="crossed_swords" />
					</motion.span>
				</div>

				{/* Carte de l'adversaire mystère : rang caché */}
				<motion.div className="dz-card dz-card--foe" {...enter(160, 0.35)}>
					<span className="dz-card__tag">Adversaire</span>
					<motion.span
						className="dz-card__art dz-card__art--mystery"
						aria-hidden="true"
						whileHover={reduceMotion ? undefined : { rotate: [0, -6, 6, -3, 0] }}
						transition={{ duration: 0.6 }}
					>
						<span className="dz-mystery__mark">?</span>
					</motion.span>
					<span className="dz-card__plate">
						<span className="dz-card__name">Mystère</span>
						<span className="dz-card__logo dz-card__logo--mystery" aria-label="Rang inconnu">?</span>
					</span>
				</motion.div>
			</div>

			<span className="dz-arena__floor" aria-hidden="true" />

			<motion.div
				className="dz-arena__cta"
				initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.85 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ type: "spring", stiffness: 240, damping: 13, delay: 1 }}
			>
				<button type="button" className="dz-btn dz-btn--cta" onClick={onStart}>
					<Swords size={26} strokeWidth={2.6} aria-hidden="true" />
					Lancer un duel
				</button>
				<p className="dz-arena__hint">
					{onlineCount > 0
						? `${onlineCount} ${onlineCount > 1 ? "amis sont" : "ami est"} en ligne : défie-les juste en dessous.`
						: "Personne en ligne ? On te trouve un adversaire."}
				</p>
			</motion.div>
		</section>
	);
};

export default DuelArena;
