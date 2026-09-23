import React, { useEffect, useRef, useState } from "react";
import { Smile, X } from "lucide-react";
import type { DuelCosmetic } from "@shared/types/duels";
import { useUserStore } from "@shared/store/user/user.store";
import { arrangeWheel } from "@features/cosmetics/utils/wheelSlots";

/// Le serveur accepte une émote par seconde : on réarme le bouton après ce délai
const COOLDOWN_MS = 1000;

interface EmoteWheelProps {
	/// Objets de la roue équipée (tableau `wheel` du message `start`)
	items: DuelCosmetic[];
	/// Vrai pendant une réaction ou une danse : aucune émote possible
	busy: boolean;
	onPick: (cosmeticId: number) => void;
}

const EmoteWheel: React.FC<EmoteWheelProps> = ({ items, busy, onPick }) => {
	const [open, setOpen] = useState(false);
	const [cooling, setCooling] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => () => {
		if (timerRef.current) clearTimeout(timerRef.current);
	}, []);

	useEffect(() => {
		if (busy) setOpen(false);
	}, [busy]);

	const userId = useUserStore((state) => state.user?.id);
	const disabled = busy || cooling || items.length === 0;
	// Même disposition que dans le casier "Mon Milo"
	const slots = arrangeWheel(items, userId);

	const handlePick = (id: number) => {
		if (disabled) return;
		onPick(id);
		setOpen(false);
		setCooling(true);
		timerRef.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
	};

	return (
		<div className="duel-emote">
			{open && (
				<div className="duel-emote-wheel" role="menu" aria-label="Choisir une émote">
					{slots.map((item, i) => {
						if (!item) {
							return <span key={`empty-${i}`} className="duel-emote-slot is-empty" aria-hidden="true" />;
						}
						return (
							<button
								key={item.id}
								type="button"
								role="menuitem"
								className={`duel-emote-slot duel-emote-slot--${item.type}`}
								title={item.name}
								onClick={() => handlePick(item.id)}
							>
								{item.image_url ? (
									<img src={item.image_url} alt={item.name} draggable={false} />
								) : (
									<span aria-hidden="true">{item.type === "dance" ? "💃" : "🌟"}</span>
								)}
							</button>
						);
					})}
				</div>
			)}
			<button
				type="button"
				className={`duel-emote-btn ${open ? "is-open" : ""}`}
				onClick={() => setOpen((v) => !v)}
				disabled={disabled}
				title={
					items.length === 0
						? "Équipe des stickers ou des danses dans ton casier"
						: busy
							? "Attends la fin de l'animation"
							: cooling
								? "Une émote par seconde"
								: "Envoyer une émote"
				}
			>
				{open ? <X size={18} /> : <Smile size={18} />}
				<span>Émote</span>
			</button>
		</div>
	);
};

export default EmoteWheel;
