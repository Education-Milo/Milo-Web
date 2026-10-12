import React, { useState } from "react";
import { AlertTriangle, BookOpen, CloudOff, FileText, Loader, Plus, RefreshCw, Replace, Trash2 } from "lucide-react";
import { showToast } from "@shared/store/toast/toast.store";
import { getErrorStatus } from "@shared/lib/aiRequests";
import AdminDialog from "@features/admin/components/programmes/AdminDialog";
import { PROGRAMME_LIMITS } from "@features/admin/store/programmes.model";
import {
	useCreateRagDocument,
	useDeleteRagDocument,
	useIngestRagPdf,
	useRagDocuments,
	useReplaceRagDocument,
} from "@features/admin/store/programmes.queries";
import { QDRANT_DOWN_MESSAGE, getProgrammeErrorMessage } from "@features/admin/utils/programmes.errors";

const fmt = (n: number) => n.toLocaleString("fr-FR");

type Dialog =
	| { kind: "add" }
	| { kind: "replace"; filename: string }
	| { kind: "delete"; filename: string; chunks: number }
	| { kind: "pdf" }
	| null;

/** Ajout (POST) ou remplacement (PUT) d'un texte indexé. */
const TextDocumentDialog: React.FC<{ replaceName?: string; onClose: () => void }> = ({ replaceName, onClose }) => {
	const isReplace = Boolean(replaceName);
	const [filename, setFilename] = useState(replaceName ?? "");
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const create = useCreateRagDocument();
	const replace = useReplaceRagDocument();
	const mutation = isReplace ? replace : create;

	const canSubmit = filename.trim().length > 0 && text.trim().length > 0 && !mutation.isPending;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setError(null);
		// PUT : le nom dans l'URL et dans le corps doivent être identiques
		mutation.mutate(
			{ filename: filename.trim(), text },
			{
				onSuccess: () => {
					showToast(isReplace ? `« ${filename.trim()} » a été réindexé.` : `« ${filename.trim()} » a été ajouté à la base.`, "success");
					onClose();
				},
				onError: (err) => {
					// 409 à l'ajout : le nom existe, le message du serveur renvoie vers le remplacement
					setError(getProgrammeErrorMessage(err));
				},
			},
		);
	};

	return (
		<AdminDialog
			title={isReplace ? "Remplacer le document" : "Ajouter un document"}
			subtitle={isReplace ? replaceName : "Texte collé, découpé puis indexé"}
			icon={isReplace ? <Replace size={18} /> : <Plus size={18} />}
			onClose={onClose}
			dismissible={!mutation.isPending}
			wide
		>
			<form className="ad-form" onSubmit={handleSubmit} noValidate>
				{isReplace && (
					<p className="ad-alert ad-alert--info">
						<RefreshCw size={16} />
						<span>
							Un index ne se modifie pas en place : le texte ci-dessous remplace entièrement l'ancien. Les anciens fragments sont retirés puis
							tout est réindexé, ce qui peut prendre un moment pour un gros document.
						</span>
					</p>
				)}
				<label className="ad-field ad-field--grow">
					<span>Nom du document</span>
					<input
						type="text"
						value={filename}
						maxLength={PROGRAMME_LIMITS.RAG_FILENAME}
						onChange={(e) => setFilename(e.target.value)}
						disabled={isReplace || mutation.isPending}
						placeholder="Ex. programme-cycle4-sciences.txt"
						autoFocus={!isReplace}
					/>
				</label>
				<label className="ad-field ad-field--grow">
					<span>Texte</span>
					<textarea
						className="ad-json-editor ad-rag-text"
						value={text}
						maxLength={PROGRAMME_LIMITS.RAG_TEXT}
						onChange={(e) => setText(e.target.value)}
						rows={14}
						disabled={mutation.isPending}
						autoFocus={isReplace}
						placeholder="Colle ici le texte à rendre disponible pour les réponses de Milo."
					/>
					<em className="ad-field-hint">
						{fmt(text.length)} / {fmt(PROGRAMME_LIMITS.RAG_TEXT)} caractères
					</em>
				</label>
				{error && <p className="ad-alert ad-alert--error" role="alert"><AlertTriangle size={16} /><span>{error}</span></p>}
				<div className="ad-actions">
					<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={mutation.isPending}>
						Annuler
					</button>
					<button type="submit" className="ad-btn ad-btn--primary" disabled={!canSubmit}>
						{mutation.isPending && <Loader size={16} className="ad-spin" />}
						{mutation.isPending ? "Indexation en cours..." : isReplace ? "Remplacer et réindexer" : "Indexer"}
					</button>
				</div>
			</form>
		</AdminDialog>
	);
};

/** POST /add_programme_to_rag : ingestion d'un PDF distant. */
const PdfDocumentDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
	const [url, setUrl] = useState("");
	const [filename, setFilename] = useState("");
	const [error, setError] = useState<string | null>(null);
	const ingest = useIngestRagPdf();
	const isHttps = /^https:\/\/\S+$/i.test(url.trim());

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!isHttps || !filename.trim() || ingest.isPending) return;
		setError(null);
		ingest.mutate(
			{ url: url.trim(), filename: filename.trim() },
			{
				onSuccess: () => {
					showToast(`« ${filename.trim()} » a été ajouté à la base.`, "success");
					onClose();
				},
				onError: (err) => setError(getProgrammeErrorMessage(err)),
			},
		);
	};

	return (
		<AdminDialog title="Ajouter un PDF distant" subtitle="Téléchargé, découpé puis indexé par le serveur" icon={<FileText size={18} />} onClose={onClose} dismissible={!ingest.isPending}>
			<form className="ad-form" onSubmit={handleSubmit} noValidate>
				<label className="ad-field ad-field--grow">
					<span>Adresse du PDF (HTTPS, public)</span>
					<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} disabled={ingest.isPending} placeholder="https://eduscol.education.fr/..." autoFocus />
					{url.trim() && !isHttps && <em className="ad-field-error">L'adresse doit commencer par https://</em>}
				</label>
				<label className="ad-field ad-field--grow">
					<span>Nom du document</span>
					<input type="text" value={filename} maxLength={PROGRAMME_LIMITS.RAG_FILENAME} onChange={(e) => setFilename(e.target.value)} disabled={ingest.isPending} />
				</label>
				{error && <p className="ad-alert ad-alert--error" role="alert"><AlertTriangle size={16} /><span>{error}</span></p>}
				<div className="ad-actions">
					<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={ingest.isPending}>
						Annuler
					</button>
					<button type="submit" className="ad-btn ad-btn--primary" disabled={!isHttps || !filename.trim() || ingest.isPending}>
						{ingest.isPending && <Loader size={16} className="ad-spin" />}
						{ingest.isPending ? "Indexation en cours..." : "Ajouter"}
					</button>
				</div>
			</form>
		</AdminDialog>
	);
};

const DeleteDocumentDialog: React.FC<{ filename: string; chunks: number; onClose: () => void }> = ({ filename, chunks, onClose }) => {
	const [error, setError] = useState<string | null>(null);
	const remove = useDeleteRagDocument();
	return (
		<AdminDialog title="Retirer le document" subtitle={filename} icon={<Trash2 size={18} />} onClose={onClose} dismissible={!remove.isPending}>
			<div className="ad-confirm" role="alertdialog" aria-label="Confirmer le retrait">
				<p>
					Retirer « {filename} » et ses {fmt(chunks)} fragments de la base ? Milo ne s'en servira plus pour répondre aux élèves.
				</p>
				{error && <p className="ad-alert ad-alert--error"><AlertTriangle size={16} /><span>{error}</span></p>}
				<div className="ad-actions">
					<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={remove.isPending}>
						Annuler
					</button>
					<button
						type="button"
						className="ad-btn ad-btn--danger"
						disabled={remove.isPending}
						onClick={() =>
							remove.mutate(filename, {
								onSuccess: () => {
									showToast(`« ${filename} » a été retiré de la base.`, "success");
									onClose();
								},
								onError: (err) => setError(getProgrammeErrorMessage(err)),
							})
						}
					>
						{remove.isPending ? <Loader size={16} className="ad-spin" /> : <Trash2 size={16} />} Retirer
					</button>
				</div>
			</div>
		</AdminDialog>
	);
};

/**
 * Base de connaissances (RAG) : partagée par tous les élèves, elle alimente
 * les réponses de Milo. Ce n'est pas un dossier de fichiers.
 */
const RagDocuments: React.FC = () => {
	const { data, isLoading, isError, error, isFetching, refetch } = useRagDocuments();
	const [dialog, setDialog] = useState<Dialog>(null);
	const isDown = isError && getErrorStatus(error) === 503;

	return (
		<section className="ad-card">
			<div className="ad-toolbar ad-toolbar--between">
				<div className="ad-card-title-wrap">
					<div className="ad-card-icon"><BookOpen size={18} /></div>
					<div>
						<h2 className="ad-card-title">Base de connaissances de Milo</h2>
						<p className="ad-card-subtitle">
							Partagée par tous les élèves : chaque document ajouté ici nourrit les réponses de Milo pour tout le monde.
						</p>
					</div>
				</div>
				<div className="ad-toolbar">
					<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => setDialog({ kind: "pdf" })} disabled={isDown}>
						<FileText size={14} /> PDF distant
					</button>
					<button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={() => setDialog({ kind: "add" })} disabled={isDown}>
						<Plus size={14} /> Texte
					</button>
				</div>
			</div>

			{isLoading && <p className="ad-muted">Chargement de la base...</p>}

			{/* 503 : service de recherche injoignable, pas une requête invalide. Pas de réessai automatique. */}
			{isDown && (
				<div className="ad-alert ad-alert--error" role="alert">
					<CloudOff size={16} />
					<span>{QDRANT_DOWN_MESSAGE}</span>
					<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => void refetch()} disabled={isFetching}>
						Réessayer
					</button>
				</div>
			)}
			{isError && !isDown && <p className="ad-alert ad-alert--error">{getProgrammeErrorMessage(error)}</p>}

			{data && (
				<>
					<p className="ad-muted">
						Collection <code className="ad-code">{data.collection}</code> · {fmt(data.documents.length)} document
						{data.documents.length > 1 ? "s" : ""} · {fmt(data.total_chunks)} fragments indexés au total
					</p>
					{data.documents.length === 0 ? (
						<p className="ad-empty-state">La base est vide : Milo répond sans document de référence.</p>
					) : (
						<div className={`ad-table-wrap ad-table-wrap--flat ${isFetching ? "is-fetching" : ""}`}>
							<table className="ad-table">
								<thead>
									<tr>
										<th>Document</th>
										<th>Fragments indexés</th>
										<th aria-label="Actions" />
									</tr>
								</thead>
								<tbody>
									{data.documents.map((doc) => (
										<tr key={doc.filename}>
											<td><strong>{doc.filename}</strong></td>
											<td className="ad-nowrap">{fmt(doc.chunks)}</td>
											<td className="ad-nowrap ad-table-actions">
												<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => setDialog({ kind: "replace", filename: doc.filename })}>
													<Replace size={13} /> Remplacer
												</button>
												<button
													type="button"
													className="ad-icon-btn ad-icon-btn--danger"
													aria-label={`Retirer ${doc.filename}`}
													title="Retirer"
													onClick={() => setDialog({ kind: "delete", filename: doc.filename, chunks: doc.chunks })}
												>
													<Trash2 size={14} />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}

			{dialog?.kind === "add" && <TextDocumentDialog onClose={() => setDialog(null)} />}
			{dialog?.kind === "replace" && <TextDocumentDialog replaceName={dialog.filename} onClose={() => setDialog(null)} />}
			{dialog?.kind === "pdf" && <PdfDocumentDialog onClose={() => setDialog(null)} />}
			{dialog?.kind === "delete" && <DeleteDocumentDialog filename={dialog.filename} chunks={dialog.chunks} onClose={() => setDialog(null)} />}
		</section>
	);
};

export default RagDocuments;
