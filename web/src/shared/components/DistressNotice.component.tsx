import React from "react";
import { Phone, X } from "lucide-react";
import DistressText from "@shared/components/DistressText.component";
import "@shared/styles/Distress.css";

interface DistressNoticeProps {
	/** Réponse complète de Milo, jamais tronquée */
	text: string;
	onClose: () => void;
}

/**
 * Réponse de détresse (3114, 119, 3018) affichée en HTML par-dessus la scène :
 * le tableau 3D ne permet ni lien cliquable ni lecture confortable.
 */
const DistressNotice: React.FC<DistressNoticeProps> = ({ text, onClose }) => (
	<aside className="distress-notice" role="dialog" aria-modal="false" aria-labelledby="distress-notice-title">
		<header className="distress-notice-header">
			<span className="distress-notice-icon" aria-hidden="true">
				<Phone size={18} />
			</span>
			<h2 id="distress-notice-title">Tu n'es pas seul·e</h2>
			<button type="button" className="distress-notice-close" onClick={onClose} aria-label="Fermer">
				<X size={18} />
			</button>
		</header>
		<p className="distress-notice-text">
			<DistressText text={text} />
		</p>
	</aside>
);

export default DistressNotice;
