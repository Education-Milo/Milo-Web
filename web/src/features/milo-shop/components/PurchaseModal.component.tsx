import React, { useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
	TYPE_LABELS,
	raritySlug,
	type Cosmetic,
} from "@features/cosmetics/store/cosmetics.model";
import CosmeticVisual from "@features/milo-shop/components/CosmeticVisual.component";
import RarityTag from "@features/milo-shop/components/RarityTag.component";
import { formatMiloros } from "@features/milo-shop/utils/format";
import { useDialogFocus } from "@shared/hooks/useDialogFocus";

interface PurchaseModalProps {
	item: Cosmetic;
	balance: number;
	isPending: boolean;
	error: string | null;
	onConfirm: () => void;
	onClose: () => void;
}

/// Fenêtre de confirmation d'achat : récapitule le prix et le solde après
/// achat. Le bouton principal est bloqué quand le solde ne suffit pas.
const PurchaseModal: React.FC<PurchaseModalProps> = ({
	item,
	balance,
	isPending,
	error,
	onConfirm,
	onClose,
}) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const laterRef = useRef<HTMLButtonElement>(null);
	const canAfford = balance >= item.price;

	// Focus initial sur « Plus tard » (l'action sans conséquence : un Entrée
	// trop rapide ne dépense rien, WCAG 3.3.4), Tab piégé, Échap ferme et
	// le focus revient au bouton « Acheter » d'origine
	useDialogFocus({
		open: true,
		containerRef: modalRef,
		initialFocusRef: laterRef,
		onEscape: () => !isPending && onClose(),
	});

	return (
		<motion.div
			className="ms-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={() => !isPending && onClose()}
		>
			<motion.div
				ref={modalRef}
				className={`ms-modal ms-r-${raritySlug(item.rarity)}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="ms-modal-title"
				initial={{ y: 40, scale: 0.94, opacity: 0 }}
				animate={{ y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 22 } }}
				exit={{ y: 20, scale: 0.96, opacity: 0, transition: { duration: 0.15 } }}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					className="ms-modal__close"
					onClick={onClose}
					disabled={isPending}
					aria-label="Fermer"
				>
					<X size={20} strokeWidth={2.6} aria-hidden="true" />
				</button>

				<div className="ms-modal__stage">
					<motion.div
						animate={{ y: [0, -8, 0] }}
						transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
					>
						<CosmeticVisual item={item} className="ms-modal__visual" />
					</motion.div>
				</div>

				<RarityTag rarity={item.rarity} suffix={TYPE_LABELS[item.type] ?? item.type} className="ms-tag--pill" />
				<h2 id="ms-modal-title" className="ms-modal__title">{item.name}</h2>

				<dl className="ms-recap">
					<div>
						<dt>Prix</dt>
						<dd>
							<img src="/landing/emoji/coin.webp" alt="" className="ms-coin" />
							{formatMiloros(item.price)}
						</dd>
					</div>
					<div>
						<dt>Ton solde</dt>
						<dd>{formatMiloros(balance)}</dd>
					</div>
					<div className={canAfford ? "is-total" : "is-short"}>
						<dt>{canAfford ? "Après l'achat" : "Il te manque"}</dt>
						<dd>{formatMiloros(Math.abs(balance - item.price))}</dd>
					</div>
				</dl>

				{!canAfford && (
					<p className="ms-modal__tip">
						Termine tes missions du jour et gagne tes duels pour remplir ta tirelire !
					</p>
				)}

				{error && (
					<p className="ms-modal__error" role="alert">{error}</p>
				)}

				<div className="ms-modal__actions">
					<button
						ref={laterRef}
						type="button"
						className="ms-btn ms-btn--ghost"
						onClick={onClose}
						disabled={isPending}
					>
						Plus tard
					</button>
					<button
						type="button"
						className="ms-btn ms-btn--primary"
						onClick={onConfirm}
						disabled={isPending || !canAfford}
					>
						{isPending ? "Achat en cours…" : canAfford ? "Débloquer" : "Pas assez de miloros"}
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default PurchaseModal;
