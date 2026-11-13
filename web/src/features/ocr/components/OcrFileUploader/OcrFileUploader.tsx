import React, { useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Trash2, Send, FileText } from "lucide-react";
import type { OcrDocumentType } from "@features/ocr/types/ocr.types";
import {
	OCR_DOCUMENT_OPTIONS,
	ACCEPTED_FILE_FORMATS,
	MAX_FILE_SIZE_MB,
	MAX_FILE_SIZE_BYTES,
	OCR_TYPE_ICON,
} from "@features/ocr/constants/ocr.constants";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import "@features/ocr/styles/OcrImport.css";

interface OcrFileUploaderProps {
	documentType: OcrDocumentType;
	selectedFile: File | null;
	previewUrl: string | null;
	isLoading: boolean;
	onFileChange: (file: File | null) => void;
	onDelete: () => void;
	onSend: () => void;
	onBack: () => void;
}

/**
 * Étape 2 : dépôt du fichier (glisser-déposer ou parcourir),
 * prévisualisation, puis « Envoyer » ou « Supprimer ».
 */
export const OcrFileUploader: React.FC<OcrFileUploaderProps> = ({
	documentType,
	selectedFile,
	previewUrl,
	isLoading,
	onFileChange,
	onDelete,
	onSend,
	onBack,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const reduceMotion = useReducedMotion();
	const [isDragging, setIsDragging] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const docOption = OCR_DOCUMENT_OPTIONS.find((o) => o.type === documentType);

	const validateAndSetFile = useCallback(
		(file: File) => {
			setFileError(null);

			if (file.size > MAX_FILE_SIZE_BYTES) {
				setFileError(`Ce fichier est trop lourd : ${MAX_FILE_SIZE_MB} Mo maximum.`);
				return;
			}

			const accepted = ACCEPTED_FILE_FORMATS.split(",").map((f) => f.trim().replace(".", ""));
			const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
			if (!accepted.includes(ext)) {
				setFileError("Ce format n'est pas pris en charge. Essaie un PDF, un JPG ou un PNG.");
				return;
			}

			onFileChange(file);
		},
		[onFileChange],
	);

	// ─── Glisser-déposer ──────────────────────────────────────────────────────
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};
	const handleDragLeave = () => setIsDragging(false);
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) validateAndSetFile(file);
	};
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) validateAndSetFile(file);
		// réinitialise l'input pour pouvoir re-sélectionner le même fichier
		e.target.value = "";
	};

	const isImage = selectedFile?.type.startsWith("image/");
	const isPdf = selectedFile?.type === "application/pdf";

	return (
		<motion.section
			className="oi-upload"
			aria-labelledby="oi-upload-title"
			initial={reduceMotion ? false : { opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 200, damping: 20 }}
		>
			<div className="oi-upload__head">
				<button type="button" className="oi-btn oi-btn--ghost oi-btn--sm" onClick={onBack}>
					<ArrowLeft size={18} strokeWidth={2.6} aria-hidden="true" />
					Changer de type
				</button>
				<span className="oi-chip">
					<Emoji3D name={OCR_TYPE_ICON[documentType]} />
					{docOption?.label}
				</span>
			</div>

			<div className="oi-section__head">
				<h2 id="oi-upload-title" className="oi-section__title">
					{selectedFile ? (
						<>C'est bien <span className="oi-hl">celui-là</span> ?</>
					) : (
						<>Dépose ton <span className="oi-hl">fichier</span></>
					)}
				</h2>
				<p className="oi-section__sub">
					{selectedFile ? "Vérifie que le texte est lisible, puis envoie-le à Milo." : "Une photo nette et bien éclairée donne les meilleurs résultats."}
				</p>
			</div>

			{!selectedFile ? (
				<div
					className={`oi-drop${isDragging ? " is-dragging" : ""}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					<input
						ref={inputRef}
						id="oi-file-input"
						type="file"
						accept={ACCEPTED_FILE_FORMATS}
						onChange={handleInputChange}
						className="oi-sr-only"
					/>
					<motion.span
						className="oi-drop__icon"
						aria-hidden="true"
						animate={isDragging && !reduceMotion ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }}
						transition={{ type: "spring", stiffness: 300, damping: 14 }}
					>
						<Emoji3D name={isDragging ? "party_popper" : "card_index_dividers"} />
					</motion.span>
					<p className="oi-drop__text">{isDragging ? "Lâche-le ici !" : "Glisse ton fichier ici"}</p>
					<span className="oi-drop__or">ou</span>
					<button type="button" className="oi-btn oi-btn--primary" onClick={() => inputRef.current?.click()}>
						<FileText size={20} strokeWidth={2.4} aria-hidden="true" />
						Choisir un fichier
					</button>
					<p className="oi-drop__formats">PDF, JPG ou PNG · {MAX_FILE_SIZE_MB} Mo maximum</p>
				</div>
			) : (
				<div className="oi-preview">
					<div className="oi-preview__frame">
						{isImage && previewUrl && <img src={previewUrl} alt="Aperçu du document" className="oi-preview__img" />}
						{isPdf && previewUrl && <iframe src={previewUrl} title="Aperçu du PDF" className="oi-preview__pdf" />}
					</div>
					<div className="oi-preview__meta">
						<FileText size={20} aria-hidden="true" />
						<span className="oi-preview__name">{selectedFile.name}</span>
						<span className="oi-preview__size">{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</span>
					</div>
				</div>
			)}

			{fileError && (
				<p className="oi-file-error" role="alert">
					{fileError}
				</p>
			)}

			{selectedFile && (
				<div className="oi-actions">
					<button type="button" className="oi-btn oi-btn--ghost" onClick={onDelete} disabled={isLoading}>
						<Trash2 size={18} aria-hidden="true" />
						Changer de fichier
					</button>
					<button type="button" className="oi-btn oi-btn--primary oi-btn--big" onClick={onSend} disabled={isLoading}>
						{isLoading ? (
							<>
								<span className="oi-spinner" aria-hidden="true" />
								Milo lit ton document…
							</>
						) : (
							<>
								<Send size={20} strokeWidth={2.4} aria-hidden="true" />
								Envoyer à Milo
							</>
						)}
					</button>
				</div>
			)}
		</motion.section>
	);
};
