import React, { useEffect, useState } from "react";
import {
	meshNamesForItemIds,
	renderMiloAvatar,
} from "@features/my-milo/utils/miloAvatar";

interface MiloAvatarProps {
	/// Ids des objets équipés par CE utilisateur. Pour soi, ils viennent du
	/// store local ; pour un ami, du backend (voir `equipped_items` sur User).
	equippedItemIds?: number[];
	/// Repli affiché tant que le portrait n'est pas rendu, ou s'il échoue
	initials: string;
	className?: string;
}

/// Photo de profil : le Milo de l'utilisateur, avec ses accessoires.
/// Le rendu 3D est mutualisé et mis en cache (cf. miloAvatar.ts), afin qu'une
/// liste d'amis n'ouvre pas un contexte WebGL par carte.
const MiloAvatar: React.FC<MiloAvatarProps> = ({
	equippedItemIds,
	initials,
	className,
}) => {
	const [src, setSrc] = useState<string | null>(null);
	/// Clé stable : évite de relancer un rendu à chaque re-render du parent
	const key = (equippedItemIds ?? []).join(",");

	useEffect(() => {
		let cancelled = false;
		const ids = key ? key.split(",").map(Number) : [];
		renderMiloAvatar(meshNamesForItemIds(ids)).then((url) => {
			if (!cancelled) setSrc(url);
		});
		return () => {
			cancelled = true;
		};
	}, [key]);

	if (!src) {
		return <span className={className}>{initials}</span>;
	}

	return (
		<img
			src={src}
			alt=""
			className={`milo-avatar-img${className ? ` ${className}` : ""}`}
			draggable={false}
		/>
	);
};

export default MiloAvatar;
