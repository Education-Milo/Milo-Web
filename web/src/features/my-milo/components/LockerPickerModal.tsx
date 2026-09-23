import React, { useEffect } from "react";
import { CheckCircle2, Loader, X } from "lucide-react";
import type { Cosmetic } from "@features/cosmetics/store/cosmetics.model";
import { RARITY_LABELS, TYPE_LABELS, raritySlug } from "@features/cosmetics/store/cosmetics.model";
import { CosmeticVisual } from "@features/milo-shop/pages/MiloShop.page";

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

/** Popup de choix d'un objet pour un emplacement de la tenue ou de la roue. */
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
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div className="lk-overlay" onClick={onClose} role="presentation">
			<div
				className="lk-modal"
				role="dialog"
				aria-modal="true"
				aria-label={title}
				onClick={(e) => e.stopPropagation()}
			>
				<header className="lk-modal-header">
					<div className="lk-modal-icon">{icon}</div>
					<div className="lk-modal-titles">
						<h3>{title}</h3>
						{subtitle && <p>{subtitle}</p>}
					</div>
					<button type="button" className="lk-modal-close" onClick={onClose} aria-label="Fermer">
						<X size={18} />
					</button>
				</header>

				{items.length === 0 ? (
					<div className="lk-empty">
						<p>{emptyText}</p>
						<button type="button" className="btn-shop-pimped" onClick={onShop}>
							Voir la boutique
						</button>
					</div>
				) : (
					<div className="lk-item-grid">
						{items.map((item) => {
							const isCurrent = item.id === currentId;
							const isElsewhere = !isCurrent && Boolean(usedElsewhereIds?.has(item.id));
							return (
								<button
									key={item.id}
									type="button"
									className={`lk-item rarity-${raritySlug(item.rarity)} ${isCurrent ? "is-current" : ""} ${isElsewhere ? "is-elsewhere" : ""}`}
									onClick={() => !isCurrent && onPick(item)}
									disabled={busy || isCurrent}
									title={isCurrent ? "Déjà à cet emplacement" : isElsewhere ? "Sera déplacé ici" : `Équiper ${item.name}`}
								>
									<span className="lk-item-visual">
										<CosmeticVisual item={item} className="lk-item-img" />
									</span>
									<span className="lk-item-name">{item.name}</span>
									<span className="lk-item-meta">
										{TYPE_LABELS[item.type]} · {RARITY_LABELS[item.rarity] ?? item.rarity}
									</span>
									{isCurrent && (
										<span className="lk-item-badge">
											<CheckCircle2 size={12} /> Équipé
										</span>
									)}
									{isElsewhere && <span className="lk-item-badge lk-item-badge--soft">Dans la roue</span>}
								</button>
							);
						})}
					</div>
				)}

				<footer className="lk-modal-footer">
					{busy && <Loader size={16} className="lk-spin" />}
					<button
						type="button"
						className="lk-btn-unequip"
						onClick={onUnequip}
						disabled={busy || currentId === null}
					>
						<X size={14} /> Retirer de cet emplacement
					</button>
				</footer>
			</div>
		</div>
	);
};

export default LockerPickerModal;
