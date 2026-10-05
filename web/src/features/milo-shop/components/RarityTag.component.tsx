import React from "react";
import { RARITIES, RARITY_LABELS, type CosmeticRarity } from "@features/cosmetics/store/cosmetics.model";

/// Étiquette de rareté : nom + niveau sur cinq (pastilles), pour qu'on lise
/// la valeur d'un objet même sans connaître le code couleur.
/// Les couleurs viennent de la classe `ms-r-*` posée sur un parent.
const RarityTag: React.FC<{ rarity: CosmeticRarity; suffix?: string; className?: string }> = ({
	rarity,
	suffix,
	className = "",
}) => {
	const tier = RARITIES.indexOf(rarity);
	return (
		<span className={`ms-tag ${className}`.trim()}>
			<span className="ms-tag__label">
				{RARITY_LABELS[rarity] ?? rarity}
				{suffix && <span className="ms-tag__suffix"> · {suffix}</span>}
			</span>
			{tier >= 0 && (
				<span className="ms-pips" aria-label={`Niveau ${tier + 1} sur ${RARITIES.length}`} role="img">
					{RARITIES.map((r, i) => (
						<i key={r} className={i <= tier ? "is-on" : undefined} />
					))}
				</span>
			)}
		</span>
	);
};

export default RarityTag;
