import React, { useEffect, useState } from "react";
import { renderMiloAvatar } from "@features/my-milo/utils/miloAvatar";

interface MiloAvatarProps {
	/// Maillages équipés par CET utilisateur (champ `mesh_name` des cosmétiques).
	/// Pour soi, ils viennent de GET /user/{id}/locker/equipped ; pour un ami,
	/// du catalogue via useMeshNamesForItemIds.
	equippedMeshNames?: string[];
	/// Repli affiché tant que le portrait n'est pas rendu, ou s'il échoue
	initials: string;
	className?: string;
}

/// Photo de profil : le Milo de l'utilisateur, avec ses accessoires.
/// Le rendu 3D est mutualisé et mis en cache (cf. miloAvatar.ts), afin qu'une
/// liste d'amis n'ouvre pas un contexte WebGL par carte.
const MiloAvatar: React.FC<MiloAvatarProps> = ({
	equippedMeshNames,
	initials,
	className,
}) => {
	const [src, setSrc] = useState<string | null>(null);
	/// Clé stable : évite de relancer un rendu à chaque re-render du parent
	const key = [...(equippedMeshNames ?? [])].sort().join("|");

	useEffect(() => {
		let cancelled = false;
		const names = key ? key.split("|") : [];
		renderMiloAvatar(names).then((url) => {
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
