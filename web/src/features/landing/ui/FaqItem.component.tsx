import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import "@features/landing/ui/FaqItem.css";

interface FaqItemProps {
	question: string;
	answer: string;
	icon: Emoji3DName;
	className?: string;
	style?: React.CSSProperties;
}

/// Une question dépliable (aperçu de la Vitrine et page FAQ) : son état
/// d'ouverture lui appartient (un hook par composant)
const FaqItem: React.FC<FaqItemProps> = ({ question, answer, icon, className = "", style }) => {
	const [isOpen, setIsOpen] = useState(false);
	const panelId = useId();
	return (
		<div className={`lp-faq-item${isOpen ? " is-open" : ""} ${className}`.trim()} style={style}>
			<h3>
				<button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen((open) => !open)}>
					<span className="lp-faq-item__icon" aria-hidden="true">
						<Emoji3D name={icon} />
					</span>
					<span>{question}</span>
					<span className="lp-faq-item__chevron" aria-hidden="true">
						<ChevronDown size={20} />
					</span>
				</button>
			</h3>
			<div className="lp-faq-item__panel" id={panelId} role="region">
				<div>
					<p>{answer}</p>
				</div>
			</div>
		</div>
	);
};

export default FaqItem;
