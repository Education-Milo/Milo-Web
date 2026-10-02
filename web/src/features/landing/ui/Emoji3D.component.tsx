import React from "react";
import type { Emoji3DName } from "@features/landing/data/landing.data";

interface Emoji3DProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
	name: Emoji3DName;
	/// Texte alternatif : vide par défaut, les icônes étant décoratives
	alt?: string;
}

/// Icône 3D (Fluent Emoji 3D) servie depuis /public/landing/emoji
const Emoji3D: React.FC<Emoji3DProps> = ({ name, alt = "", className = "", ...rest }) => (
	<img
		src={`/landing/emoji/${name}.webp`}
		alt={alt}
		className={`lp-e3d ${className}`.trim()}
		draggable={false}
		loading="lazy"
		decoding="async"
		{...rest}
	/>
);

export default Emoji3D;
