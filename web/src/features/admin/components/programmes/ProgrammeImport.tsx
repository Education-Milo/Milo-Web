import React, { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, FileText, Info, Loader, Play, RotateCcw, Upload } from "lucide-react";
import type { ImportMode, ImportResponse, ReportCounts } from "@features/admin/store/programmes.model";
import { useImportProgramme, type ImportRequest } from "@features/admin/store/programmes.queries";
import { getProgrammeErrorMessage } from "@features/admin/utils/programmes.errors";
import { getErrorStatus } from "@shared/lib/aiRequests";

type Source = "pdf" | "json";

const MODES: { value: ImportMode; label: string; help: string }[] = [
	{
		value: "update",
		label: "Mettre à jour",
		help: "Met à jour les éléments existants dont le contenu a changé. C'est ce qu'il faut pour suivre une révision de programme.",
	},
	{
		value: "add_only",
		label: "Ajouter seulement",
		help: "N'ajoute que ce qui manque, ne touche à rien d'existant.",
	},
];

/** [singulier, pluriel, féminin] pour accorder « créée(s) / créé(s) » */
const LEVEL_WORDS: Record<"subjects" | "courses" | "chapters" | "lessons", [string, string, boolean]> = {
	subjects: ["matière", "matières", true],
	courses: ["cours", "cours", false],
	chapters: ["chapitre", "chapitres", false],
	lessons: ["leçon", "leçons", true],
};

/** « 12 leçons seront créées, 3 modifiées, 48 inchangées » (ou au passé après application). */
const describeCounts = (key: keyof typeof LEVEL_WORDS, counts: ReportCounts, future: boolean) => {
	const [one, many, feminine] = LEVEL_WORDS[key];
	const fmt = (n: number) => n.toLocaleString("fr-FR");
	const agree = (word: string, n: number) => `${word}${feminine ? "e" : ""}${n > 1 ? "s" : ""}`;
	const noun = counts.created > 1 ? many : one;
	const verb = future ? (counts.created > 1 ? "seront " : "sera ") : "";
	return `${fmt(counts.created)} ${noun} ${verb}${agree("créé", counts.created)}, ${fmt(counts.updated)} ${agree("modifié", counts.updated)}, ${fmt(counts.unchanged)} ${agree("inchangé", counts.unchanged)}`;
};

const ImportReport: React.FC<{ result: ImportResponse; future: boolean }> = ({ result, future }) => (
	<ul className="ad-import-report">
		{(Object.keys(LEVEL_WORDS) as (keyof typeof LEVEL_WORDS)[]).map((key) => {
			const counts = result.report[key];
			if (!counts) return null;
			return (
				<li key={key}>
					<strong>{LEVEL_WORDS[key][1].charAt(0).toUpperCase() + LEVEL_WORDS[key][1].slice(1)}</strong>
					<span>{describeCounts(key, counts, future)}</span>
				</li>
			);
		})}
	</ul>
);

const downloadJson = (text: string, name: string) => {
	const blob = new Blob([text], { type: "application/json;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

const parseJson = (text: string): { ok: true; value: unknown } | { ok: false; error: string } => {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : "JSON invalide" };
	}
};

/**
 * Import d'un programme. Le parcours passe toujours par une simulation
 * (dry_run) : rapport, relecture du JSON, puis « Appliquer ».
 */
const ProgrammeImport: React.FC = () => {
	const [source, setSource] = useState<Source>("pdf");
	const [mode, setMode] = useState<ImportMode>("update");
	const [url, setUrl] = useState("");
	const [filename, setFilename] = useState("");
	const [jsonText, setJsonText] = useState("");
	const [jsonName, setJsonName] = useState("programme.json");
	/** JSON exact couvert par la dernière simulation (null : rien de simulé) */
	const [simulatedJson, setSimulatedJson] = useState<string | null>(null);
	const [simulatedMode, setSimulatedMode] = useState<ImportMode | null>(null);
	const [preview, setPreview] = useState<ImportResponse | null>(null);
	const [applied, setApplied] = useState<ImportResponse | null>(null);
	const [error, setError] = useState<{ message: string; pdfFailed: boolean } | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const importProgramme = useImportProgramme();

	const parsed = jsonText.trim() ? parseJson(jsonText) : null;
	const isHttps = /^https:\/\/\S+$/i.test(url.trim());
	// La simulation n'est valable que pour le JSON et le mode qu'elle a vus
	const previewIsCurrent = preview !== null && simulatedJson === jsonText && simulatedMode === mode;

	const reset = () => {
		setPreview(null);
		setApplied(null);
		setSimulatedJson(null);
		setSimulatedMode(null);
		setError(null);
	};

	const run = (request: ImportRequest, onDone: (result: ImportResponse) => void) => {
		setError(null);
		importProgramme.mutate(request, {
			onSuccess: onDone,
			onError: (err) =>
				setError({ message: getProgrammeErrorMessage(err), pdfFailed: request.source === "pdf" && getErrorStatus(err) === 502 }),
		});
	};

	/** 1re étape depuis un PDF : extraction + simulation. Le JSON extrait devient relisible. */
	const simulatePdf = () => {
		run({ source: "pdf", url: url.trim(), filename: filename.trim(), mode, dryRun: true }, (result) => {
			const text = JSON.stringify(result.programme ?? {}, null, 2);
			setJsonText(text);
			setJsonName(`${filename.trim().replace(/\.pdf$/i, "") || "programme"}.json`);
			setSimulatedJson(text);
			setSimulatedMode(mode);
			setPreview(result);
			setApplied(null);
		});
	};

	/** Simulation d'un JSON (fichier déposé, ou JSON extrait puis corrigé). */
	const simulateJson = () => {
		if (!parsed?.ok) return;
		const snapshot = jsonText;
		run({ source: "json", programme: parsed.value, mode, dryRun: true }, (result) => {
			setSimulatedJson(snapshot);
			setSimulatedMode(mode);
			setPreview(result);
			setApplied(null);
		});
	};

	/**
	 * Applique exactement le JSON relu et simulé, via /admin/programmes/import.
	 * Même depuis un PDF : relancer l'extraction pourrait produire un autre
	 * résultat que celui relu.
	 */
	const apply = () => {
		if (!previewIsCurrent || !parsed?.ok) return;
		run({ source: "json", programme: parsed.value, mode, dryRun: false }, (result) => setApplied(result));
	};

	const handleFile = (file: File | undefined) => {
		if (!file) return;
		reset();
		setJsonName(file.name);
		const reader = new FileReader();
		reader.onload = () => setJsonText(String(reader.result ?? ""));
		reader.readAsText(file);
	};

	const busy = importProgramme.isPending;
	const showEditor = source === "json" || preview !== null;

	return (
		<div className="ad-import">
			<p className="ad-alert ad-alert--info">
				<Info size={16} />
				<span>
					<strong>Un import ne supprime jamais rien.</strong> Une leçon retirée du nouveau programme reste en base : supprime-la à la main
					dans l'onglet Catalogue.
				</span>
			</p>

			<div className="ad-segmented" role="tablist" aria-label="Source du programme">
				<button
					type="button"
					role="tab"
					aria-selected={source === "pdf"}
					className={`ad-segmented-btn ${source === "pdf" ? "active" : ""}`}
					onClick={() => {
						setSource("pdf");
						reset();
						setJsonText("");
					}}
					disabled={busy}
				>
					<FileText size={14} /> Depuis un PDF officiel
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={source === "json"}
					className={`ad-segmented-btn ${source === "json" ? "active" : ""}`}
					onClick={() => {
						setSource("json");
						reset();
						setJsonText("");
					}}
					disabled={busy}
				>
					<FileJson size={14} /> Depuis un fichier JSON
				</button>
			</div>

			<fieldset className="ad-modes">
				<legend className="ad-field-label">Mode d'import</legend>
				{MODES.map((m) => (
					<label key={m.value} className={`ad-mode ${mode === m.value ? "is-selected" : ""}`}>
						<input type="radio" name="import-mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} disabled={busy} />
						<span>
							<strong>{m.label}</strong>
							<small>{m.help}</small>
						</span>
					</label>
				))}
			</fieldset>

			{source === "pdf" && (
				<div className="ad-role-fields">
					<label className="ad-field ad-field--grow">
						<span>Adresse du PDF (HTTPS, public)</span>
						<input
							type="url"
							value={url}
							placeholder="https://eduscol.education.fr/.../programme.pdf"
							onChange={(e) => {
								setUrl(e.target.value);
								reset();
							}}
							disabled={busy}
						/>
						{url.trim() && !isHttps && <em className="ad-field-error">L'adresse doit commencer par https://</em>}
					</label>
					<label className="ad-field">
						<span>Nom du fichier</span>
						<input
							type="text"
							value={filename}
							maxLength={255}
							placeholder="programme-cycle4-maths.pdf"
							onChange={(e) => {
								setFilename(e.target.value);
								reset();
							}}
							disabled={busy}
						/>
					</label>
				</div>
			)}

			{source === "json" && (
				<div className="ad-toolbar">
					<input
						ref={fileInputRef}
						type="file"
						accept=".json,application/json"
						className="ad-visually-hidden"
						onChange={(e) => {
							handleFile(e.target.files?.[0]);
							e.target.value = "";
						}}
					/>
					<button type="button" className="ad-btn ad-btn--ghost" onClick={() => fileInputRef.current?.click()} disabled={busy}>
						<Upload size={16} /> Choisir un fichier .json
					</button>
					{jsonText && <span className="ad-muted">{jsonName}</span>}
				</div>
			)}

			{showEditor && (
				<div className="ad-field ad-field--grow">
					<span>
						{source === "pdf"
							? "Programme extrait par le modèle : relis-le et corrige-le avant d'appliquer"
							: "Contenu du programme (modifiable)"}
					</span>
					<textarea
						className="ad-json-editor"
						value={jsonText}
						onChange={(e) => {
							setJsonText(e.target.value);
							setApplied(null);
						}}
						spellCheck={false}
						rows={16}
						disabled={busy}
						placeholder={source === "json" ? "Choisis un fichier, ou colle le JSON du programme ici." : undefined}
					/>
					<div className="ad-toolbar ad-toolbar--between">
						{parsed && !parsed.ok ? (
							<em className="ad-field-error">JSON invalide : {parsed.error}</em>
						) : (
							<span className="ad-muted">
								{source === "pdf"
									? "Une extraction automatique peut se tromper : c'est le seul moment pour corriger avant que les élèves ne la voient."
									: "Le fichier est lu dans ton navigateur puis envoyé tel quel."}
							</span>
						)}
						{jsonText && (
							<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => downloadJson(jsonText, jsonName)}>
								<Download size={14} /> Télécharger le JSON
							</button>
						)}
					</div>
				</div>
			)}

			{error && (
				<div className="ad-alert ad-alert--error" role="alert">
					<AlertTriangle size={16} />
					<span>{error.message}</span>
					{error.pdfFailed && (
						<button
							type="button"
							className="ad-btn ad-btn--ghost ad-btn--sm"
							onClick={() => {
								setSource("json");
								reset();
								setJsonText("");
							}}
						>
							Importer un JSON
						</button>
					)}
				</div>
			)}

			{preview && !applied && (
				<section className="ad-import-preview">
					<h3 className="ad-subtitle">
						Simulation <span className="ad-muted">· rien n'a encore été écrit</span>
					</h3>
					<ImportReport result={preview} future />
					{!previewIsCurrent && (
						<p className="ad-alert ad-alert--info">
							<RotateCcw size={16} />
							<span>Le JSON ou le mode a changé depuis la simulation : relance-la pour mettre le rapport à jour.</span>
						</p>
					)}
				</section>
			)}

			{applied && (
				<div className="ad-alert ad-alert--success" role="status">
					<CheckCircle2 size={16} />
					<div>
						<strong>Programme appliqué.</strong> Le catalogue a été rechargé depuis le serveur.
						<ImportReport result={applied} future={false} />
					</div>
				</div>
			)}

			<div className="ad-actions">
				{source === "pdf" && preview === null && (
					<button type="button" className="ad-btn ad-btn--primary" onClick={simulatePdf} disabled={!isHttps || !filename.trim() || busy}>
						{busy ? <Loader size={16} className="ad-spin" /> : <Play size={16} />}
						{busy ? "Extraction en cours..." : "Extraire et simuler"}
					</button>
				)}
				{(source === "json" || preview !== null) && !previewIsCurrent && (
					<button type="button" className="ad-btn ad-btn--primary" onClick={simulateJson} disabled={!parsed?.ok || busy}>
						{busy ? <Loader size={16} className="ad-spin" /> : <Play size={16} />}
						{preview ? "Relancer la simulation" : "Simuler l'import"}
					</button>
				)}
				{previewIsCurrent && !applied && (
					<button type="button" className="ad-btn ad-btn--primary" onClick={apply} disabled={busy}>
						{busy ? <Loader size={16} className="ad-spin" /> : <CheckCircle2 size={16} />}
						Appliquer
					</button>
				)}
			</div>
		</div>
	);
};

export default ProgrammeImport;
