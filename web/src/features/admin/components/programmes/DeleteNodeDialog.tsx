import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader, Trash2 } from "lucide-react";
import AdminDialog from "@features/admin/components/programmes/AdminDialog";
import { NODE_LABELS, type DeleteNodeResponse, type NodeType } from "@features/admin/store/programmes.model";
import { useDeleteNode } from "@features/admin/store/programmes.queries";
import { getProgrammeErrorMessage } from "@features/admin/utils/programmes.errors";
import { getErrorStatus } from "@shared/lib/aiRequests";

interface DeleteNodeDialogProps {
	type: NodeType;
	id: number;
	title: string;
	onClose: () => void;
}

type Step =
	| { kind: "confirm" }
	/** 409 : l'élément a des enfants. `detail` du serveur, affiché tel quel. */
	| { kind: "cascade"; detail: string }
	| { kind: "done"; result: DeleteNodeResponse };

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("fr-FR")} ${n > 1 ? many : one}`;

/** « 7 cours, 23 chapitres et 112 leçons » à partir de `cascaded`. */
const describeCascade = (cascaded: DeleteNodeResponse["cascaded"]) => {
	if (!cascaded) return null;
	const parts = [
		cascaded.courses ? plural(cascaded.courses, "cours", "cours") : null,
		cascaded.chapters ? plural(cascaded.chapters, "chapitre", "chapitres") : null,
		cascaded.lessons ? plural(cascaded.lessons, "leçon", "leçons") : null,
	].filter(Boolean) as string[];
	if (parts.length === 0) return null;
	return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
};

/**
 * Suppression d'un élément du catalogue. Jamais de cascade automatique : si le
 * serveur refuse (409, enfants présents), on affiche son message et il faut
 * retaper le titre exact, comme pour supprimer un dépôt GitHub. Irréversible.
 */
const DeleteNodeDialog: React.FC<DeleteNodeDialogProps> = ({ type, id, title, onClose }) => {
	const labels = NODE_LABELS[type];
	const [step, setStep] = useState<Step>({ kind: "confirm" });
	const [typedTitle, setTypedTitle] = useState("");
	const [error, setError] = useState<string | null>(null);
	const deleteNode = useDeleteNode();

	const run = (cascade: boolean) => {
		setError(null);
		deleteNode.mutate(
			{ type, id, cascade },
			{
				onSuccess: (result) => setStep({ kind: "done", result }),
				onError: (err) => {
					if (!cascade && getErrorStatus(err) === 409) {
						setStep({ kind: "cascade", detail: getProgrammeErrorMessage(err) });
						return;
					}
					setError(getProgrammeErrorMessage(err));
				},
			},
		);
	};

	const titleMatches = typedTitle === title;
	const cascadeSummary = step.kind === "done" ? describeCascade(step.result.cascaded) : null;

	return (
		<AdminDialog
			title={step.kind === "done" ? "Suppression effectuée" : `Supprimer ${labels.the}`}
			subtitle={title}
			icon={step.kind === "done" ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}
			onClose={onClose}
			dismissible={!deleteNode.isPending}
		>
			{step.kind === "confirm" && (
				<div className="ad-confirm" role="alertdialog" aria-label="Confirmer la suppression">
					<p>
						Supprimer {labels.the} « {title} » ? Cette action est irréversible : il n'y a pas de corbeille.
					</p>
					{error && <p className="ad-alert ad-alert--error"><AlertTriangle size={16} /><span>{error}</span></p>}
					<div className="ad-actions">
						<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={deleteNode.isPending}>
							Annuler
						</button>
						<button type="button" className="ad-btn ad-btn--danger" onClick={() => run(false)} disabled={deleteNode.isPending}>
							{deleteNode.isPending ? <Loader size={16} className="ad-spin" /> : <Trash2 size={16} />} Supprimer
						</button>
					</div>
				</div>
			)}

			{step.kind === "cascade" && (
				<div className="ad-confirm" role="alertdialog" aria-label="Confirmer la suppression en cascade">
					<p className="ad-cascade-detail">
						<AlertTriangle size={16} /> {step.detail}
					</p>
					<p>Tout son contenu sera supprimé définitivement. Les élèves perdront l'accès à ces leçons.</p>
					<label className="ad-field ad-field--grow">
						<span>Pour confirmer, tape le titre exact</span>
						<code className="ad-confirm-title">{title}</code>
						<input
							type="text"
							value={typedTitle}
							onChange={(e) => setTypedTitle(e.target.value)}
							autoComplete="off"
							spellCheck={false}
							disabled={deleteNode.isPending}
							autoFocus
						/>
					</label>
					{error && <p className="ad-alert ad-alert--error"><AlertTriangle size={16} /><span>{error}</span></p>}
					<div className="ad-actions">
						<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={deleteNode.isPending}>
							Annuler
						</button>
						<button
							type="button"
							className="ad-btn ad-btn--danger"
							onClick={() => run(true)}
							disabled={!titleMatches || deleteNode.isPending}
						>
							{deleteNode.isPending ? <Loader size={16} className="ad-spin" /> : <Trash2 size={16} />}
							Tout supprimer définitivement
						</button>
					</div>
				</div>
			)}

			{step.kind === "done" && (
				<>
					<p className="ad-alert ad-alert--success" role="status">
						<CheckCircle2 size={16} />
						<span>
							« {title} » a été supprimé{type === "subjects" || type === "lessons" ? "e" : ""}
							{cascadeSummary ? `, ainsi que ${cascadeSummary}.` : "."}
						</span>
					</p>
					<div className="ad-actions">
						<button type="button" className="ad-btn ad-btn--primary" onClick={onClose}>
							Fermer
						</button>
					</div>
				</>
			)}
		</AdminDialog>
	);
};

export default DeleteNodeDialog;
