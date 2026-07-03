import type { QcmQuestion } from "@features/exercices/store/exercise.model";

// ─── OCR Document Types ───────────────────────────────────────────────────────

export type OcrDocumentType = "cours" | "bulletin" | "exercice";

export interface OcrDocumentOption {
	type: OcrDocumentType;
	label: string;
	description: string;
	icon: string;
	acceptedFormats: string[];
}

// ─── OCR Actions ──────────────────────────────────────────────────────────────

export type OcrAction =
	| "generate_qcm" // Cours → Générer un QCM
	| "discuss_milo_cours" // Cours → Discuter avec Milo
	| "generate_exercise" // Exercice → Générer un Exercice Similaire
	| "discuss_milo_ex" // Exercice → Discuter avec Milo
	| "send_bulletin"; // Bulletin → envoi direct (pas de modal)

export interface OcrActionOption {
	action: OcrAction;
	label: string;
	description: string;
	icon: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface SubjectResult {
	subject: string;
	grade: number | null;
	class_average: number | null;
	comment: string;
}

export interface ApiSubjectResult {
	subject_name?: string;
	subject?: string;
	grade?: number | string | null;
	student_grade?: number | string | null;
	average_class_grade?: number | string | null;
	class_average?: number | string | null;
	comment?: string;
}

export interface ScanReportCardResponse {
	reply: ApiSubjectResult[];
}

// Alias pour compatibilité avec useOcrMutations
export type OcrReportCardResponse = ScanReportCardResponse;

export interface GeneratedExercise {
	exercise: string;
	answer: string;
	conversationId: string;
}

export interface OcrExerciseGenerationResponse {
	reply: {
		exercise: string;
		answer: string;
	};
	conversation_id: string;
}

export interface OcrCourseQcmResponse {
	reply: QcmQuestion[];
}

export interface OcrFreeChatResponse {
	reply: string;
	conversation_id: string;
}

// ─── Store State ──────────────────────────────────────────────────────────────

export type OcrStep = "select_type" | "upload_preview" | "completed";

export interface OcrState {
	step: OcrStep;
	selectedType: OcrDocumentType | null;
	selectedFile: File | null;
	previewUrl: string | null;
	isModalOpen: boolean;
	pendingAction: OcrAction | null;
}
