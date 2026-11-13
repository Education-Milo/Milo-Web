import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { OcrDocumentType } from "@features/ocr/types/ocr.types";
import { OCR_DOCUMENT_OPTIONS, OCR_TYPE_ICON } from "@features/ocr/constants/ocr.constants";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import "@features/ocr/styles/OcrImport.css";

interface OcrTypeSelectorProps {
	onSelect: (type: OcrDocumentType) => void;
}

/**
 * Étape 1 : l'utilisateur choisit le type de document à importer.
 * Trois cartes blanches de la charte, icône 3D sur soleil crème.
 */
export const OcrTypeSelector: React.FC<OcrTypeSelectorProps> = ({ onSelect }) => {
	const reduceMotion = useReducedMotion();

	return (
		<section className="oi-section" aria-labelledby="oi-type-title">
			<div className="oi-section__head">
				<h2 id="oi-type-title" className="oi-section__title">
					Choisis ton <span className="oi-hl">document</span>
				</h2>
				<p className="oi-section__sub">PDF, JPG ou PNG, jusqu'à 10 Mo.</p>
			</div>

			<div className="oi-types">
				{OCR_DOCUMENT_OPTIONS.map((option, index) => (
					<motion.button
						key={option.type}
						type="button"
						className="oi-type"
						onClick={() => onSelect(option.type)}
						initial={reduceMotion ? false : { opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 + index * 0.07 }}
					>
						<span className="oi-type__art" aria-hidden="true">
							<Emoji3D name={OCR_TYPE_ICON[option.type]} className="oi-type__icon" />
						</span>
						<span className="oi-type__title">{option.label}</span>
						<span className="oi-type__desc">{option.description}</span>
						<span className="oi-type__cta">
							Choisir
							<ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
						</span>
					</motion.button>
				))}
			</div>
		</section>
	);
};
