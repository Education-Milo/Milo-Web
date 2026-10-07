/**
 * Numéros d'aide que le back insère dans une réponse de détresse :
 * 3114 (prévention du suicide), 119 (enfance en danger), 3018 (cyberharcèlement).
 * Une telle réponse doit rester lisible en entier, numéros cliquables.
 */
export const DISTRESS_NUMBERS = ["3114", "119", "3018"] as const;

const DISTRESS_PATTERN = /(?<!\d)(3114|119|3018)(?!\d)/;

/**
 * Vocabulaire d'une orientation vers une ligne d'écoute. Un « 119 » seul peut
 * être un résultat de calcul : on exige le numéro ET ce vocabulaire.
 */
const HELPLINE_WORDS = /appel|gratuit|écoute|ecoute|24\s?h|numéro|numero|joindre|anonyme/i;

export const isDistressReply = (text: string | null | undefined): boolean =>
	Boolean(text && DISTRESS_PATTERN.test(text) && HELPLINE_WORDS.test(text));

/** Découpe le texte en morceaux : texte brut, ou numéro d'aide à rendre cliquable. */
export const splitDistressNumbers = (text: string): { value: string; isNumber: boolean }[] =>
	text
		.split(/(?<!\d)(3114|119|3018)(?!\d)/)
		.filter((part) => part !== "")
		.map((part) => ({ value: part, isNumber: (DISTRESS_NUMBERS as readonly string[]).includes(part) }));
