import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import NodeFormDialog, { type EditableNode, type NodeFormTarget } from "@features/admin/components/programmes/NodeFormDialog";
import DeleteNodeDialog from "@features/admin/components/programmes/DeleteNodeDialog";
import {
	CHILD_TYPE,
	LEVELS,
	LEVEL_LABELS,
	NODE_LABELS,
	type CatalogueChapter,
	type CatalogueCourse,
	type CatalogueSubject,
	type Level,
	type NodeType,
} from "@features/admin/store/programmes.model";
import { useCatalogue } from "@features/admin/store/programmes.queries";
import { getProgrammeErrorMessage } from "@features/admin/utils/programmes.errors";

const count = (n: number, one: string, many: string) => `${n.toLocaleString("fr-FR")} ${n > 1 ? many : one}`;

const chapterCount = (subject: CatalogueSubject) => subject.courses.reduce((n, c) => n + c.chapters.length, 0);
const lessonsInCourse = (course: CatalogueCourse) => course.chapters.reduce((n, ch) => n + ch.lessons.length, 0);
const lessonsInSubject = (subject: CatalogueSubject) => subject.courses.reduce((n, c) => n + lessonsInCourse(c), 0);

/** Résumé du contenu d'un nœud replié, pour savoir s'il est vide sans le déplier. */
const summary = (type: NodeType, node: CatalogueSubject | CatalogueCourse | CatalogueChapter): string => {
	if (type === "subjects") {
		const s = node as CatalogueSubject;
		if (s.courses.length === 0) return "vide";
		return [count(s.courses.length, "cours", "cours"), count(chapterCount(s), "chapitre", "chapitres"), count(lessonsInSubject(s), "leçon", "leçons")].join(", ");
	}
	if (type === "courses") {
		const c = node as CatalogueCourse;
		if (c.chapters.length === 0) return "vide";
		return [count(c.chapters.length, "chapitre", "chapitres"), count(lessonsInCourse(c), "leçon", "leçons")].join(", ");
	}
	const ch = node as CatalogueChapter;
	return ch.lessons.length === 0 ? "vide" : count(ch.lessons.length, "leçon", "leçons");
};

type Dialog =
	| { kind: "form"; target: NodeFormTarget }
	| { kind: "delete"; type: NodeType; id: number; title: string }
	| null;

/** Arbre du catalogue : matières > cours > chapitres > leçons. */
const CatalogueTree: React.FC = () => {
	const [level, setLevel] = useState<Level | "">("");
	const [subjectId, setSubjectId] = useState<number | "">("");
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
	const [dialog, setDialog] = useState<Dialog>(null);

	// Filtre de niveau côté serveur ; la matière est filtrée ici pour garder la liste complète du menu
	const { data, isLoading, isError, error, isFetching, refetch } = useCatalogue({ level: level || undefined });
	const subjects = useMemo(
		() => (data?.subjects ?? []).filter((s) => !subjectId || s.id === subjectId),
		[data, subjectId],
	);

	const keyOf = (type: NodeType, id: number) => `${type}:${id}`;
	const isOpen = (type: NodeType, id: number) => expanded.has(keyOf(type, id));
	const toggle = (type: NodeType, id: number) =>
		setExpanded((prev) => {
			const next = new Set(prev);
			const key = keyOf(type, id);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});

	const expandAll = () => {
		const keys = new Set<string>();
		for (const s of subjects) {
			keys.add(keyOf("subjects", s.id));
			for (const c of s.courses) {
				keys.add(keyOf("courses", c.id));
				for (const ch of c.chapters) keys.add(keyOf("chapters", ch.id));
			}
		}
		setExpanded(keys);
	};

	const openCreate = (type: NodeType, parentId: number | null) => setDialog({ kind: "form", target: { kind: "create", type, parentId } });
	const openEdit = (type: NodeType, node: EditableNode, parentId: number | null) =>
		setDialog({ kind: "form", target: { kind: "edit", type, node, parentId } });
	const openDelete = (type: NodeType, id: number, title: string) => setDialog({ kind: "delete", type, id, title });

	const renderRow = (
		type: NodeType,
		node: EditableNode,
		parentId: number | null,
		depth: number,
		children: React.ReactNode,
		hasChildren: boolean,
		extra?: string,
	) => {
		const open = isOpen(type, node.id);
		const childType = CHILD_TYPE[type];
		return (
			<li key={keyOf(type, node.id)} className={`ad-tree-node ad-tree-node--${type}`}>
				<div className="ad-tree-row" style={{ paddingLeft: `${depth * 22 + 8}px` }}>
					{childType ? (
						<button
							type="button"
							className="ad-tree-toggle"
							onClick={() => toggle(type, node.id)}
							aria-expanded={open}
							aria-label={open ? "Replier" : "Déplier"}
						>
							{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
						</button>
					) : (
						<span className="ad-tree-toggle ad-tree-toggle--leaf" aria-hidden="true" />
					)}
					<span className="ad-tree-type">{NODE_LABELS[type].one}</span>
					<span className="ad-tree-title" title={node.title}>{node.title}</span>
					{extra && <span className="ad-chip ad-chip--off">{extra}</span>}
					{childType && !open && (
						<span className={`ad-tree-summary ${hasChildren ? "" : "is-empty"}`}>
							{summary(type, node as unknown as CatalogueSubject)}
						</span>
					)}
					<span className="ad-tree-actions">
						{childType && (
							<button
								type="button"
								className="ad-btn ad-btn--ghost ad-btn--sm"
								onClick={() => openCreate(childType, node.id)}
								title={`Ajouter ${NODE_LABELS[childType].a}`}
							>
								<Plus size={13} /> {NODE_LABELS[childType].one}
							</button>
						)}
						<button type="button" className="ad-icon-btn" onClick={() => openEdit(type, node, parentId)} aria-label={`Modifier ${node.title}`} title="Modifier">
							<Pencil size={14} />
						</button>
						<button type="button" className="ad-icon-btn ad-icon-btn--danger" onClick={() => openDelete(type, node.id, node.title)} aria-label={`Supprimer ${node.title}`} title="Supprimer">
							<Trash2 size={14} />
						</button>
					</span>
				</div>
				{open && children}
			</li>
		);
	};

	return (
		<div className="ad-programmes-tree">
			<div className="ad-toolbar ad-toolbar--between">
				<div className="ad-toolbar">
					<label className="ad-field">
						<span>Niveau</span>
						<select
							value={level}
							onChange={(e) => {
								setLevel(e.target.value as Level | "");
								setSubjectId("");
							}}
						>
							<option value="">Tous les niveaux</option>
							{LEVELS.map((l) => (
								<option key={l} value={l}>{LEVEL_LABELS[l]}</option>
							))}
						</select>
					</label>
					<label className="ad-field">
						<span>Matière</span>
						<select value={subjectId} onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")}>
							<option value="">Toutes les matières</option>
							{(data?.subjects ?? []).map((s) => (
								<option key={s.id} value={s.id}>{s.title} ({LEVEL_LABELS[s.level as Level] ?? s.level})</option>
							))}
						</select>
					</label>
				</div>
				<div className="ad-toolbar">
					<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={expandAll} disabled={!subjects.length}>
						<ChevronsUpDown size={14} /> Tout déplier
					</button>
					<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => setExpanded(new Set())} disabled={!expanded.size}>
						<ChevronsDownUp size={14} /> Tout replier
					</button>
					<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => void refetch()} disabled={isFetching}>
						<RefreshCw size={14} className={isFetching ? "ad-spin" : undefined} /> Recharger
					</button>
					<button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={() => openCreate("subjects", null)} disabled={!data}>
						<Plus size={14} /> Matière
					</button>
				</div>
			</div>

			{isLoading && <p className="ad-muted">Chargement du catalogue...</p>}
			{isError && !data && <p className="ad-alert ad-alert--error">{getProgrammeErrorMessage(error)}</p>}
			{data && subjects.length === 0 && (
				<p className="ad-empty-state">
					{level || subjectId ? "Aucune matière pour ce filtre." : "Le catalogue est vide. Ajoute une matière ou importe un programme."}
				</p>
			)}

			{subjects.length > 0 && (
				<ul className={`ad-tree ${isFetching ? "is-fetching" : ""}`}>
					{subjects.map((subject) =>
						renderRow(
							"subjects",
							subject as unknown as EditableNode,
							null,
							0,
							<ul className="ad-tree">
								{subject.courses.map((course) =>
									renderRow(
										"courses",
										course,
										subject.id,
										1,
										<ul className="ad-tree">
											{course.chapters.map((chapter) =>
												renderRow(
													"chapters",
													chapter,
													course.id,
													2,
													<ul className="ad-tree">
														{chapter.lessons.map((lesson) =>
															renderRow(
																"lessons",
																lesson,
																chapter.id,
																3,
																null,
																false,
																lesson.learning_objectives?.length
																	? count(lesson.learning_objectives.length, "objectif", "objectifs")
																	: undefined,
															),
														)}
													</ul>,
													chapter.lessons.length > 0,
												),
											)}
										</ul>,
										course.chapters.length > 0,
									),
								)}
							</ul>,
							subject.courses.length > 0,
							`${LEVEL_LABELS[subject.level as Level] ?? subject.level}${subject.cycle != null ? ` · cycle ${String(subject.cycle).match(/\d+/)?.[0] ?? subject.cycle}` : ""}`,
						),
					)}
				</ul>
			)}

			{dialog?.kind === "form" && data && (
				<NodeFormDialog target={dialog.target} catalogue={data} onClose={() => setDialog(null)} />
			)}
			{dialog?.kind === "delete" && (
				<DeleteNodeDialog type={dialog.type} id={dialog.id} title={dialog.title} onClose={() => setDialog(null)} />
			)}
		</div>
	);
};

export default CatalogueTree;
