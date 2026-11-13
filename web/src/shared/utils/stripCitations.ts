/**
 * Retire les marqueurs de citation laissés par un contenu généré par IA
 * (« [cite: 3] », « [cite: 1, 4] », « [cite_start] ») des textes reçus de
 * l'API. Visibles par les élèves et lus par les lecteurs d'écran.
 *
 * Garde-fou côté front : le nettoyage de fond se fait en base.
 */
const CITATION = /\s*\[cite(?:_start|_end)?(?::\s*[\d,\s]*)?\]/g;

export const stripCitationText = (text: string): string =>
	text.includes("[cite") ? text.replace(CITATION, "") : text;

/** Parcourt une réponse JSON et nettoie chaque chaîne (en place). */
export function stripCitations<T>(data: T): T {
	if (typeof data === "string") return stripCitationText(data) as T;
	if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) data[i] = stripCitations(data[i]);
		return data;
	}
	if (data && typeof data === "object" && Object.getPrototypeOf(data) === Object.prototype) {
		const record = data as Record<string, unknown>;
		for (const key of Object.keys(record)) record[key] = stripCitations(record[key]);
	}
	return data;
}
