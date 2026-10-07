import React from "react";
import { isDistressReply, splitDistressNumbers } from "@shared/lib/distress";

/**
 * Texte d'une réponse avec les numéros d'aide (3114, 119, 3018) en liens
 * `tel:` : un toucher suffit pour appeler depuis un téléphone. Hors réponse
 * de détresse (ex. « 119 » résultat d'un calcul), le texte reste brut.
 */
const DistressText: React.FC<{ text: string }> = ({ text }) =>
	!isDistressReply(text) ? (
		<>{text}</>
	) : (
	<>
		{splitDistressNumbers(text).map((part, index) =>
			part.isNumber ? (
				<a key={index} href={`tel:${part.value}`} className="distress-tel">
					{part.value}
				</a>
			) : (
				<React.Fragment key={index}>{part.value}</React.Fragment>
			),
		)}
	</>
	);

export default DistressText;
