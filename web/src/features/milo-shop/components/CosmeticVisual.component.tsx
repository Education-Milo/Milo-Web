import React from "react";
import { cosmeticImageSrc, TYPE_ICONS, type Cosmetic } from "@features/cosmetics/store/cosmetics.model";

/** Visuel d'un objet : image du catalogue, sinon pictogramme du type. */
const CosmeticVisual: React.FC<{ item: Cosmetic; className?: string }> = ({ item, className }) => (
	item.image ? (
		<img src={cosmeticImageSrc(item.image)!} alt="" className={className} draggable={false} />
	) : (
		<span className={className} aria-hidden="true">{TYPE_ICONS[item.type] ?? "🎁"}</span>
	)
);

export default CosmeticVisual;
