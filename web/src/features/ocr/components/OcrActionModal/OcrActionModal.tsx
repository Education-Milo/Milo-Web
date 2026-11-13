import React, { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { OcrAction, OcrDocumentType } from "@features/ocr/types/ocr.types";
import { OCR_ACTIONS_BY_TYPE } from "@features/ocr/constants/ocr.constants";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import "@features/ocr/styles/OcrImport.css";

interface OcrActionModalProps {
	isOpen: boolean;
	documentType: OcrDocumentType;
	onConfirm: (action: OcrAction) => void;
	onClose: () => void;
}

const ACTION_ICON: Record<Exclude<OcrAction, "send_bulletin">, Emoji3DName> = {
	generate_qcm: "bullseye",
	discuss_milo_cours: "speech_balloon",
	generate_exercise: "rocket",
	discuss_milo_ex: "speech_balloon",
};

/**
 * Choix de l'action après l'envoi d'un Cours ou d'un Exercice
 * (pas affiché pour un Bulletin). Même mise en scène que les autres
 * pop-ups : carte blanche, Milo, deux grandes cartes d'action.
 */
export const OcrActionModal: React.FC<OcrActionModalProps> = ({ isOpen, documentType, onConfirm, onClose }) => {
	const reduceMotion = useReducedMotion();

	// Fermeture avec Échap
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isOpen, onClose]);

	// Bloque le défilement de la page pendant l'ouverture
	useEffect(() => {
		document.body.style.overflow = isOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const visible = isOpen && documentType !== "bulletin";
	const kind = documentType as "cours" | "exercice";
	const actions = visible ? OCR_ACTIONS_BY_TYPE[kind] : [];

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					className="oi-modal-backdrop"
					onClick={(e) => e.target === e.currentTarget && onClose()}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="oi-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="oi-modal-title"
						initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.94 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: 20, opacity: 0, scale: 0.96 }}
						transition={{ type: "spring", stiffness: 260, damping: 20 }}
					>
						<button type="button" className="oi-modal__close" onClick={onClose} aria-label="Fermer">
							<X size={20} aria-hidden="true" />
						</button>
						<img src="/lesson/milo-qcm.webp" alt="" className="oi-modal__milo" draggable={false} />
						<div className="oi-modal__titles">
							<h2 id="oi-modal-title" className="oi-modal__title">
								Document <span className="oi-hl">reçu</span> !
							</h2>
							<p className="oi-modal__sub">
								{kind === "cours" ? "Que veux-tu faire avec ce cours ?" : "Que veux-tu faire avec cet exercice ?"}
							</p>
						</div>
						<div className="oi-modal__grid">
							{actions.map((option, i) => (
								<motion.button
									key={option.action}
									type="button"
									className={`oi-action${i === 0 ? " is-featured" : ""}`}
									onClick={() => onConfirm(option.action)}
									autoFocus={i === 0}
									initial={reduceMotion ? false : { opacity: 0, y: 16 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 + i * 0.08 }}
								>
									<Emoji3D name={ACTION_ICON[option.action as keyof typeof ACTION_ICON] ?? "sparkles"} className="oi-action__icon" />
									<span className="oi-action__label">{option.label}</span>
									<span className="oi-action__desc">{option.description}</span>
								</motion.button>
							))}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
