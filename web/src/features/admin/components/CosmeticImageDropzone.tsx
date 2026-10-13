import React, { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, ImageOff, ImagePlus, Loader, Trash2 } from "lucide-react";
import { cosmeticImageSrc, TYPE_ICONS, type CosmeticType } from "@features/cosmetics/store/cosmetics.model";
import { COSMETIC_IMAGE_MAX_BYTES, COSMETIC_IMAGE_TYPES } from "@features/admin/store/admin.model";

interface CosmeticImageDropzoneProps {
	/** Fichier local choisi (en attente d'envoi ou en cours d'envoi), prioritaire à l'aperçu */
	file: File | null;
	/** Image déjà enregistrée côté serveur (chemin relatif versionné) */
	image: string | null;
	/** Pictogramme affiché quand il n'y a aucune image */
	type: CosmeticType;
	onSelect: (file: File) => void;
	/** Absent : pas de bouton « Retirer l'image » (sticker, ou rien d'enregistré) */
	onRemove?: () => void;
	busy?: boolean;
	busyLabel?: string;
	/** Erreur du serveur ou du formulaire (la vérification locale, plus récente, passe devant) */
	error?: string | null;
	hint?: string;
}

/** Arrondi au-dessus : un fichier de 2 Mo et 1 octet ne doit pas s'afficher « 2 Mo ». */
const formatSize = (bytes: number) =>
	bytes < 1024 * 1024
		? `${Math.max(1, Math.ceil(bytes / 1024))} Ko`
		: `${(Math.ceil((bytes / 1024 / 1024) * 10) / 10).toLocaleString("fr-FR")} Mo`;

/** Vérification de confort : le back revérifie les octets, son erreur fait foi. */
const checkFile = (file: File): string | null => {
	if (file.size === 0) return "Ce fichier est vide.";
	if (!COSMETIC_IMAGE_TYPES.includes(file.type)) return "Format non pris en charge : PNG, JPEG, WebP ou GIF.";
	if (file.size > COSMETIC_IMAGE_MAX_BYTES) return `Fichier trop lourd (${formatSize(file.size)}) : 2 Mo maximum.`;
	return null;
};

/** Aperçu local d'un fichier, révoqué quand il change ou au démontage. */
const useObjectUrl = (file: File | null) => {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!file) {
			setUrl(null);
			return;
		}
		const next = URL.createObjectURL(file);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [file]);
	return url;
};

/** Zone de dépôt d'image : glisser-déposer ou clic (et clavier) pour ouvrir le sélecteur. */
const CosmeticImageDropzone: React.FC<CosmeticImageDropzoneProps> = ({
	file,
	image,
	type,
	onSelect,
	onRemove,
	busy = false,
	busyLabel = "Envoi en cours…",
	error,
	hint,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const hintId = useId();
	const [dragging, setDragging] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);
	const [previewFailed, setPreviewFailed] = useState(false);
	const localUrl = useObjectUrl(file);
	const previewUrl = localUrl ?? cosmeticImageSrc(image);

	useEffect(() => setPreviewFailed(false), [previewUrl]);

	// Un fichier lâché à côté de la zone ouvrirait l'image à la place de la page
	useEffect(() => {
		const block = (e: DragEvent) => {
			if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
		};
		window.addEventListener("dragover", block);
		window.addEventListener("drop", block);
		return () => {
			window.removeEventListener("dragover", block);
			window.removeEventListener("drop", block);
		};
	}, []);

	const pick = (candidate: File | undefined) => {
		if (!candidate || busy) return;
		const problem = checkFile(candidate);
		setLocalError(problem);
		if (!problem) onSelect(candidate);
	};

	const open = () => {
		if (!busy) inputRef.current?.click();
	};

	// La vérification locale est remise à zéro à chaque choix : non nulle, elle est la plus récente
	const shownError = localError ?? error;

	return (
		<div className="ad-dropzone-wrap">
			<div
				role="button"
				tabIndex={busy ? -1 : 0}
				aria-describedby={hintId}
				aria-busy={busy}
				aria-disabled={busy}
				className={[
					"ad-dropzone",
					dragging ? "is-dragging" : "",
					busy ? "is-busy" : "",
					shownError ? "has-error" : "",
				].filter(Boolean).join(" ")}
				onClick={open}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						open();
					}
				}}
				onDragOver={(e) => {
					e.preventDefault();
					e.dataTransfer.dropEffect = busy ? "none" : "copy";
					if (!busy) setDragging(true);
				}}
				onDragLeave={(e) => {
					// Ignore les passages d'un enfant à l'autre de la zone
					if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
				}}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					pick(e.dataTransfer.files[0]);
				}}
			>
				<div className="ad-dropzone-preview">
					{previewUrl && !previewFailed ? (
						<img src={previewUrl} alt="Aperçu de l'image" onError={() => setPreviewFailed(true)} draggable={false} />
					) : (
						<span className="ad-cosmetic-preview-placeholder" aria-hidden="true">
							{previewFailed ? <ImageOff size={24} /> : TYPE_ICONS[type]}
						</span>
					)}
					{busy && (
						<span className="ad-dropzone-busy">
							<Loader size={20} className="ad-spin" />
						</span>
					)}
				</div>
				<div className="ad-dropzone-text">
					{busy ? (
						<strong>{busyLabel}</strong>
					) : dragging ? (
						<strong>Relâche pour déposer l'image</strong>
					) : (
						<>
							<strong>
								<ImagePlus size={15} /> {previewUrl ? "Remplacer l'image" : "Ajouter une image"}
							</strong>
							<span>Glisse un fichier ici ou clique pour parcourir</span>
						</>
					)}
					<span id={hintId} className="ad-muted">
						{file ? `${file.name} · ${formatSize(file.size)}` : hint ?? "PNG, JPEG, WebP ou GIF · 2 Mo maximum"}
					</span>
				</div>
			</div>
			{/* Hors de la zone : son clic ne doit pas remonter jusqu'à elle */}
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif"
				hidden
				onChange={(e) => {
					pick(e.target.files?.[0]);
					// Permet de rechoisir le même fichier après une erreur
					e.target.value = "";
				}}
			/>
			{onRemove && (
				<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={onRemove} disabled={busy}>
					<Trash2 size={14} /> Retirer l'image
				</button>
			)}
			{shownError && (
				<p className="ad-field-error ad-dropzone-error" role="alert">
					<AlertTriangle size={14} /> {shownError}
				</p>
			)}
		</div>
	);
};

export default CosmeticImageDropzone;
