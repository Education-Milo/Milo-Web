import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Music2, Plus } from "lucide-react";
import { TYPE_LABELS, raritySlug, type Cosmetic } from "@features/cosmetics/store/cosmetics.model";
import CosmeticVisual from "@features/milo-shop/components/CosmeticVisual.component";

/// Roue des duels dessinée comme une vraie roue : six parts, une par
/// emplacement, numérotées dans le sens des aiguilles d'une montre depuis le
/// haut. C'est la même disposition que la roue d'émotes ouverte en duel.

/// Rayon (en % de la roue) où se posent les pastilles des emplacements
const SLOT_RADIUS = 33.5;
/// Ampoules décoratives sur la jante
const BULB_COUNT = 18;
const BULB_RADIUS = 46.6;

const polar = (deg: number, radius: number) => {
	const rad = (deg * Math.PI) / 180;
	return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
};

/// Part de roue : triangle depuis le centre, assez grand pour déborder du
/// cercle (le parent arrondi et `overflow: hidden` dessinent l'arc)
const wedgeClip = (center: number, span: number) => {
	const a = polar(center - span / 2, 80);
	const m = polar(center, 80);
	const b = polar(center + span / 2, 80);
	return `polygon(50% 50%, ${a.x}% ${a.y}%, ${m.x}% ${m.y}%, ${b.x}% ${b.y}%)`;
};

interface DuelWheelProps {
	slots: (Cosmetic | null)[];
	used: number;
	size: number;
	disabled: boolean;
	onOpenSlot: (slot: number) => void;
}

const DuelWheel: React.FC<DuelWheelProps> = ({ slots, used, size, disabled, onOpenSlot }) => {
	const calm = useReducedMotion() ?? false;
	/// Emplacement survolé ou focalisé : son détail s'affiche au moyeu
	const [focused, setFocused] = useState<number | null>(null);
	const span = 360 / slots.length;
	const focusedItem = focused === null ? null : slots[focused];

	return (
		<motion.div
			className={`mm-wheel${focused !== null ? " has-focus" : ""}`}
			initial={calm ? false : { rotate: -150, scale: 0.7, opacity: 0 }}
			animate={{ rotate: 0, scale: 1, opacity: 1 }}
			transition={{ type: "spring", stiffness: 55, damping: 13, delay: 0.35 }}
		>
			<div className="mm-wheel__rim" aria-hidden="true">
				{Array.from({ length: BULB_COUNT }, (_, i) => {
					const p = polar((360 / BULB_COUNT) * i - 90, BULB_RADIUS);
					return <i key={i} style={{ left: `${p.x}%`, top: `${p.y}%` }} />;
				})}
			</div>

			<div className="mm-wheel__face" aria-hidden="true">
				{slots.map((item, i) => (
					<span
						key={i}
						className={`mm-wheel__wedge${item ? ` is-filled ms-r-${raritySlug(item.rarity)}` : ""}${i % 2 ? " is-alt" : ""}${focused === i ? " is-focus" : ""}`}
						style={{ clipPath: wedgeClip(-90 + span * i, span) }}
					/>
				))}
			</div>

			{slots.map((item, slot) => {
				const p = polar(-90 + span * slot, SLOT_RADIUS);
				const label = item
					? `Emplacement ${slot + 1} : ${item.name} (${TYPE_LABELS[item.type]})`
					: `Emplacement ${slot + 1} : libre, ajoute un sticker ou une danse`;
				return (
					<button
						key={slot}
						type="button"
						className={`mm-wslot ${item ? `is-filled ms-r-${raritySlug(item.rarity)}` : "is-empty"}`}
						style={{ left: `${p.x}%`, top: `${p.y}%` }}
						onClick={() => onOpenSlot(slot)}
						onPointerEnter={() => setFocused(slot)}
						onPointerLeave={() => setFocused((f) => (f === slot ? null : f))}
						onFocus={() => setFocused(slot)}
						onBlur={() => setFocused((f) => (f === slot ? null : f))}
						disabled={disabled}
						aria-label={label}
						title={item ? `Emplacement ${slot + 1} : ${item.name}` : `Emplacement ${slot + 1} : vide`}
					>
						<motion.span
							key={item?.id ?? "empty"}
							className="mm-wslot__disc"
							initial={calm ? false : { scale: 0.4, rotate: -25 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ type: "spring", stiffness: 380, damping: 15 }}
						>
							{item ? <CosmeticVisual item={item} className="mm-wslot__img" /> : <Plus size={22} strokeWidth={2.6} />}
						</motion.span>
						{item && <span key={`burst-${item.id}`} className="mm-burst" aria-hidden="true" />}
						<span className="mm-wslot__num" aria-hidden="true">{slot + 1}</span>
						{item?.type === "dance" && (
							<span className="mm-wslot__kind" aria-hidden="true">
								<Music2 size={12} strokeWidth={2.8} />
							</span>
						)}
					</button>
				);
			})}

			<div className="mm-wheel__hub" aria-hidden="true">
				{focused === null ? (
					<>
						<img src="/landing/emoji/crossed_swords.webp" alt="" className="mm-wheel__hub-icon" draggable={false} />
						<span className="mm-wheel__hub-count">
							{used}<small>/{size}</small>
						</span>
					</>
				) : (
					<>
						<span className="mm-wheel__hub-slot">Case {focused + 1}</span>
						<span className="mm-wheel__hub-name">{focusedItem ? focusedItem.name : "Libre"}</span>
						<span className="mm-wheel__hub-kind">
							{focusedItem ? (focusedItem.type === "dance" ? "Danse" : "Sticker") : "Ajouter"}
						</span>
					</>
				)}
			</div>
		</motion.div>
	);
};

export default DuelWheel;
