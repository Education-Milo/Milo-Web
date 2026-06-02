import React, { useRef, useState, useCallback } from "react";
import type { OcrDocumentType } from "@features/ocr/types/ocr.types";
import {
	OCR_DOCUMENT_OPTIONS,
	ACCEPTED_FILE_FORMATS,
	MAX_FILE_SIZE_MB,
	MAX_FILE_SIZE_BYTES,
} from "@features/ocr/constants/ocr.constants";
import styles from "./OcrFileUploader.module.css";

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
 * Étape 2 : upload d'un fichier avec drag & drop, prévisualisation,
 * et boutons "Envoyer" / "Supprimer".
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
	const [isDragging, setIsDragging] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const docOption = OCR_DOCUMENT_OPTIONS.find((o) => o.type === documentType);

	const validateAndSetFile = useCallback(
		(file: File) => {
			setFileError(null);

			if (file.size > MAX_FILE_SIZE_BYTES) {
				setFileError(
					`Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE_MB} Mo.`,
				);
				return;
			}

			const accepted = ACCEPTED_FILE_FORMATS.split(",").map((f) =>
				f.trim().replace(".", ""),
			);
			const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
			if (!accepted.includes(ext)) {
				setFileError(
					`Format non supporté. Formats acceptés : ${ACCEPTED_FILE_FORMATS}`,
				);
				return;
			}

			onFileChange(file);
		},
		[onFileChange],
	);

	// ─── Drag & Drop ──────────────────────────────────────────────────────────

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
		// reset input pour permettre de re-sélectionner le même fichier
		e.target.value = "";
	};

	// ─── Preview ──────────────────────────────────────────────────────────────

	const isImage = selectedFile?.type.startsWith("image/");
	const isPdf = selectedFile?.type === "application/pdf";

	return (
		<div className={styles.container}>
			{/* ─── Header avec bouton retour ─── */}
			<div className={styles.header}>
				<button
					className={styles.backButton}
					onClick={onBack}
					aria-label="Retour"
				>
					← Retour
				</button>
				<div className={styles.typeTag}>
					<span>{docOption?.icon}</span>
					<span>{docOption?.label}</span>
				</div>
			</div>

			{/* ─── Zone d'upload ou prévisualisation ─── */}
			{!selectedFile ? (
				<div
					className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => inputRef.current?.click()}
					role="button"
					tabIndex={0}
					aria-label="Zone de dépôt de fichier"
					onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
				>
					<input
						ref={inputRef}
						type="file"
						accept={ACCEPTED_FILE_FORMATS}
						onChange={handleInputChange}
						className={styles.hiddenInput}
						aria-hidden="true"
					/>
					<div className={styles.dropzoneContent}>
						<span className={styles.dropzoneIcon}>📎</span>
						<p className={styles.dropzoneText}>
							Glisse-dépose ton fichier ici ou{" "}
							<span className={styles.dropzoneLink}>clique pour parcourir</span>
						</p>
						<p className={styles.dropzoneFormats}>
							Formats : {ACCEPTED_FILE_FORMATS} · Max {MAX_FILE_SIZE_MB} Mo
						</p>
					</div>
				</div>
			) : (
				<div className={styles.preview}>
					{isImage && previewUrl && (
						<img
							src={previewUrl}
							alt="Prévisualisation du document"
							className={styles.previewImage}
						/>
					)}
					{isPdf && previewUrl && (
						<iframe
							src={previewUrl}
							title="Prévisualisation PDF"
							className={styles.previewPdf}
						/>
					)}
					<div className={styles.previewMeta}>
						<span className={styles.previewFileName}>{selectedFile.name}</span>
						<span className={styles.previewFileSize}>
							{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
						</span>
					</div>
				</div>
			)}

			{/* ─── Erreur ─── */}
			{fileError && (
				<p className={styles.errorMessage} role="alert">
					{fileError}
				</p>
			)}

			{/* ─── Actions (visibles uniquement si un fichier est sélectionné) ─── */}
			{selectedFile && (
				<div className={styles.actions}>
					<button
						className={styles.deleteButton}
						onClick={onDelete}
						disabled={isLoading}
						aria-label="Supprimer le fichier"
					>
						🗑 Supprimer
					</button>
					<button
						className={styles.sendButton}
						onClick={onSend}
						disabled={isLoading}
						aria-label="Envoyer le document"
					>
						{isLoading ? (
							<span
								className={styles.loadingSpinner}
								aria-label="Chargement..."
							/>
						) : (
							"✉ Envoyer le document"
						)}
					</button>
				</div>
			)}
		</div>
	);
};
