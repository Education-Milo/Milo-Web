import React, { useMemo, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Loader, Pencil, Plus } from "lucide-react";
import { showToast } from "@shared/store/toast/toast.store";
import AdminDialog from "@features/admin/components/programmes/AdminDialog";
import ListEditor from "@features/admin/components/programmes/ListEditor";
import {
	LEVELS,
	LEVEL_LABELS,
	NODE_LABELS,
	PARENT_FIELD,
	PROGRAMME_LIMITS,
	type Catalogue,
	type Level,
	type NodeType,
} from "@features/admin/store/programmes.model";
import { useCreateNode, useUpdateNode } from "@features/admin/store/programmes.queries";
import { getProgrammeErrorMessage } from "@features/admin/utils/programmes.errors";

/** Nœud tel qu'il arrive de GET /admin/catalogue (champs selon le type) */
export interface EditableNode {
	id: number;
	title: string;
	level?: string;
	cycle?: string | number | null;
	description?: string | null;
	context_info?: string | null;
	boundaries?: string | null;
	learning_objectives?: string[] | null;
	success_criteria?: string[] | null;
}

export type NodeFormTarget =
	| { kind: "create"; type: NodeType; parentId: number | null }
	| { kind: "edit"; type: NodeType; node: EditableNode; parentId: number | null };

interface FormState {
	title: string;
	level: Level;
	cycle: string;
	description: string;
	context_info: string;
	boundaries: string;
	learning_objectives: string[];
	success_criteria: string[];
	parentId: number | null;
}

const defaultCycle = (level: string) => (level === "6eme" ? "3" : "4");

/** Cycle renvoyé dans le format déjà utilisé par le catalogue (nombre ou texte). */
const toCycleValue = (value: string, sample: string | number | null | undefined) => {
	if (typeof sample === "string") return /^\d+$/.test(sample) ? value : sample.replace(/\d+/, value);
	return Number(value);
};

const initialState = (target: NodeFormTarget): FormState => {
	const node = target.kind === "edit" ? target.node : undefined;
	const level = (LEVELS as readonly string[]).includes(node?.level ?? "") ? (node?.level as Level) : "6eme";
	return {
		title: node?.title ?? "",
		level,
		cycle: node?.cycle != null ? String(node.cycle).match(/\d+/)?.[0] ?? defaultCycle(level) : defaultCycle(level),
		description: node?.description ?? "",
		context_info: node?.context_info ?? "",
		boundaries: node?.boundaries ?? "",
		learning_objectives: node?.learning_objectives ?? [],
		success_criteria: node?.success_criteria ?? [],
		parentId: target.parentId,
	};
};

/** Options de parent avec leur chemin complet, pour un déplacement lisible. */
const parentOptions = (catalogue: Catalogue, type: NodeType): { id: number; label: string }[] => {
	const options: { id: number; label: string }[] = [];
	for (const subject of catalogue.subjects) {
		const subjectLabel = `${subject.title} (${LEVEL_LABELS[subject.level as Level] ?? subject.level})`;
		if (type === "courses") options.push({ id: subject.id, label: subjectLabel });
		for (const course of subject.courses) {
			if (type === "chapters") options.push({ id: course.id, label: `${subjectLabel} › ${course.title}` });
			for (const chapter of course.chapters) {
				if (type === "lessons") {
					options.push({ id: chapter.id, label: `${subjectLabel} › ${course.title} › ${chapter.title}` });
				}
			}
		}
	}
	return options;
};

/** Champs envoyés pour ce type, au format attendu par l'API. */
const bodyFor = (type: NodeType, form: FormState, cycleSample: string | number | null | undefined) => {
	const title = form.title.trim();
	switch (type) {
		case "subjects":
			return { title, level: form.level, cycle: toCycleValue(form.cycle, cycleSample) };
		case "courses":
			return { subject_id: form.parentId, title, description: form.description };
		case "chapters":
			return { course_id: form.parentId, title, context_info: form.context_info };
		case "lessons":
			return {
				chapter_id: form.parentId,
				title,
				learning_objectives: form.learning_objectives.map((o) => o.trim()).filter(Boolean),
				boundaries: form.boundaries,
				success_criteria: form.success_criteria.map((c) => c.trim()).filter(Boolean),
			};
	}
};

interface NodeFormDialogProps {
	target: NodeFormTarget;
	catalogue: Catalogue;
	onClose: () => void;
}

const NodeFormDialog: React.FC<NodeFormDialogProps> = ({ target, catalogue, onClose }) => {
	const { type } = target;
	const labels = NODE_LABELS[type];
	const parentField = PARENT_FIELD[type];
	const [form, setForm] = useState<FormState>(() => initialState(target));
	const [error, setError] = useState<string | null>(null);
	const [confirmMove, setConfirmMove] = useState(false);
	const createNode = useCreateNode();
	const updateNode = useUpdateNode();
	const isPending = createNode.isPending || updateNode.isPending;

	const cycleSample = catalogue.subjects.find((s) => s.cycle != null)?.cycle;
	const options = useMemo(() => (parentField ? parentOptions(catalogue, type) : []), [catalogue, type, parentField]);
	const original = useMemo(() => bodyFor(type, initialState(target), cycleSample), [type, target, cycleSample]);
	const body = bodyFor(type, form, cycleSample);

	// Uniquement les champs réellement modifiés : un champ omis est conservé côté serveur
	const changes = useMemo(() => {
		const diff: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(body)) {
			if (JSON.stringify(value) !== JSON.stringify((original as Record<string, unknown>)[key])) diff[key] = value;
		}
		return diff;
	}, [body, original]);

	const isMove = target.kind === "edit" && parentField !== null && parentField in changes;
	const titleError = !form.title.trim() ? "Le titre est obligatoire." : null;
	const canSubmit =
		!titleError &&
		(!parentField || form.parentId !== null) &&
		(target.kind === "create" || Object.keys(changes).length > 0) &&
		!isPending;

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setError(null);
		setConfirmMove(false);
	};

	const submit = () => {
		setError(null);
		const onError = (err: unknown) => setError(getProgrammeErrorMessage(err));
		if (target.kind === "create") {
			createNode.mutate(
				{ type, body },
				{
					onSuccess: () => {
						showToast(`${labels.one.charAt(0).toUpperCase()}${labels.one.slice(1)} « ${form.title.trim()} » ajouté${type === "subjects" || type === "lessons" ? "e" : ""}.`, "success");
						onClose();
					},
					onError,
				},
			);
			return;
		}
		updateNode.mutate(
			{ type, id: target.node.id, changes },
			{
				onSuccess: () => {
					showToast(isMove ? `« ${form.title.trim()} » a été déplacé.` : "Modifications enregistrées.", "success");
					onClose();
				},
				onError,
			},
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		// Changer de parent déplace l'élément : confirmation explicite
		if (isMove && !confirmMove) {
			setConfirmMove(true);
			return;
		}
		submit();
	};

	const currentParentLabel = options.find((o) => o.id === target.parentId)?.label;
	const newParentLabel = options.find((o) => o.id === form.parentId)?.label;

	return (
		<AdminDialog
			title={target.kind === "create" ? `Ajouter ${labels.a}` : `Modifier ${labels.the}`}
			subtitle={target.kind === "edit" ? target.node.title : undefined}
			icon={target.kind === "create" ? <Plus size={18} /> : <Pencil size={18} />}
			onClose={onClose}
			dismissible={!isPending}
			wide={type === "lessons"}
		>
			<form className="ad-form" onSubmit={handleSubmit} noValidate>
				{parentField && (
					<label className="ad-field ad-field--grow">
						<span>{type === "courses" ? "Matière" : type === "chapters" ? "Cours" : "Chapitre"}</span>
						<select
							value={form.parentId ?? ""}
							onChange={(e) => set("parentId", e.target.value ? Number(e.target.value) : null)}
							disabled={isPending}
						>
							<option value="">Choisir...</option>
							{options.map((o) => (
								<option key={o.id} value={o.id}>{o.label}</option>
							))}
						</select>
						{target.kind === "edit" && (
							<em className="ad-field-hint">
								Changer ce champ déplace l'élément{type !== "lessons" ? ", avec tout son contenu" : ""}.
							</em>
						)}
					</label>
				)}

				<label className="ad-field ad-field--grow">
					<span>Titre</span>
					<input
						type="text"
						value={form.title}
						maxLength={PROGRAMME_LIMITS.TITLE}
						onChange={(e) => set("title", e.target.value)}
						disabled={isPending}
						autoFocus
					/>
				</label>

				{type === "subjects" && (
					<div className="ad-role-fields">
						<label className="ad-field">
							<span>Niveau</span>
							<select
								value={form.level}
								onChange={(e) => {
									const level = e.target.value as Level;
									setForm((prev) => ({ ...prev, level, cycle: defaultCycle(level) }));
								}}
								disabled={isPending}
							>
								{LEVELS.map((l) => (
									<option key={l} value={l}>{LEVEL_LABELS[l]}</option>
								))}
							</select>
						</label>
						<label className="ad-field">
							<span>Cycle</span>
							<select value={form.cycle} onChange={(e) => set("cycle", e.target.value)} disabled={isPending}>
								<option value="3">Cycle 3</option>
								<option value="4">Cycle 4</option>
							</select>
						</label>
					</div>
				)}

				{type === "courses" && (
					<label className="ad-field ad-field--grow">
						<span>Description</span>
						<textarea
							value={form.description}
							maxLength={PROGRAMME_LIMITS.TEXT}
							rows={4}
							onChange={(e) => set("description", e.target.value)}
							disabled={isPending}
						/>
					</label>
				)}

				{type === "chapters" && (
					<label className="ad-field ad-field--grow">
						<span>Contexte pour Milo</span>
						<textarea
							value={form.context_info}
							maxLength={PROGRAMME_LIMITS.TEXT}
							rows={4}
							onChange={(e) => set("context_info", e.target.value)}
							disabled={isPending}
						/>
					</label>
				)}

				{type === "lessons" && (
					<>
						<ListEditor
							label="Objectifs d'apprentissage"
							items={form.learning_objectives}
							onChange={(items) => set("learning_objectives", items)}
							maxLength={PROGRAMME_LIMITS.TEXT}
							placeholder="Ex. Savoir additionner deux fractions de même dénominateur"
							disabled={isPending}
						/>
						<label className="ad-field ad-field--grow">
							<span>Limites (ce qui n'est pas au programme)</span>
							<textarea
								value={form.boundaries}
								maxLength={PROGRAMME_LIMITS.TEXT}
								rows={3}
								onChange={(e) => set("boundaries", e.target.value)}
								disabled={isPending}
							/>
						</label>
						<ListEditor
							label="Critères de réussite"
							items={form.success_criteria}
							onChange={(items) => set("success_criteria", items)}
							maxLength={PROGRAMME_LIMITS.TEXT}
							placeholder="Ex. L'élève simplifie le résultat"
							disabled={isPending}
						/>
					</>
				)}

				{confirmMove && (
					<div className="ad-confirm" role="alertdialog" aria-label="Confirmer le déplacement">
						<p>
							<ArrowRightLeft size={16} /> Déplacer « {form.title.trim()} » de <strong>{currentParentLabel ?? "son parent actuel"}</strong> vers{" "}
							<strong>{newParentLabel}</strong> ?{type !== "lessons" && " Tout son contenu suit."}
						</p>
					</div>
				)}

				{error && (
					<p className="ad-alert ad-alert--error" role="alert">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				<div className="ad-actions">
					<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={isPending}>
						Annuler
					</button>
					<button type="submit" className={`ad-btn ${confirmMove ? "ad-btn--danger" : "ad-btn--primary"}`} disabled={!canSubmit}>
						{isPending && <Loader size={16} className="ad-spin" />}
						{target.kind === "create" ? "Ajouter" : confirmMove ? "Confirmer le déplacement" : "Enregistrer"}
					</button>
				</div>
			</form>
		</AdminDialog>
	);
};

export default NodeFormDialog;
