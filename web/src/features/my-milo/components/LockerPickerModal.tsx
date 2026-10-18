import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader, ShoppingBag, Undo2, X } from "lucide-react";
import type { Cosmetic } from "@features/cosmetics/store/cosmetics.model";
import { TYPE_LABELS, raritySlug } from "@features/cosmetics/store/cosmetics.model";
import CosmeticVisual from "@features/milo-shop/components/CosmeticVisual.component";
import RarityTag from "@features/milo-shop/components/RarityTag.component";

interface LockerPickerModalProps {
	title: string;
	subtitle?: string;
	icon: React.ReactNode;
	/** Objets possédés proposés pour cet emplacement */
	items: Cosmetic[];
	/** Objet actuellement à cet emplacement */
	currentId: number | null;
	/** Objets déjà utilisés ailleurs (autres emplacements de la roue) */
	usedElsewhereIds?: Set<number>;
	busy: boolean;
	emptyText: string;
	onPick: (item: Cosmetic) => void;
	onUnequip: () => void;
	onClose: () => void;
	onShop: () => void;
}

const gridVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } },
};

const itemVariants = {
	hidden: { y: 18, opacity: 0, scale: 0.96 },
	visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
} as const;

/**
 * Tiroir de choix d'un objet pour un emplacement de la tenue ou de la roue.
 * Il glisse depuis la droite (depuis le bas sur mobile) et laisse Milo
 * visible : on le voit réagir dès que le tiroir se referme.
 */
const LockerPickerModal: React.FC<LockerPickerModalProps> = ({
	title,
	subtitle,
	icon,
	items,
	currentId,
	usedElsewhereIds,
	busy,
	emptyText,
	onPick,
	onUnequip,
	onClose,
	onShop,
}) => {
	const panelRef = useRef<HTMLDivElement>(null);
	/// Sur petit écran le tiroir monte du bas, ailleurs il glisse de la droite
	const [offscreen] = useState(() =>
		typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
			? { x: 0, y: "100%" }
			: { x: "100%", y: 0 },
	);
	const current = items.find((item) => item.id === currentId) ?? null;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	/// Le focus clavier entre dans le tiroir à l'ouverture
	useEffect(() => {
		panelRef.current?.focus({ preventScroll: true });
	}, []);

	return (
		<motion.div
			className="mm-sheet-overlay"
			onClick={onClose}
			role="presentation"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0.2 } }}
		>
			<motion.div
				ref={panelRef}
				className="mm-sheet"
				role="dialog"
				aria-modal="true"
				aria-label={title}
				tabIndex={-1}
				onClick={(e) => e.stopPropagation()}
				initial={offscreen}
				animate={{ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 32 } }}
				exit={{ ...offscreen, transition: { duration: 0.22, ease: "easeIn" } }}
			>
				<span className="mm-sheet__grip" aria-hidden="true" />

				<header className="mm-sheet__head">
					<div className="mm-sheet__icon" aria-hidden="true">{icon}</div>
					<div className="mm-sheet__titles">
						<h3 className="mm-sheet__title">{title}</h3>
						{subtitle && <p className="mm-sheet__subtitle">{subtitle}</p>}
					</div>
					<button type="button" className="mm-sheet__close" onClick={onClose} aria-label="Fermer">
						<X size={20} strokeWidth={2.6} />
					</button>
				</header>

				{/* Ce qui occupe l'emplacement, et de quoi le libérer */}
				<div className={`mm-sheet__current${current ? ` ms-r-${raritySlug(current.rarity)}` : " is-empty"}`}>
					<span className="mm-sheet__current-visual">
						{current ? <CosmeticVisual item={current} className="mm-sheet__current-img" /> : <span className="mm-sheet__current-none" />}
					</span>
					<span className="mm-sheet__current-text">
						<span className="mm-sheet__current-label">{current ? "En ce moment" : "Emplacement libre"}</span>
						<span className="mm-sheet__current-name">{current ? current.name : "Rien pour l'instant"}</span>
					</span>
					{busy && <Loader size={18} className="mm-spin" aria-label="Enregistrement" />}
					<button
						type="button"
						className="mm-btn mm-btn--ghost mm-btn--xs"
						onClick={onUnequip}
						disabled={busy || currentId === null}
					>
						<Undo2 size={15} strokeWidth={2.6} aria-hidden="true" /> Retirer
					</button>
				</div>

				{items.length === 0 ? (
					<div className="mm-sheet__empty">
						<img src="/landing/emoji/card_index_dividers.webp" alt="" className="mm-sheet__empty-icon" draggable={false} />
						<p>{emptyText}</p>
						<button type="button" className="mm-btn mm-btn--primary" onClick={onShop}>
							<ShoppingBag size={18} aria-hidden="true" /> Voir la boutique
						</button>
					</div>
				) : (
					<motion.div className="mm-sheet__grid" variants={gridVariants} initial="hidden" animate="visible">
						{items.map((item) => {
							const isCurrent = item.id === currentId;
							const isElsewhere = !isCurrent && Boolean(usedElsewhereIds?.has(item.id));
							return (
								<motion.button
									key={item.id}
									variants={itemVariants}
									type="button"
									className={`mm-pick ms-r-${raritySlug(item.rarity)}${isCurrent ? " is-current" : ""}${isElsewhere ? " is-elsewhere" : ""}`}
									onClick={() => !isCurrent && onPick(item)}
									disabled={busy || isCurrent}
									title={isCurrent ? "Déjà à cet emplacement" : isElsewhere ? "Sera déplacé ici" : `Équiper ${item.name}`}
								>
									<span className="mm-pick__stage">
										<CosmeticVisual item={item} className="mm-pick__img" />
										<RarityTag rarity={item.rarity} className="ms-tag--band" />
									</span>
									<span className="mm-pick__name">{item.name}</span>
									{item.type === "sticker" || item.type === "dance" ? (
										<span className="mm-pick__meta">{TYPE_LABELS[item.type]}</span>
									) : null}
									{isCurrent && (
										<span className="mm-pick__badge">
											<Check size={13} strokeWidth={3} aria-hidden="true" /> Porté
										</span>
									)}
									{isElsewhere && <span className="mm-pick__badge mm-pick__badge--soft">Dans la roue</span>}
								</motion.button>
							);
						})}
					</motion.div>
				)}

				<footer className="mm-sheet__foot">
					<span>Envie d'autre chose ?</span>
					<button type="button" className="mm-link" onClick={onShop}>
						<ShoppingBag size={16} aria-hidden="true" /> Aller à la boutique
					</button>
				</footer>
			</motion.div>
		</motion.div>
	);
};

export default LockerPickerModal;
