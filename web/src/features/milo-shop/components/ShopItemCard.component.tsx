import React from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import {
	TYPE_LABELS,
	raritySlug,
	type Cosmetic,
} from "@features/cosmetics/store/cosmetics.model";
import CosmeticVisual from "@features/milo-shop/components/CosmeticVisual.component";
import RarityTag from "@features/milo-shop/components/RarityTag.component";
import DancePreview3D from "@features/milo-shop/components/DancePreview3D.component";
import { formatMiloros } from "@features/milo-shop/utils/format";

interface ShopItemCardProps {
	item: Cosmetic;
	balance: number;
	/// Aperçu 3D affiché : une seule case à la fois, décidé par la page
	isDancing: boolean;
	onPreviewStart: (id: number) => void;
	onPreviewStop: (id: number) => void;
	onBuy: (item: Cosmetic) => void;
}

const cardVariants = {
	hidden: { y: 24, opacity: 0 },
	visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 140, damping: 18 } },
} as const;

const ShopItemCard: React.FC<ShopItemCardProps> = ({
	item,
	balance,
	isDancing,
	onPreviewStart,
	onPreviewStop,
	onBuy,
}) => {
	const danceClip = item.type === "dance" ? item.mesh_name : null;
	const missing = item.price - balance;
	const canAfford = missing <= 0;

	return (
		<motion.article
			layout
			variants={cardVariants}
			exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
			className={`ms-card ms-r-${raritySlug(item.rarity)}${item.owned ? " is-owned" : ""}`}
			onMouseEnter={danceClip ? () => onPreviewStart(item.id) : undefined}
			onMouseLeave={danceClip ? () => onPreviewStop(item.id) : undefined}
		>
			<div className="ms-card__stage">
				{item.owned && (
					<span className="ms-owned-tag">
						<Check size={14} strokeWidth={3} aria-hidden="true" />
						{item.is_equipped ? "Porté" : "À toi"}
					</span>
				)}
				{/* Le visuel reste sous l'aperçu 3D : il sert de repli le temps
				    que le modèle charge, et si le clip est introuvable */}
				<CosmeticVisual item={item} className="ms-card__visual" />
				{isDancing && danceClip && <DancePreview3D clip={danceClip} />}
				{danceClip && !isDancing && <span className="ms-card__hint">Survole pour le voir danser</span>}
				<RarityTag rarity={item.rarity} className="ms-tag--band" />
			</div>

			<div className="ms-card__body">
				<span className="ms-card__type">{TYPE_LABELS[item.type] ?? item.type}</span>
				<h3 className="ms-card__name">{item.name}</h3>
			</div>

			<div className="ms-card__foot">
				{item.owned ? (
					<span className="ms-card__done">
						<Check size={16} strokeWidth={3} aria-hidden="true" />
						Dans ton casier
					</span>
				) : (
					<>
						<span className="ms-price">
							<img src="/landing/emoji/coin.webp" alt="" className="ms-coin" draggable={false} />
							{formatMiloros(item.price)}
						</span>
						<button
							type="button"
							className={`ms-btn ms-btn--sm ${canAfford ? "ms-btn--primary" : "ms-btn--muted"}`}
							onClick={() => onBuy(item)}
							aria-label={`Acheter ${item.name} pour ${formatMiloros(item.price)} miloros`}
						>
							{canAfford ? (
								"Acheter"
							) : (
								<>
									<Lock size={14} strokeWidth={2.6} aria-hidden="true" />
									Il manque {formatMiloros(missing)}
								</>
							)}
						</button>
					</>
				)}
			</div>
		</motion.article>
	);
};

export default ShopItemCard;
