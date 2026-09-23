import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ImageOff, Loader, Pencil, Plus, Trash2 } from "lucide-react";
import EditCosmeticModal from "@features/admin/components/EditCosmeticModal";
import { showToast } from "@shared/store/toast/toast.store";
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
import { KNOWN_ACCESSORY_MESH_NAMES, KNOWN_ANIMATION_CLIPS } from "@features/my-milo/utils/miloModel";
import {
	getAdminErrorMessage,
	useAddCosmetic,
	useAdminCosmetics,
	useDeleteCosmetic,
} from "@features/admin/store/admin.queries";

const MESH_OTHER = "__other__";

interface FormState {
	name: string;
	type: CosmeticType;
	price: string;
	rarity: CosmeticRarity;
	image_url: string;
	/** Valeur du sélecteur : un maillage connu, "" pour aucun, ou MESH_OTHER */
	meshChoice: string;
	/** Saisie libre quand meshChoice === MESH_OTHER */
	meshCustom: string;
}

const INITIAL_FORM: FormState = {
	name: "",
	type: "cosmetic_hat",
	price: "100",
	rarity: "commun",
	image_url: "",
	meshChoice: "",
	meshCustom: "",
};

const isValidUrl = (value: string) => {
	try {
		const url = new URL(value, window.location.origin);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

/** Aperçu de l'image d'un cosmétique, avec repli sur le pictogramme du type. */
const CosmeticThumb: React.FC<{ url: string | null; type: CosmeticType; size?: number }> = ({
	url,
	type,
	size = 40,
}) => {
	const [failed, setFailed] = useState(false);
	if (!url || failed) {
		return (
			<span className="ad-thumb ad-thumb--placeholder" style={{ width: size, height: size }} aria-hidden="true">
				{TYPE_ICONS[type] ?? "🎁"}
			</span>
		);
	}
	return (
		<img
			src={url}
			alt=""
			className="ad-thumb"
			style={{ width: size, height: size }}
			onError={() => setFailed(true)}
			draggable={false}
		/>
	);
};

const CosmeticsManager: React.FC = () => {
	const [form, setForm] = useState<FormState>(INITIAL_FORM);
	const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [previewFailed, setPreviewFailed] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<Cosmetic | null>(null);
	const [editing, setEditing] = useState<Cosmetic | null>(null);

	const { data: catalogue = [], isLoading, isError, error } = useAdminCosmetics();
	const addMutation = useAddCosmetic();
	const deleteMutation = useDeleteCosmetic();

	const isSkin = isSkinType(form.type);
	const isDance = form.type === "dance";
	/// Skin : nom du maillage à accrocher ; danse : nom du clip à jouer ; sticker : rien
	const usesMesh = isSkin || isDance;
	const meshName = !usesMesh
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
		if (usesMesh && form.meshChoice === MESH_OTHER) {
			if (!form.meshCustom.trim()) next.meshCustom = isDance ? "Indique le nom du clip." : "Indique le nom du maillage.";
			else if (form.meshCustom.trim().length > 100) next.meshCustom = "100 caractères maximum.";
		}
		if (isDance && !meshName) next.meshChoice = "Une danse doit référencer un clip d'animation.";
		if (form.type === "sticker" && !form.image_url.trim()) next.image_url = "Un sticker doit avoir une image.";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		setSubmitError(null);
		addMutation.mutate(
			{
				name: form.name.trim(),
				type: form.type,
				price: Number(form.price),
				rarity: form.rarity,
				image_url: form.image_url.trim() || null,
				mesh_name: meshName,
			},
			{
				onSuccess: (created) => {
					showToast(`« ${created.name} » ajouté au catalogue.`, "success");
					setForm({ ...INITIAL_FORM, type: form.type, rarity: form.rarity });
					setPreviewFailed(false);
				},
				onError: (err) => setSubmitError(getAdminErrorMessage(err)),
			},
		);
	};

	const handleDelete = () => {
		if (!confirmDelete) return;
		const target = confirmDelete;
		deleteMutation.mutate(target.id, {
			onSuccess: (result) => {
				showToast(
					result.deleted
						? `« ${target.name} » supprimé : personne ne le possédait.`
						: `« ${target.name} » retiré de la boutique. ${result.owners} joueur${result.owners > 1 ? "s" : ""} le garde${result.owners > 1 ? "nt" : ""}.`,
					"success",
				);
				setConfirmDelete(null);
			},
			onError: (err) => {
				showToast(getAdminErrorMessage(err), "error");
				setConfirmDelete(null);
			},
		});
	};

	const previewUrl = form.image_url.trim();
	const showPreview = previewUrl.length > 0 && isValidUrl(previewUrl);

	return (
		<div className="ad-cosmetics">
			{editing && <EditCosmeticModal cosmetic={editing} onClose={() => setEditing(null)} />}

			{/* Formulaire d'ajout */}
			<section className="ad-card">
				<h2 className="ad-subtitle">
					<Plus size={16} /> Ajouter un cosmétique
				</h2>
				<form className="ad-cosmetic-form" onSubmit={handleSubmit} noValidate>
					<div className="ad-cosmetic-fields">
						<label className="ad-field ad-field--grow">
							<span>Nom</span>
							<input
								type="text"
								value={form.name}
								maxLength={255}
								placeholder="Ex. Haut de forme"
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
									// Maillages et clips ne sont pas interchangeables : on repart de zéro
									update("meshChoice", "");
									update("meshCustom", "");
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
						{isDance && (
							<label className="ad-field">
								<span>Clip d'animation (mesh_name)</span>
								<select value={form.meshChoice} onChange={(e) => update("meshChoice", e.target.value)}>
									<option value="">Choisir un clip…</option>
									{KNOWN_ANIMATION_CLIPS.map((clip) => (
										<option key={clip} value={clip}>{clip}</option>
									))}
									<option value={MESH_OTHER}>Autre…</option>
								</select>
								{errors.meshChoice && <em className="ad-field-error">{errors.meshChoice}</em>}
							</label>
						)}
						{usesMesh && form.meshChoice === MESH_OTHER && (
							<label className="ad-field">
								<span>{isDance ? "Nom du clip" : "Nom du maillage"}</span>
								<input
									type="text"
									value={form.meshCustom}
									maxLength={100}
									placeholder={isDance ? "Nom exact du clip d'animation dans le .glb" : "Nom exact du nœud dans le .glb"}
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
					</div>

					{/* Prévisualisation de l'objet tel qu'il apparaîtra en boutique */}
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
							{isDance && <span className="ad-muted">Clip d'animation : {meshName ?? "à choisir"}</span>}
							{showPreview && previewFailed && (
								<span className="ad-field-error">L'image ne se charge pas à cette adresse.</span>
							)}
							{!previewUrl && <span className="ad-muted">Sans image, la boutique affiche le pictogramme du type.</span>}
						</div>
					</div>

					{submitError && (
						<p className="ad-alert ad-alert--error" role="alert">
							<AlertTriangle size={16} />
							<span>{submitError}</span>
						</p>
					)}

					<div className="ad-actions">
						<button type="submit" className="ad-btn ad-btn--primary" disabled={addMutation.isPending}>
							{addMutation.isPending ? <Loader size={16} className="ad-spin" /> : <Plus size={16} />}
							Ajouter au catalogue
						</button>
					</div>
				</form>
			</section>

			{/* Catalogue */}
			<section className="ad-card">
				<h2 className="ad-subtitle">Catalogue ({catalogue.length})</h2>
				{isLoading && <p className="ad-muted">Chargement du catalogue...</p>}
				{isError && catalogue.length === 0 && (
					<p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>
				)}
				{!isLoading && !isError && catalogue.length === 0 && (
					<p className="ad-muted">Le catalogue est vide. Ajoute un premier objet ci-dessus.</p>
				)}
				{catalogue.length > 0 && (
					<div className="ad-table-wrap ad-table-wrap--flat">
						<table className="ad-table">
							<thead>
								<tr>
									<th>Objet</th>
									<th>Type</th>
									<th>Rareté</th>
									<th>Prix</th>
									<th>Maillage</th>
									<th>Statut</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{catalogue.map((item) => (
									<tr key={item.id} className={item.is_active ? "" : "is-inactive"}>
										<td>
											<div className="ad-cosmetic-cell">
												<CosmeticThumb url={item.image_url} type={item.type} />
												<div>
													<strong>{item.name}</strong>
													<span className="ad-muted"> #{item.id}</span>
												</div>
											</div>
										</td>
										<td>{TYPE_LABELS[item.type] ?? item.type}</td>
										<td>{RARITY_LABELS[item.rarity] ?? item.rarity}</td>
										<td className="ad-nowrap">{item.price.toLocaleString("fr-FR")}</td>
										<td className="ad-muted">{item.mesh_name ?? "—"}</td>
										<td>
											{item.is_active ? (
												<span className="ad-chip ad-chip--ok"><CheckCircle2 size={12} /> En vente</span>
											) : (
												<span className="ad-chip ad-chip--off">Retiré</span>
											)}
										</td>
										<td className="ad-nowrap">
											<button
												type="button"
												className="ad-btn ad-btn--ghost ad-btn--sm"
												onClick={() => setEditing(item)}
												title="Modifier cet objet"
											>
												<Pencil size={14} /> Modifier
											</button>{" "}
											{confirmDelete?.id === item.id ? (
												<span className="ad-inline-confirm">
													<span>Confirmer ?</span>
													<button
														type="button"
														className="ad-btn ad-btn--danger ad-btn--sm"
														onClick={handleDelete}
														disabled={deleteMutation.isPending}
													>
														{deleteMutation.isPending ? <Loader size={14} className="ad-spin" /> : "Oui"}
													</button>
													<button
														type="button"
														className="ad-btn ad-btn--ghost ad-btn--sm"
														onClick={() => setConfirmDelete(null)}
														disabled={deleteMutation.isPending}
													>
														Non
													</button>
												</span>
											) : (
												<button
													type="button"
													className="ad-btn ad-btn--ghost ad-btn--sm"
													onClick={() => setConfirmDelete(item)}
													disabled={!item.is_active || deleteMutation.isPending}
													title={
														item.is_active
															? "Retirer de la boutique (supprimé si personne ne le possède)"
															: "Déjà retiré"
													}
												>
													<Trash2 size={14} /> Retirer
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
};

export default CosmeticsManager;
