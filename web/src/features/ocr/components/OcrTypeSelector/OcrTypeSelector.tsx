import React from "react";
import type { OcrDocumentType } from "@features/ocr/types/ocr.types";
import { OCR_DOCUMENT_OPTIONS } from "@features/ocr/constants/ocr.constants";
import styles from "./OcrTypeSelector.module.css";

interface OcrTypeSelectorProps {
	onSelect: (type: OcrDocumentType) => void;
}

/**
 * Étape 1 : l'utilisateur choisit le type de document à importer.
 */
export const OcrTypeSelector: React.FC<OcrTypeSelectorProps> = ({
	onSelect,
}) => {
	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h1 className={styles.title}>Importer un document</h1>
				<p className={styles.subtitle}>
					Choisis le type de document que tu souhaites analyser
				</p>
			</header>

			<div className={styles.grid}>
				{OCR_DOCUMENT_OPTIONS.map((option) => (
					<button
						key={option.type}
						className={styles.card}
						onClick={() => onSelect(option.type)}
						aria-label={`Sélectionner ${option.label}`}
					>
						<span className={styles.cardIcon}>{option.icon}</span>
						<span className={styles.cardLabel}>{option.label}</span>
						<span className={styles.cardDescription}>{option.description}</span>
						<span className={styles.cardFormats}>
							{option.acceptedFormats.join(", ")}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};
