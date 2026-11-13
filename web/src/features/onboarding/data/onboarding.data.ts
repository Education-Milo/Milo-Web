import type { Emoji3DName } from "@features/landing/data/landing.data";
import { ROUTES } from "@shared/constants/routes";

/**
 * Onboarding : l'élève qui vient de s'inscrire entre dans la classe de Milo,
 * qui lui présente l'essentiel au tableau, puis lui fait visiter l'école en
 * 5 étapes. Ton de la charte : tutoiement, phrases courtes, un seul point
 * d'exclamation par paragraphe.
 */

/* ============================================================
   1. EN CLASSE — Milo fait le tour de sa salle
   ============================================================ */
export type ClassSlideBoard = "welcome" | "lesson" | "passage" | "sheet" | "interest" | "notes" | "toolbar" | "map";

/** Ce que Milo montre : l'élément mis en lumière dans la salle */
export type ClassFocus = "board" | "sheet" | "notes" | "toolbar" | null;

export interface ClassSlide {
	id: string;
	/** Titre écrit à la craie */
	title: string;
	/** Mot du titre mis en couleur */
	highlight?: string;
	/** Réplique de Milo ; {name} = prénom de l'élève, {count} = nombre d'étapes de la visite */
	line: string;
	board: ClassSlideBoard;
	focus: ClassFocus;
	/** La bulle se met en haut quand Milo montre le bureau, pour ne rien cacher */
	bubble: "top" | "bottom";
	/** Objet du bureau pris en main pendant l'écran */
	hold?: "sheet" | "notes";
}

export const CLASS_SLIDES: ClassSlide[] = [
	{
		id: "welcome",
		title: "Bienvenue en classe !",
		highlight: "classe",
		line: "Salut {name} ! Moi c'est Milo, ton prof perso. Ici, c'est ma salle de classe. Je te fais le tour, ça va être rapide.",
		board: "welcome",
		focus: null,
		bubble: "bottom",
	},
	{
		id: "lesson",
		title: "Le tableau",
		highlight: "tableau",
		line: "Voici le tableau. J'y écris ta leçon, partie par partie. En bas, les flèches et « Partie suivante » te font avancer. « Écouter » : je te lis la leçon à voix haute.",
		board: "lesson",
		focus: "board",
		bubble: "bottom",
	},
	{
		id: "passage",
		title: "Clique sur une phrase",
		highlight: "phrase",
		line: "Une phrase pas claire ? Clique dessus. Je peux la ré-expliquer, te donner un exemple, t'inventer un exercice, te la lire ou la noter sur ton post-it.",
		board: "passage",
		focus: "board",
		bubble: "bottom",
	},
	{
		id: "sheet",
		title: "Ta feuille",
		highlight: "feuille",
		line: "Sur ton bureau, il y a une feuille. Clique dessus : elle vient devant toi. Tu m'écris ta question, tu l'envoies, et je te réponds au tableau.",
		board: "sheet",
		focus: "sheet",
		bubble: "top",
	},
	{
		id: "interest",
		title: "Faisons un test !",
		highlight: "test",
		line: "Tiens, faisons un test ! Donne-moi un centre d'intérêt sur ta feuille. Je l'utiliserai pour créer des questions et des exercices qui te plaisent.",
		board: "interest",
		focus: "sheet",
		bubble: "top",
		hold: "sheet",
	},
	{
		id: "notes",
		title: "Ton post-it",
		highlight: "post-it",
		line: "Le post-it jaune, c'est ton pense-bête. Chaque phrase que tu notes s'y colle. Clique dessus pour relire tes notes ou réviser avec moi.",
		board: "notes",
		focus: "notes",
		bubble: "top",
		hold: "notes",
	},
	{
		id: "toolbar",
		title: "Tes outils",
		highlight: "outils",
		line: "En haut, tes outils : « Quitter » pour sortir, « Quiz de la leçon » pour te tester et gagner de l'XP, « Changer de leçon », « Mes notes », et « ? » si tu oublies comment ça marche.",
		board: "toolbar",
		focus: "toolbar",
		bubble: "bottom",
	},
	{
		id: "map",
		title: "On visite l'école ?",
		highlight: "l'école",
		line: "Leçons, quiz et missions te rapportent de l'XP et des miloros. Maintenant, je te fais visiter l'école en {count} étapes.",
		board: "map",
		focus: null,
		bubble: "bottom",
	},
];

/** Réplique de Milo une fois le centre d'intérêt enregistré */
export const INTEREST_SAVED_LINE =
	"Génial, « {interest} » ! C'est noté. Je m'en servirai dans tes exercices. Tu pourras en ajouter d'autres dans Personnalisation.";

/** Leçon d'exemple écrite au tableau pendant la visite de la classe */
export const DEMO_LESSON = {
	subject: "Mathématiques",
	title: "Les fractions",
	parts: 3,
	sentences: [
		"Une fraction représente une partie d'un tout.",
		"Le nombre du bas, le dénominateur, indique en combien de parts on coupe le tout.",
		"Le nombre du haut, le numérateur, indique combien de parts on prend.",
	],
};

/** Actions d'une phrase, identiques à celles du tableau (LessonBoard) */
export const PASSAGE_ACTIONS: { label: string; icon: Emoji3DName | null }[] = [
	{ label: "Ré-expliquer", icon: "speech_balloon" },
	{ label: "Un exemple", icon: "light_bulb" },
	{ label: "Exercice", icon: "brain" },
	{ label: "Écouter", icon: null },
	{ label: "Noter", icon: "card_index_dividers" },
];

/** Outils de la barre du haut de la classe */
export const TOOLBAR_ITEMS: { label: string; icon: Emoji3DName | null; help: string }[] = [
	{ label: "Quitter", icon: null, help: "sortir de la classe" },
	{ label: "Quiz de la leçon", icon: "bullseye", help: "te tester, gagner de l'XP" },
	{ label: "Changer de leçon", icon: "books", help: "aller à une autre leçon" },
	{ label: "Mes notes", icon: "card_index_dividers", help: "ouvrir ton post-it" },
	{ label: "?", icon: null, help: "comment ça marche" },
];

/* ============================================================
   2. LA VISITE — 5 étapes dans le site
   ============================================================ */
export type TourTarget = "home" | "courses" | "ocr" | "duels" | "shop" | "personalization";

export interface TourStep {
	id: TourTarget;
	/** Page ouverte pendant l'étape */
	route: string;
	/** Entrée de la sidebar mise en lumière (attribut data-tour) */
	target: TourTarget;
	title: string;
	text: string;
	icon: Emoji3DName;
	/** Petit plus affiché en pastille */
	tip: string;
}

export const TOUR_STEPS: TourStep[] = [
	{
		id: "home",
		route: ROUTES.HOME,
		target: "home",
		title: "Ton QG",
		text: "C'est ton accueil. Tu y retrouves tes missions du jour, ta série et ton XP. Tout commence ici.",
		icon: "spiral_calendar",
		tip: "Une mission par jour suffit pour garder ta série",
	},
	{
		id: "courses",
		route: ROUTES.COURSES,
		target: "courses",
		title: "Les cours",
		text: "Choisis ta matière, puis ta leçon. Je te l'explique en classe et un quiz vérifie que tout est clair.",
		icon: "books",
		tip: "Tous les programmes de la 6e à la 3e",
	},
	{
		id: "ocr",
		route: ROUTES.OCR,
		target: "ocr",
		title: "Import document",
		text: "Prends en photo un cours ou un exercice du collège : je le transforme en quiz sur mesure.",
		icon: "card_index_dividers",
		tip: "Parfait la veille d'un contrôle",
	},
	{
		id: "duels",
		route: ROUTES.DUELS,
		target: "duels",
		title: "Les duels",
		text: "Défie tes amis en quiz chronométré. Bonne réponse et rapidité : le meilleur l'emporte.",
		icon: "crossed_swords",
		tip: "Ajoute tes amis pour les défier",
	},
	{
		id: "shop",
		route: "/boutique",
		target: "shop",
		title: "La boutique",
		text: "Tes miloros servent ici : tenues, accessoires, danses. Habille-moi comme tu veux !",
		icon: "t_shirt",
		tip: "Tout s'achète avec les miloros gagnés en jouant",
	},
	{
		id: "personalization",
		route: ROUTES.PERSONALIZATION,
		target: "personalization",
		title: "Personnalisation",
		text: "Ici, tu habilles Milo, tu règles ta roue de duel et tu gères tes centres d'intérêt. Celui que tu m'as donné en classe y est déjà.",
		icon: "fox",
		tip: "Plus j'en sais sur toi, plus tes exercices te ressemblent",
	},
];
