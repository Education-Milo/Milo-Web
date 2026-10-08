import React from "react";
import { parseInline } from "@features/milo-scene/utils/lessonText";

/// Texte à la craie : mots clés en jaune pompon, mots définis soulignés,
/// nombres et calculs en mandarine.
const InlineText: React.FC<{ text: string }> = ({ text }) => (
	<>
		{parseInline(text).map((chunk, i) => {
			if (chunk.kind === "strong") return <strong key={i}>{chunk.text}</strong>;
			if (chunk.kind === "term")
				return (
					<strong key={i} className="is-term">
						{chunk.text}
					</strong>
				);
			if (chunk.kind === "num")
				return (
					<span key={i} className="cls-num">
						{chunk.text}
					</span>
				);
			return <React.Fragment key={i}>{chunk.text}</React.Fragment>;
		})}
	</>
);

export default InlineText;
