import React from "react";
import type { OcrDocumentType } from "@features/ocr/types/ocr.types";
import { OCR_DOCUMENT_OPTIONS } from "@features/ocr/constants/ocr.constants";
import { ChevronRight, BookOpen } from "lucide-react";
import "@features/ocr/styles/OcrScreen.css";

interface OcrTypeSelectorProps {
	onSelect: (type: OcrDocumentType) => void;
}

/**
 * Étape 1 : l'utilisateur choisit le type de document à importer.
 * Design tuiles carrées premium (style Courses).
 */
export const OcrTypeSelector: React.FC<OcrTypeSelectorProps> = ({
	onSelect,
}) => {
	return (
		<div>
			{/* ─── Section Header ─── */}
			<header className="ocr-type-header" style={{ marginBottom: '20px' }}>
				<div className="ocr-type-title-wrap">
					<BookOpen size={20} className="ocr-type-section-icon" />
					<h2 className="ocr-type-title">Choisis ton document</h2>
				</div>
				<span className="ocr-type-count">
					{OCR_DOCUMENT_OPTIONS.length} type{OCR_DOCUMENT_OPTIONS.length > 1 ? "s" : ""}
				</span>
			</header>

			{/* ─── Grille de tuiles ─── */}
			<div className="ocr-type-grid">
				{OCR_DOCUMENT_OPTIONS.map((option, index) => (
					<button
						key={option.type}
						className="ocr-type-tile"
						onClick={() => onSelect(option.type)}
						aria-label={`Sélectionner ${option.label}`}
						style={{ animationDelay: `${0.05 * index}s` }}
					>
						<div className="ocr-tile-bg" aria-hidden="true" />
						<div className="ocr-tile-shine" aria-hidden="true" />

						<div className="ocr-tile-emoji-wrap">
							<span className="ocr-tile-emoji">{option.icon}</span>
						</div>

						<div className="ocr-tile-body">
							<h3 className="ocr-tile-title">{option.label}</h3>
							<p className="ocr-tile-description">{option.description}</p>
							<div className="ocr-tile-cta">
								<span>Choisir</span>
								<ChevronRight size={16} />
							</div>
						</div>

						<span className="ocr-tile-formats">
							{option.acceptedFormats.join(", ")}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};
