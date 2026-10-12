import { isAxiosError } from "axios";

const detailText = (error: unknown): string | null => {
	if (!isAxiosError(error)) return null;
	const detail = error.response?.data?.detail;
	if (typeof detail === "string" && detail.trim()) return detail;
	if (Array.isArray(detail)) {
		const text = detail.map((d) => (typeof d === "string" ? d : d?.msg)).filter(Boolean).join(" · ");
		return text || null;
	}
	return null;
};

export const QDRANT_DOWN_MESSAGE =
	"La base de connaissances est momentanément injoignable (service de recherche hors ligne). Ta demande n'est pas en cause : réessaie plus tard.";

/**
 * Message à afficher pour les routes programmes et RAG. Les `detail` des 409
 * sont rédigés pour un administrateur : affichés sans reformulation.
 */
export const getProgrammeErrorMessage = (error: unknown): string => {
	const status = isAxiosError(error) ? error.response?.status : undefined;
	const detail = detailText(error);
	switch (status) {
		case 409:
		case 400:
			return detail ?? "Cette opération est refusée par le serveur.";
		case 404:
			return "Cet élément n'existe plus : il a peut-être été modifié par un autre administrateur. L'arbre a été rechargé.";
		case 422:
			return detail ? `Champ invalide : ${detail}` : "Un champ est invalide (vide, trop long ou niveau inconnu).";
		case 502:
			return "L'extraction du PDF a échoué. Tu peux importer le programme depuis un fichier JSON à la place.";
		case 503:
			return QDRANT_DOWN_MESSAGE;
		case 403:
			return "Accès réservé aux administrateurs.";
		default:
			return detail ?? "Une erreur est survenue, réessaie dans un instant.";
	}
};
