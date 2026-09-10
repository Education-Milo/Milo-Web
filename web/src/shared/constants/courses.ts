export interface CourseVisuals {
	emoji: string;
	colorTheme:
		| "orange"
		| "blue"
		| "green"
		| "red"
		| "purple"
		| "yellow"
		| "teal"
		| "pink";
	locked?: boolean;
}

// Le mapping par famille de matière, valable pour tous les niveaux
// (6ème, 5ème, 4ème, 3ème) : le backend attribue un id (et parfois un
// intitulé) différent par matière et par niveau — ex. "Anglais - 6ème",
// "Mathématiques - 4ème", "Français Cycle 4 Programme", "Sciences et Vie
// de la Terre" — mais le visuel (emoji/couleur/verrouillage) ne dépend
// que de la matière elle-même. Utiliser `getSubjectVisuals(subject.title)`
// pour résoudre le bon visuel, jamais un accès direct à cet objet.
export const SUBJECTS_CONFIG: Record<string, CourseVisuals> = {
	"Mathématiques": {
		emoji: "🧮",
		colorTheme: "blue",
	},
	"Français": {
		emoji: "🇫🇷",
		colorTheme: "red",
	},
	"Histoire-Géographie": {
		emoji: "🏛️",
		colorTheme: "yellow",
		locked: true,
	},
	"Anglais": {
		emoji: "🇬🇧",
		colorTheme: "purple",
	},
	"Physique-Chimie": {
		emoji: "🧪",
		colorTheme: "orange",
		locked: true,
	},
	"SVT": {
		emoji: "🌱",
		colorTheme: "teal",
		locked: true,
	},
};

export const DEFAULT_VISUALS: CourseVisuals = {
	emoji: "📚",
	colorTheme: "teal",
};

/**
 * Résout le visuel (emoji/couleur/verrouillage) d'une matière à partir de
 * son intitulé brut renvoyé par l'API, quel que soit le niveau ou la
 * formulation exacte (ex. "Anglais - 6ème", "Mathématiques - 4ème",
 * "Sciences et Vie de la Terre", "Français Cycle 4 Programme").
 *
 * On normalise le texte (accents, casse, ponctuation) puis on cherche des
 * mots-clés propres à chaque matière, plutôt qu'une correspondance exacte
 * sur l'intitulé complet — ce qui reste robuste même si le backend renvoie
 * des intitulés différents pour un même sujet selon le niveau.
 * Si rien ne correspond, on retombe sur DEFAULT_VISUALS (le vrai nom de la
 * matière reste affiché ailleurs via subject.title, indépendamment de ce
 * visuel).
 */
function normalizeSubjectText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // enlève les accents (diacritiques Unicode)
		.toLowerCase()
		.trim();
}

const SUBJECT_MATCHERS: { key: keyof typeof SUBJECTS_CONFIG; keywords: string[] }[] = [
	{ key: "Mathématiques", keywords: ["math"] },
	{ key: "Français", keywords: ["francais"] },
	{ key: "Histoire-Géographie", keywords: ["histoire", "geographie"] },
	{
		key: "SVT",
		keywords: [
			"svt",
			"sciences et vie de la terre",
			"sciences de la vie et de la terre",
		],
	},
	{ key: "Physique-Chimie", keywords: ["physique", "chimie"] },
	{ key: "Anglais", keywords: ["anglais"] },
];

export function getSubjectVisuals(title: string | undefined | null): CourseVisuals {
	if (!title) return DEFAULT_VISUALS;
	const normalized = normalizeSubjectText(title);
	const matcher = SUBJECT_MATCHERS.find(({ keywords }) =>
		keywords.some((keyword) => normalized.includes(keyword)),
	);
	if (!matcher) return DEFAULT_VISUALS;
	return SUBJECTS_CONFIG[matcher.key] ?? DEFAULT_VISUALS;
}
