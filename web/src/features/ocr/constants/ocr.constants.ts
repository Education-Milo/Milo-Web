import type {
	OcrDocumentOption,
	OcrActionOption,
	OcrDocumentType,
} from "../types/ocr.types";

// ─── Options de type de document ──────────────────────────────────────────────

export const OCR_DOCUMENT_OPTIONS: OcrDocumentOption[] = [
	{
		type: "cours",
		label: "Cours",
		description: "Importe un cours pour générer un QCM ou discuter avec Milo",
		icon: "📚",
		acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
	},
	{
		type: "bulletin",
		label: "Bulletin",
		description: "Analyse ton bulletin scolaire automatiquement",
		icon: "📋",
		acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
	},
	{
		type: "exercice",
		label: "Exercice",
		description:
			"Importe un exercice pour en générer un similaire ou discuter avec Milo",
		icon: "✏️",
		acceptedFormats: [".pdf", ".jpg", ".jpeg", ".png"],
	},
];

// ─── Options d'action par type de document ─────────────────────────────────────

export const OCR_ACTIONS_BY_TYPE: Record<
	Exclude<OcrDocumentType, "bulletin">,
	OcrActionOption[]
> = {
	cours: [
		{
			action: "generate_qcm",
			label: "Générer un QCM",
			description: "Crée un questionnaire à choix multiples basé sur ton cours",
			icon: "🎯",
		},
		{
			action: "discuss_milo_cours",
			label: "Discuter avec Milo",
			description: "Pose des questions sur ton cours à Milo",
			icon: "💬",
		},
	],
	exercice: [
		{
			action: "generate_exercise",
			label: "Générer un exercice similaire",
			description: "Crée un nouvel exercice dans le même style",
			icon: "🔄",
		},
		{
			action: "discuss_milo_ex",
			label: "Discuter avec Milo",
			description: "Fais-toi aider par Milo pour résoudre l'exercice",
			icon: "💬",
		},
	],
};

export const ACCEPTED_FILE_FORMATS = ".pdf,.jpg,.jpeg,.png";
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
