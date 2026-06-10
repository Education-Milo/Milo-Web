import React, { useRef, useState, useCallback } from "react";
import type { OcrDocumentType } from "@features/ocr/types/ocr.types";
import {
	OCR_DOCUMENT_OPTIONS,
	ACCEPTED_FILE_FORMATS,
	MAX_FILE_SIZE_MB,
	MAX_FILE_SIZE_BYTES,
} from "@features/ocr/constants/ocr.constants";
import { ArrowLeft, Trash2, Send } from "lucide-react";
import "@features/ocr/styles/OcrScreen.css";

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
		<div className="ocr-uploader">
			{/* ─── Header avec bouton retour ─── */}
			<div className="ocr-uploader-header">
				<button
					className="ocr-btn-back"
					onClick={onBack}
					aria-label="Retour"
				>
					<ArrowLeft size={18} />
					<span>Retour</span>
				</button>
				<div className="ocr-type-tag">
					<span>{docOption?.icon}</span>
					<span>{docOption?.label}</span>
				</div>
			</div>

			{/* ─── Zone d'upload ou prévisualisation ─── */}
			{!selectedFile ? (
				<div
					className={`ocr-dropzone ${isDragging ? "ocr-dropzone-dragging" : ""}`}
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
						className="ocr-hidden-input"
						aria-hidden="true"
					/>
					<div className="ocr-dropzone-content">
						<span className="ocr-dropzone-icon">📎</span>
						<p className="ocr-dropzone-text">
							Glisse-dépose ton fichier ici ou{" "}
							<span className="ocr-dropzone-link">clique pour parcourir</span>
						</p>
						<p className="ocr-dropzone-formats">
							Formats : {ACCEPTED_FILE_FORMATS} · Max {MAX_FILE_SIZE_MB} Mo
						</p>
					</div>
				</div>
			) : (
				<div className="ocr-preview">
					{isImage && previewUrl && (
						<img
							src={previewUrl}
							alt="Prévisualisation du document"
							className="ocr-preview-image"
						/>
					)}
					{isPdf && previewUrl && (
						<iframe
							src={previewUrl}
							title="Prévisualisation PDF"
							className="ocr-preview-pdf"
						/>
					)}
					<div className="ocr-preview-meta">
						<span className="ocr-preview-filename">{selectedFile.name}</span>
						<span className="ocr-preview-filesize">
							{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
						</span>
					</div>
				</div>
			)}

			{/* ─── Erreur ─── */}
			{fileError && (
				<p className="ocr-error-message" role="alert">
					{fileError}
				</p>
			)}

			{/* ─── Actions (visibles uniquement si un fichier est sélectionné) ─── */}
			{selectedFile && (
				<div className="ocr-actions">
					<button
						className="ocr-btn-delete"
						onClick={onDelete}
						disabled={isLoading}
						aria-label="Supprimer le fichier"
					>
						<Trash2 size={18} />
						<span>Supprimer</span>
					</button>
					<button
						className="ocr-btn-send"
						onClick={onSend}
						disabled={isLoading}
						aria-label="Envoyer le document"
					>
						{isLoading ? (
							<span
								className="ocr-loading-spinner"
								aria-label="Chargement..."
							/>
						) : (
							<>
								<Send size={18} />
								<span>Envoyer le document</span>
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
};
