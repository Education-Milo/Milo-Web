import { isAxiosError } from "axios";

/**
 * Bornes imposées par le back sur les routes IA (422 au-delà). Les saisies de
 * l'élève les reprennent pour qu'il ne puisse pas atteindre le cas d'erreur.
 */
export const AI_LIMITS = {
	/** `chat_request` de /chat */
	CHAT_REQUEST: 2000,
	/** `question` de /chat_lesson_question */
	LESSON_QUESTION: 2000,
	/** `context` de /chat et /chat_lesson */
	CONTEXT: 8000,
	/** `part_content` de /chat_lesson_question */
	PART_CONTENT: 8000,
	/** `name` de POST /users/{id}/interests (non vide) */
	INTEREST_NAME: 60,
	/**
	 * Réponse libre de l'élève insérée dans une consigne envoyée à /chat : on
	 * garde de la marge sous CHAT_REQUEST pour le texte de la consigne.
	 */
	STUDENT_ANSWER: 1000,
} as const;

/** Coupe un texte à la borne d'un champ (dernier rempart avant un 422). */
export const clampText = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

export const AI_RATE_LIMIT_MESSAGE = "Tu as posé beaucoup de questions d'un coup. Patiente une minute.";
export const AI_TOO_LONG_MESSAGE = "Ton message est trop long. Raccourcis-le puis réessaie.";
export const INTERESTS_LIMIT_MESSAGE =
	"Tu as atteint le maximum de 20 centres d'intérêt. Supprimes-en un pour en ajouter un autre.";

export const getErrorStatus = (error: unknown): number | undefined =>
	isAxiosError(error) ? error.response?.status : undefined;

const getDetailText = (error: unknown): string | null => {
	if (!isAxiosError(error)) return null;
	const detail = error.response?.data?.detail;
	return typeof detail === "string" && detail.trim() ? detail : null;
};

interface AiErrorOptions {
	/** Message quand l'erreur n'a pas de cas dédié */
	fallback: string;
	/**
	 * Routes OCR : un 400 signifie que l'image a été refusée par la
	 * modération, et son `detail` s'affiche tel quel.
	 */
	showDetailOn400?: boolean;
}

/**
 * Message à montrer à l'élève après l'échec d'une route IA.
 * 429 (quota par compte) : ne jamais réessayer automatiquement.
 */
export const getAiErrorMessage = (error: unknown, { fallback, showDetailOn400 = false }: AiErrorOptions): string => {
	const status = getErrorStatus(error);
	if (status === 429) return AI_RATE_LIMIT_MESSAGE;
	if (status === 422) return AI_TOO_LONG_MESSAGE;
	if (status === 400 && showDetailOn400) return getDetailText(error) ?? fallback;
	return fallback;
};
