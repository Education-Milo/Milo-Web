import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ImageOff, Loader, Pencil, X } from "lucide-react";
import {
	ALL_TYPES,
	RARITIES,
	RARITY_LABELS,
	TYPE_ICONS,
	TYPE_LABELS,
	isSkinType,
	type Cosmetic,
	type CosmeticRarity,
	type CosmeticType,
} from "@features/cosmetics/store/cosmetics.model";
import { KNOWN_ACCESSORY_MESH_NAMES } from "@features/my-milo/utils/miloModel";
import type { CosmeticUpdatePayload, UpdateCosmeticResponse } from "@features/admin/store/admin.model";
import { getAdminErrorMessage, useUpdateCosmetic } from "@features/admin/store/admin.queries";

const MESH_OTHER = "__other__";

interface EditCosmeticModalProps {
	cosmetic: Cosmetic;
	onClose: () => void;
}

interface FormState {
	name: string;
	type: CosmeticType;
	price: string;
	rarity: CosmeticRarity;
	image_url: string;
	meshChoice: string;
	meshCustom: string;
	is_active: boolean;
}

const isValidUrl = (value: string) => {
	try {
		const url = new URL(value, window.location.origin);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

const toForm = (c: Cosmetic): FormState => {
	const mesh = c.mesh_name ?? "";
	const known = mesh === "" || KNOWN_ACCESSORY_MESH_NAMES.includes(mesh);
	return {
		name: c.name,
		type: c.type,
		price: String(c.price),
		rarity: c.rarity,
		image_url: c.image_url ?? "",
		meshChoice: known ? mesh : MESH_OTHER,
		meshCustom: known ? "" : mesh,
		is_active: c.is_active,
	};
};

const EditCosmeticModal: React.FC<EditCosmeticModalProps> = ({ cosmetic, onClose }) => {
	const [form, setForm] = useState<FormState>(() => toForm(cosmetic));
	const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [previewFailed, setPreviewFailed] = useState(false);
	const [result, setResult] = useState<UpdateCosmeticResponse | null>(null);
	const updateMutation = useUpdateCosmetic();

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const isSkin = isSkinType(form.type);
	const meshName = !isSkin
		? null
		: form.meshChoice === MESH_OTHER
			? form.meshCustom.trim() || null
			: form.meshChoice || null;

	const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
		setForm((current) => ({ ...current, [key]: value }));
		setErrors((current) => ({ ...current, [key]: undefined }));
		setSubmitError(null);
		if (key === "image_url") setPreviewFailed(false);
	};

	/** Seuls les champs qui diffèrent de l'objet actuel partent au serveur. */
	const buildPayload = (): CosmeticUpdatePayload => {
		const payload: CosmeticUpdatePayload = {};
		const name = form.name.trim();
		if (name !== cosmetic.name) payload.name = name;
		if (form.type !== cosmetic.type) payload.type = form.type;
		const price = Number(form.price);
		if (price !== cosmetic.price) payload.price = price;
		if (form.rarity !== cosmetic.rarity) payload.rarity = form.rarity;
		const imageUrl = form.image_url.trim() || null;
		if (imageUrl !== (cosmetic.image_url ?? null)) payload.image_url = imageUrl;
		if (meshName !== (cosmetic.mesh_name ?? null)) payload.mesh_name = meshName;
		if (form.is_active !== cosmetic.is_active) payload.is_active = form.is_active;
		return payload;
	};

	const payload = buildPayload();
	const changedFields = Object.keys(payload);
	const typeWillChange = payload.type !== undefined;

	const validate = () => {
		const next: Partial<Record<keyof FormState, string>> = {};
		if (!form.name.trim()) next.name = "Le nom est requis.";
		else if (form.name.trim().length > 255) next.name = "255 caractères maximum.";
		const price = Number(form.price);
		if (form.price.trim() === "" || !Number.isInteger(price) || price < 0) {
			next.price = "Un nombre entier positif ou nul.";
		}
		if (form.image_url.trim() && !isValidUrl(form.image_url.trim())) {
			next.image_url = "Adresse invalide (http ou https).";
		} else if (form.image_url.trim().length > 500) {
			next.image_url = "500 caractères maximum.";
		}
		if (isSkin && form.meshChoice === MESH_OTHER) {
			if (!form.meshCustom.trim()) next.meshCustom = "Indique le nom du maillage.";
			else if (form.meshCustom.trim().length > 100) next.meshCustom = "100 caractères maximum.";
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		if (changedFields.length === 0) {
			setSubmitError("Aucune modification à enregistrer.");
			return;
		}
		setSubmitError(null);
		updateMutation.mutate(
			{ cosmeticId: cosmetic.id, payload },
			{
				onSuccess: (data) => setResult(data),
				onError: (err) => setSubmitError(getAdminErrorMessage(err)),
			},
		);
	};

	const previewUrl = form.image_url.trim();
	const showPreview = previewUrl.length > 0 && isValidUrl(previewUrl);

	return (
		<div className="ad-overlay" onClick={onClose} role="presentation">
			<div
				className="ad-modal ad-modal--wide"
				role="dialog"
				aria-modal="true"
				aria-labelledby="edit-cosmetic-title"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="ad-modal-header">
					<div className="ad-card-title-wrap">
						<div className="ad-card-icon"><Pencil size={18} /></div>
						<div>
							<h2 id="edit-cosmetic-title" className="ad-card-title">Modifier « {cosmetic.name} »</h2>
							<p className="ad-card-subtitle">#{cosmetic.id} · seuls les champs modifiés sont envoyés</p>
						</div>
					</div>
					<button type="button" className="ad-modal-close" onClick={onClose} aria-label="Fermer">
						<X size={18} />
					</button>
				</header>

				{result ? (
					/* Confirmation : la liste `changes` du serveur, lisible telle quelle */
					<div className="ad-modal-body">
						{result.updated ? (
							<>
								<p className="ad-alert ad-alert--success">
									<CheckCircle2 size={16} />
									<span>« {result.cosmetic.name} » mis à jour.</span>
								</p>
								<ul className="ad-changes">
									{result.changes.map((change) => (
										<li key={change}>{change}</li>
									))}
								</ul>
								{result.unequipped > 0 && (
									<p className="ad-alert ad-alert--info">
										<AlertTriangle size={16} />
										<span>
											L'objet a été retiré des tenues de {result.unequipped} joueur{result.unequipped > 1 ? "s" : ""} : ils devront le rééquiper depuis leur casier.
										</span>
									</p>
								)}
							</>
						) : (
							<p className="ad-alert ad-alert--info">
								<CheckCircle2 size={16} />
								<span>Aucun changement : les valeurs envoyées étaient déjà en place.</span>
							</p>
						)}
						<div className="ad-actions">
							<button type="button" className="ad-btn ad-btn--primary" onClick={onClose}>
								Fermer
							</button>
						</div>
					</div>
				) : (
					<form className="ad-modal-body" onSubmit={handleSubmit} noValidate>
						<div className="ad-cosmetic-fields">
							<label className="ad-field ad-field--grow">
								<span>Nom</span>
								<input
									type="text"
									value={form.name}
									maxLength={255}
									onChange={(e) => update("name", e.target.value)}
									required
								/>
								{errors.name && <em className="ad-field-error">{errors.name}</em>}
							</label>

							<label className="ad-field">
								<span>Type</span>
								<select
									value={form.type}
									onChange={(e) => {
										const type = e.target.value as CosmeticType;
										update("type", type);
										if (!isSkinType(type)) {
											update("meshChoice", "");
											update("meshCustom", "");
										}
									}}
								>
									{ALL_TYPES.map((t) => (
										<option key={t} value={t}>
											{TYPE_ICONS[t]} {TYPE_LABELS[t]} ({t})
										</option>
									))}
								</select>
							</label>

							<label className="ad-field">
								<span>Rareté</span>
								<select value={form.rarity} onChange={(e) => update("rarity", e.target.value as CosmeticRarity)}>
									{RARITIES.map((r) => (
										<option key={r} value={r}>{RARITY_LABELS[r]}</option>
									))}
								</select>
							</label>

							<label className="ad-field">
								<span>Prix (miloros)</span>
								<input
									type="number"
									inputMode="numeric"
									min={0}
									step={1}
									value={form.price}
									onChange={(e) => update("price", e.target.value)}
									required
								/>
								{errors.price && <em className="ad-field-error">{errors.price}</em>}
							</label>

							{isSkin && (
								<label className="ad-field">
									<span>Maillage 3D (mesh_name)</span>
									<select value={form.meshChoice} onChange={(e) => update("meshChoice", e.target.value)}>
										<option value="">Aucun (pas de rendu 3D)</option>
										{KNOWN_ACCESSORY_MESH_NAMES.map((mesh) => (
											<option key={mesh} value={mesh}>{mesh}</option>
										))}
										<option value={MESH_OTHER}>Autre…</option>
									</select>
								</label>
							)}
							{isSkin && form.meshChoice === MESH_OTHER && (
								<label className="ad-field">
									<span>Nom du maillage</span>
									<input
										type="text"
										value={form.meshCustom}
										maxLength={100}
										placeholder="Nom exact du nœud dans le .glb"
										onChange={(e) => update("meshCustom", e.target.value)}
									/>
									{errors.meshCustom && <em className="ad-field-error">{errors.meshCustom}</em>}
								</label>
							)}

							<label className="ad-field ad-field--grow">
								<span>Image (URL)</span>
								<input
									type="url"
									inputMode="url"
									value={form.image_url}
									maxLength={500}
									placeholder="https://…/image.png"
									onChange={(e) => update("image_url", e.target.value)}
								/>
								{errors.image_url && <em className="ad-field-error">{errors.image_url}</em>}
							</label>

							<label className="ad-switch">
								<input
									type="checkbox"
									checked={form.is_active}
									onChange={(e) => update("is_active", e.target.checked)}
								/>
								<span className="ad-switch-track" aria-hidden="true" />
								<span className="ad-switch-label">
									{form.is_active ? "En vente dans la boutique" : "Retiré de la boutique (les joueurs gardent l'objet)"}
								</span>
							</label>
						</div>

						<div className="ad-cosmetic-preview" aria-live="polite">
							<div className="ad-cosmetic-preview-frame">
								{showPreview && !previewFailed ? (
									<img
										src={previewUrl}
										alt="Prévisualisation"
										onError={() => setPreviewFailed(true)}
										draggable={false}
									/>
								) : (
									<span className="ad-cosmetic-preview-placeholder">
										{showPreview && previewFailed ? <ImageOff size={28} /> : TYPE_ICONS[form.type]}
									</span>
								)}
							</div>
							<div className="ad-cosmetic-preview-meta">
								<strong>{form.name.trim() || "Nom de l'objet"}</strong>
								<span>{TYPE_LABELS[form.type]} · {RARITY_LABELS[form.rarity]} · {Number(form.price) || 0} miloros</span>
								{isSkin && <span className="ad-muted">Maillage : {meshName ?? "aucun"}</span>}
								{showPreview && previewFailed && (
									<span className="ad-field-error">L'image ne se charge pas à cette adresse.</span>
								)}
								<span className="ad-muted">
									{changedFields.length === 0
										? "Aucune modification pour l'instant."
										: `${changedFields.length} champ${changedFields.length > 1 ? "s" : ""} modifié${changedFields.length > 1 ? "s" : ""} : ${changedFields.join(", ")}`}
								</span>
							</div>
						</div>

						{typeWillChange && (
							<p className="ad-alert ad-alert--info">
								<AlertTriangle size={16} />
								<span>Changer le type retire l'objet des tenues où il est équipé.</span>
							</p>
						)}

						{submitError && (
							<p className="ad-alert ad-alert--error" role="alert">
								<AlertTriangle size={16} />
								<span>{submitError}</span>
							</p>
						)}

						<div className="ad-actions">
							<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={updateMutation.isPending}>
								Annuler
							</button>
							<button
								type="submit"
								className="ad-btn ad-btn--primary"
								disabled={updateMutation.isPending || changedFields.length === 0}
							>
								{updateMutation.isPending ? <Loader size={16} className="ad-spin" /> : <Pencil size={16} />}
								Enregistrer
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default EditCosmeticModal;
