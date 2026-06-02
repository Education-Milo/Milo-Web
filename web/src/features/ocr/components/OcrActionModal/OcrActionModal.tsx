import React, { useEffect, useRef } from "react";
import type { OcrAction, OcrDocumentType } from "@features/ocr/types/ocr.types";
import { OCR_ACTIONS_BY_TYPE } from "@features/ocr/constants/ocr.constants";
import styles from "./OcrActionModal.module.css";

interface OcrActionModalProps {
	isOpen: boolean;
	documentType: OcrDocumentType;
	onConfirm: (action: OcrAction) => void;
	onClose: () => void;
}

/**
 * Modal de choix d'action après l'envoi d'un document de type Cours ou Exercice.
 * N'est pas affiché pour le type Bulletin.
 */
export const OcrActionModal: React.FC<OcrActionModalProps> = ({
	isOpen,
	documentType,
	onConfirm,
	onClose,
}) => {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Focus trap basique : fermeture avec Escape
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isOpen, onClose]);

	// Bloquer le scroll du body quand la modal est ouverte
	useEffect(() => {
		document.body.style.overflow = isOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen || documentType === "bulletin") return null;

	const actions = OCR_ACTIONS_BY_TYPE[documentType as "cours" | "exercice"];

	const titleByType = {
		cours: "Que veux-tu faire avec ce cours ?",
		exercice: "Que veux-tu faire avec cet exercice ?",
	};

	return (
		<div
			className={styles.overlay}
			onClick={(e) => e.target === e.currentTarget && onClose()}
			role="dialog"
			aria-modal="true"
			aria-label="Choisir une action"
		>
			<div className={styles.modal} ref={dialogRef}>
				{/* ─── Header ─── */}
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>
						{titleByType[documentType as "cours" | "exercice"]}
					</h2>
					<button
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Fermer"
					>
						✕
					</button>
				</div>

				{/* ─── Actions ─── */}
				<div className={styles.actionsGrid}>
					{actions.map((option) => (
						<button
							key={option.action}
							className={styles.actionCard}
							onClick={() => onConfirm(option.action)}
						>
							<span className={styles.actionIcon}>{option.icon}</span>
							<span className={styles.actionLabel}>{option.label}</span>
							<span className={styles.actionDescription}>
								{option.description}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
