import React, { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { FAQ_PREVIEW, SECTION_IDS } from "@features/landing/data/landing.data";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle, revealUp } from "@features/landing/lib/animations";
import "@features/landing/components/FaqPreview/FaqPreview.css";

interface FaqItemProps {
	question: string;
	answer: string;
	icon: Emoji3DName;
}

/// Une question : son état d'ouverture lui appartient (un hook par composant)
const FaqItem: React.FC<FaqItemProps> = ({ question, answer, icon }) => {
	const [isOpen, setIsOpen] = useState(false);
	const panelId = useId();
	return (
		<div className={`lp-faq__item${isOpen ? " is-open" : ""}`}>
			<h3>
				<button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen((open) => !open)}>
					<span className="lp-faq__icon" aria-hidden="true">
						<Emoji3D name={icon} />
					</span>
					<span>{question}</span>
					<span className="lp-faq__chevron" aria-hidden="true">
						<ChevronDown size={20} />
					</span>
				</button>
			</h3>
			<div className="lp-faq__panel" id={panelId} role="region">
				<div>
					<p>{answer}</p>
				</div>
			</div>
		</div>
	);
};

/// Aperçu des questions des parents, avec un lien vers la FAQ complète
const FaqPreview: React.FC = () => {
	const root = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(root);
			revealTitle(q(".lp-faq__title")[0]);
			revealUp(q("[data-faq-up]"), root.current);
			gsap.from(q(".lp-faq__hero-icon"), {
				scale: 0,
				rotate: -45,
				duration: 0.9,
				ease: "back.out(2.2)",
				scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
			});
			gsap.from(q(".lp-faq__item"), {
				x: 80,
				opacity: 0,
				duration: 0.7,
				stagger: 0.1,
				ease: "power3.out",
				scrollTrigger: { trigger: q(".lp-faq__list")[0], start: "top 82%", once: true },
			});
		},
		{ scope: root },
	);

	return (
		<div className="lp-faq" id={SECTION_IDS.faq} ref={root}>
			<div className="lp-faq__intro">
				<Emoji3D name="speech_balloon" className="lp-faq__hero-icon" />
				<h2 className="lp-display lp-section-title lp-faq__title">
					Questions &amp; <span className="lp-hl">réponses</span>
				</h2>
				<p className="lp-lead" data-faq-up>
					Tout ce que vous devez savoir pour accompagner votre enfant sereinement.
				</p>
				<Link to="/faq" className="lp-btn lp-btn--ghost" data-faq-up>
					Toute la FAQ <ArrowRight size={20} />
				</Link>
			</div>
			<div className="lp-faq__list">
				{FAQ_PREVIEW.map((item) => (
					<FaqItem key={item.question} {...item} />
				))}
			</div>
		</div>
	);
};

export default FaqPreview;
