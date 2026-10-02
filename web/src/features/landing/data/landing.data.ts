/// Contenu éditorial de la Vitrine, séparé des composants pour pouvoir le
/// modifier sans toucher à la mise en page ni aux animations.

/// Icônes 3D disponibles dans /public/landing/emoji (Fluent Emoji 3D, MIT)
export type Emoji3DName =
	| "bar_chart" | "books" | "brain" | "bullseye" | "card_index_dividers" | "coin"
	| "crossed_swords" | "fire" | "fox" | "gem_stone" | "glowing_star" | "globe"
	| "graduation_cap" | "high_voltage" | "hundred_points" | "light_bulb" | "locked"
	| "money_bag" | "party_popper" | "rocket" | "shield" | "sparkles" | "speech_balloon"
	| "spiral_calendar" | "sports_medal" | "star" | "student" | "t_shirt" | "teacher"
	| "trophy" | "video_game";

export interface LandingSection {
	id: string;
	label: string;
}

/// Ancres de la Vitrine suivies par la navbar
export const SECTION_IDS = {
	concept: "concept",
	manifesto: "manifeste",
	kids: "enfants",
	parents: "parents",
	faq: "faq",
	pricing: "tarifs",
} as const;

export const HERO_BUBBLE_LINES = [
	"Salut, moi c'est Milo !",
	"On révise ensemble ?",
	"Clique sur moi !",
	"Prêt pour ta mission ?",
];

export const BANDS: { icon: Emoji3DName; label: string }[][] = [
	[
		{ icon: "card_index_dividers", label: "Flashcards" },
		{ icon: "sports_medal", label: "Ligues" },
		{ icon: "bullseye", label: "Missions" },
		{ icon: "t_shirt", label: "Cosmétiques" },
		{ icon: "coin", label: "Coins" },
		{ icon: "spiral_calendar", label: "Planning de révisions" },
	],
	[
		{ icon: "glowing_star", label: "Quiz quotidiens" },
		{ icon: "crossed_swords", label: "Duels en direct" },
		{ icon: "brain", label: "Exercices sur mesure" },
		{ icon: "books", label: "Import de cours" },
		{ icon: "fox", label: "Mascotte 3D" },
	],
];

export interface Mission {
	title: string;
	highlight: string;
	description: string;
	image: string;
	imageAlt: string;
	navLabel: string;
	tags: { icon: Emoji3DName; label: string }[];
	decor: [Emoji3DName, Emoji3DName, Emoji3DName];
}

export const MISSIONS: Mission[] = [
	{
		title: "Apprends à",
		highlight: "ta façon",
		description:
			"Importe tes propres cours pour que Milo s'adapte à la méthode de ton professeur. Profite d'exercices personnalisés selon tes centres d'intérêt et ta manière d'apprendre. Rentre dans une salle virtuelle avec ton professeur Milo !",
		image: "/landing/missions/milo_class.png",
		imageAlt: "Milo t'aide dans tes cours, à ta façon",
		navLabel: "Apprendre",
		tags: [
			{ icon: "books", label: "Import de cours" },
			{ icon: "brain", label: "Exercices sur mesure" },
			{ icon: "card_index_dividers", label: "Flashcards" },
		],
		decor: ["books", "brain", "light_bulb"],
	},
	{
		title: "Défie tes",
		highlight: "amis",
		description:
			"Rien de tel qu'un peu de compétition pour progresser ! Participe à des duels en temps réel, réponds aux quiz quotidiens et grimpe tout en haut de la ligue.",
		image: "/landing/missions/duel_page.png",
		imageAlt: "Milo en armure de chevalier pour les duels",
		navLabel: "Défier",
		tags: [
			{ icon: "crossed_swords", label: "Duels en direct" },
			{ icon: "trophy", label: "Ligues Bronze à Diamant" },
			{ icon: "bullseye", label: "Quiz quotidiens" },
		],
		decor: ["crossed_swords", "trophy", "high_voltage"],
	},
	{
		title: "Ton Milo,",
		highlight: "ton style",
		description:
			"Gagne des pièces en réussissant tes quêtes et tes leçons. Utilise-les dans la boutique pour acheter des cosmétiques et personnaliser ton compagnon renard !",
		image: "/landing/missions/my_milo.png",
		imageAlt: "Tableau de bord Milo avec missions du jour et coins",
		navLabel: "Personnaliser",
		tags: [
			{ icon: "fox", label: "Mascotte unique" },
			{ icon: "coin", label: "Système de coins" },
			{ icon: "t_shirt", label: "Cosmétiques exclusifs" },
		],
		decor: ["coin", "money_bag", "t_shirt"],
	},
];

export const PARENT_FEATURES: { title: string; description: string; icon: Emoji3DName; art: string }[] = [
	{
		title: "Suivi des progrès",
		description:
			"Gardez un œil sur le classement de votre enfant dans sa ligue et repérez ses points forts.",
		icon: "bar_chart",
		art: "var(--lp-sable)",
	},
	{
		title: "Planning de révisions",
		description:
			"Milo part de son emploi du temps scolaire pour lui proposer des sessions de révision au bon moment.",
		icon: "spiral_calendar",
		art: "linear-gradient(150deg, var(--lp-mandarine), var(--lp-orange))",
	},
	{
		title: "Contrôle parental",
		description:
			"Gérez jusqu'à 4 profils enfants et suivez leur activité depuis votre tableau de bord.",
		icon: "shield",
		art: "var(--lp-feu)",
	},
];

export const FAQ_PREVIEW: { question: string; answer: string; icon: Emoji3DName }[] = [
	{
		question: "Est-ce que Milo fait les devoirs à sa place ?",
		answer:
			"Non, Milo est un tuteur qui guide par le questionnement. Il ne donnera jamais la réponse directe, mais aidera l'enfant à cheminer vers la solution.",
		icon: "graduation_cap",
	},
	{
		question: "Le contenu est-il sécurisé ?",
		answer:
			"Absolument. Notre IA est bridée pour un usage strictement scolaire. Aucun échange entre utilisateurs n'est possible sur la plateforme.",
		icon: "shield",
	},
	{
		question: "Comment sont protégées les données ?",
		answer:
			"Conformité RGPD totale. Nous ne vendons aucune donnée et l'anonymat de l'enfant est notre priorité absolue.",
		icon: "locked",
	},
	{
		question: "Pourquoi Milo et pas une IA classique ?",
		answer:
			"Milo est conçu pour la pédagogie : ton adapté, analyse des faiblesses et ludification des leçons pour un engagement maximal.",
		icon: "rocket",
	},
];

export interface Plan {
	name: string;
	price: number;
	icon: Emoji3DName;
	features: string[];
	cta: string;
	featured?: boolean;
}

export const PLANS: Plan[] = [
	{
		name: "Essentiel",
		price: 19,
		icon: "glowing_star",
		features: [
			"Accès à tous les cours",
			"Quiz et flashcards illimités",
			"Discussions avec Milo en illimité",
			"Accès aux duels",
			"1 profil enfant et 1 profil parent",
		],
		cta: "C'est parti !",
	},
	{
		name: "Famille",
		price: 35,
		icon: "gem_stone",
		features: [
			"Tout le plan Essentiel",
			"Jusqu'à 4 enfants",
			"Dashboard parent avancé",
			"Cosmétiques exclusifs pour Milo",
		],
		cta: "Adopter Milo en famille",
		featured: true,
	},
];
