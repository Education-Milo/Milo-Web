export const LEVELS = ["6eme", "5eme", "4eme", "3eme"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
	"6eme": "6ème",
	"5eme": "5ème",
	"4eme": "4ème",
	"3eme": "3ème",
};

/** Bornes du back (422 au-delà) */
export const PROGRAMME_LIMITS = {
	TITLE: 255,
	TEXT: 20000,
	RAG_FILENAME: 255,
	RAG_TEXT: 500000,
} as const;

export interface CatalogueLesson {
	id: number;
	title: string;
	learning_objectives?: string[] | null;
	boundaries?: string | null;
	success_criteria?: string[] | null;
}

export interface CatalogueChapter {
	id: number;
	title: string;
	context_info?: string | null;
	lessons: CatalogueLesson[];
}

export interface CatalogueCourse {
	id: number;
	title: string;
	description?: string | null;
	chapters: CatalogueChapter[];
}

export interface CatalogueSubject {
	id: number;
	title: string;
	level: Level | string;
	cycle?: string | number | null;
	courses: CatalogueCourse[];
}

/** GET /admin/catalogue : tout l'arbre en une requête */
export interface Catalogue {
	subjects: CatalogueSubject[];
}

export interface CatalogueFilters {
	subject_id?: number;
	level?: Level;
}

/** Segment d'URL de /admin/{type}/{id} */
export type NodeType = "subjects" | "courses" | "chapters" | "lessons";

export const CHILD_TYPE: Record<NodeType, NodeType | null> = {
	subjects: "courses",
	courses: "chapters",
	chapters: "lessons",
	lessons: null,
};

export const PARENT_FIELD: Record<NodeType, "subject_id" | "course_id" | "chapter_id" | null> = {
	subjects: null,
	courses: "subject_id",
	chapters: "course_id",
	lessons: "chapter_id",
};

/** Libellés français : [singulier, pluriel, article défini, « un/une »] */
export const NODE_LABELS: Record<NodeType, { one: string; many: string; the: string; a: string }> = {
	subjects: { one: "matière", many: "matières", the: "la matière", a: "une matière" },
	courses: { one: "cours", many: "cours", the: "le cours", a: "un cours" },
	chapters: { one: "chapitre", many: "chapitres", the: "le chapitre", a: "un chapitre" },
	lessons: { one: "leçon", many: "leçons", the: "la leçon", a: "une leçon" },
};

/** DELETE /admin/{type}/{id} réussi */
export interface DeleteNodeResponse {
	deleted: boolean;
	cascaded?: Partial<Record<"courses" | "chapters" | "lessons", number>>;
}

export interface ReportCounts {
	created: number;
	updated: number;
	unchanged: number;
}

export type ImportMode = "update" | "add_only";

/** POST /admin/programmes/import et /extract-pdf */
export interface ImportResponse {
	report: Partial<Record<"subjects" | "courses" | "chapters" | "lessons", ReportCounts>>;
	/** extract-pdf uniquement : le JSON extrait par le modèle, à relire */
	programme?: unknown;
	dry_run?: boolean;
}

export interface RagDocument {
	filename: string;
	/** Nombre de fragments indexés (pas une taille de fichier) */
	chunks: number;
}

export interface RagDocumentsResponse {
	collection: string;
	documents: RagDocument[];
	total_chunks: number;
}
