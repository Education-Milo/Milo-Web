/// Contenu éditorial des pages publiques (Vitrine, FAQ, Contact), séparé des
/// composants pour pouvoir le modifier sans toucher à la mise en page ni aux
/// animations.

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

/* ---------- Page FAQ ---------- */

export type FaqCategory = "Général" | "Pédagogie" | "Jeu" | "Compte" | "Sécurité";

/// Catégories dans l'ordre d'affichage, avec leur icône 3D
export const FAQ_CATEGORIES: { name: FaqCategory; icon: Emoji3DName }[] = [
	{ name: "Général", icon: "light_bulb" },
	{ name: "Pédagogie", icon: "brain" },
	{ name: "Jeu", icon: "video_game" },
	{ name: "Compte", icon: "money_bag" },
	{ name: "Sécurité", icon: "shield" },
];

export const FAQ_ENTRIES: { category: FaqCategory; question: string; answer: string }[] = [
	// Général
	{
		category: "Général",
		question: "C'est quoi exactement Milo ?",
		answer:
			"Milo est une plateforme ludo-éducative interactive qui transforme les révisions scolaires en une aventure pour les enfants de la 6ème à la 3ème.",
	},
	{
		category: "Général",
		question: "Quelles matières sont disponibles ?",
		answer: "Toutes les matières présentes dans le programme de l'éducation nationnale sont disponibles.",
	},
	{
		category: "Général",
		question: "Milo est-il conforme au programme de l'Éducation Nationale ?",
		answer:
			"Oui, tous nos contenus sont conçus pour suivre scrupuleusement le programme officiel français par niveau scolaire. Les changements dans le programme se font automatiquement !",
	},
	{
		category: "Général",
		question: "Est-ce que Milo peut aider pour les devoirs du soir ?",
		answer:
			"Absolument ! Milo agit comme un tuteur, un professeur particulier: il peut expliquer un énoncé d'exercice ou une leçon que l'enfant n'a pas comprise à l'école. Il l'aidera à résoudre ses exercices, lui réexpliquera les notions qu'il n'a pas compris et lui donnera des exercices basés sur ses centres d'intérêts ainsi que sur sa manière d'apprendre.",
	},
	{
		category: "Général",
		question: "Faut-il une connexion internet pour utiliser Milo ?",
		answer:
			"Oui, une connexion est nécessaire pour que l'IA puisse interagir en temps réel et pour synchroniser la progression de l'enfant.",
	},
	{
		category: "Général",
		question: "Milo est-il disponible sur smartphone ?",
		answer:
			"Oui, l'application est optimisée pour tablettes (recommandé pour le confort) et pour smartphones iOS et Android.",
	},
	{
		category: "Général",
		question: "Qu'est-ce qui différencie Milo d'un simple cahier de vacances ?",
		answer:
			"L'interactivité ! Milo répond aux questions de l'enfant oralement ou par écrit et adapte la difficulté en fonction de ses réussites. Les exercices sont disponibles en illimités pour l'enfant et le contexte est beaucoup plus amusant.",
	},

	// Pédagogie & troubles dys
	{
		category: "Pédagogie",
		question: "Comment Milo aide-t-il les enfants dyslexiques ?",
		answer:
			"Milo intègre des polices spécifiques (OpenDyslexic), des espacements adaptés et une lecture audio systématique de tous les textes.",
	},
	{
		category: "Pédagogie",
		question: "Mon enfant a des troubles de la dyscalculie, Milo est-il adapté ?",
		answer:
			"Oui, nous utilisons des méthodes de visualisation concrètes et des décompositions d'étapes simplifiées pour les concepts mathématiques.",
	},
	{
		category: "Pédagogie",
		question: "Comment fonctionne l'importation de cours ?",
		answer:
			"C'est magique ! Prenez en photo la leçon du cahier, et Milo l'analyse pour créer des quiz et des fiches de révisions personnalisées sur ce contenu précis.",
	},
	{
		category: "Pédagogie",
		question: "Milo donne-t-il les réponses trop facilement ?",
		answer:
			"Non. Sa pédagogie est basée sur l'étayage : il donne des indices et pose des questions intermédiaires pour faire cheminer l'enfant vers la solution. L'enfant n'aura jamais la réponse à son exercice, il aura simplement de l'aide dans le cheminement pour réussir l'exercice donné par le professeur. Si un exercice est généré par Milo, l'enfant aura la possibilité de vérifier si son résultat est bon, mais cela est uniquement disponible pour ceux crées par Milo pour s'entrainer.",
	},
	{
		category: "Pédagogie",
		question: "Peut-on utiliser Milo pour apprendre les langues étrangères ?",
		answer:
			"Oui, Milo propose des modules d'apprentissage pour les langues disponibles dans le programme scolaire du collège. (Anglais, Italien, Espagnol, Allemand)",
	},
	{
		category: "Pédagogie",
		question: "Comment l'IA de Milo sait-elle si l'enfant s'ennuie ?",
		answer:
			"L'algorithme analyse le temps de réponse et le taux de réussite. Si c'est trop facile, Milo corse le défi ; si c'est trop dur, il simplifie les explications.",
	},

	// Jeu & motivation
	{
		category: "Jeu",
		question: "C'est quoi le système de personnalisation de Milo ?",
		answer:
			"En réussissant ses exercices, l'enfant gagne des pièces pour acheter des chapeaux, des vêtements ou des décors pour son compagnon Milo. Le but est d'avoir une satisfaction à la réussite d'un exercice, récompenser l'enfant et pousser la gamification à son paroxysme",
	},
	{
		category: "Jeu",
		question: "Comment fonctionnent les Duels ?",
		answer:
			"L'enfant peut défier ses amis (ou d'autres élèves de son niveau) sur des quiz rapides de 10 questions. C'est 100% sécurisé et sans chat libre.",
	},
	{
		category: "Jeu",
		question: "Quelles sont les récompenses journalières ?",
		answer:
			"Chaque jour, une 'Mission de Milo' est proposée. La compléter permet de gagner des pièces bonus, des cosmétiques... Nous souhaitons derrière ce système que l'enfant soit heureux de venir travailler avec Milo et ne voit pas ça comme une corvée.",
	},
	{
		category: "Jeu",
		question: "Y a-t-il un classement entre les élèves ?",
		answer:
			"Il existe des ligues (Bronze, Argent, Or...). L'enfant progresse dans sa ligue à son rythme, ce qui favorise une compétition saine et motivante.",
	},
	{
		category: "Jeu",
		question: "À quoi servent les points et les victoires ?",
		answer:
			"Tes points te permettent de grimper dans le classement des ligues (Bronze, Argent, Or...) et de débloquer des récompenses uniques pour personnaliser ton Milo et ton profil !",
	},
	{
		category: "Jeu",
		question: "Mon enfant est très compétitif, comment éviter les frustrations ?",
		answer:
			"Milo ajuste automatiquement les adversaires en Duel pour que les matchs soient équilibrés. De plus, les récompenses sont aussi basées sur la participation et l'effort, pas seulement sur la victoire.",
	},

	// Compte & abonnement
	{
		category: "Compte",
		question: "Puis-je utiliser Milo sur plusieurs tablettes ?",
		answer: "Oui ! Votre abonnement permet de connecter votre compte sur tous vos appareils (iOS, Android, Web).",
	},
	{
		category: "Compte",
		question: "Comment résilier mon abonnement ?",
		answer: "La résiliation se fait en un clic depuis votre tableau de bord parent, sans engagement.",
	},
	{
		category: "Compte",
		question: "Puis-je avoir plusieurs profils enfants sur un seul compte ?",
		answer:
			"Le plan 'Famille' permet de créer jusqu'à 4 profils distincts, chacun avec sa propre progression et son niveau scolaire. Si vous souscrivez au plan Individuel, un seul enfant pourra bénéficier de Milo. Attention, faire travailler plusieurs enfants sur un seul Milo est contre-productif, même des frères et soeurs n'ont pas la même méthode d'apprentissage, Milo ne pourra pas élaborer un planning de révision ainsi que comprendre l'enfant. La spécificité de Milo est d'avoir un accompagnant qui comprend l'enfant à qui il est affecté.",
	},
	{
		category: "Compte",
		question: "Quelles sont les méthodes de paiement acceptées ?",
		answer:
			"Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal et les paiements via Apple Pay / Google Pay.",
	},
	{
		category: "Compte",
		question: "Existe-t-il une période d'essai gratuite ?",
		answer:
			"Oui, nous offrons 7 jours d'essai complet pour tester toutes les fonctionnalités de Milo avec votre enfant.",
	},
	{
		category: "Compte",
		question: "Le tableau de bord parent est-il détaillé ?",
		answer:
			"Très ! Vous recevez un rapport hebdomadaire par mail et pouvez voir en temps réel les forces et faiblesses de votre enfant par matière.",
	},
	{
		category: "Compte",
		question: "Puis-je mettre l'abonnement en pause pendant les vacances ?",
		answer:
			"Non, Milo travaille également pendant les vacances. Ces périodes sont très néfastes pour les enfants qui négligent les révisions quotidiennes, en quelques QCM qui prennent 5 min par jour, l'enfant maintient un rythme de travail régulier qui lui permet de ne rien oublier.",
	},

	// Sécurité & confidentialité
	{
		category: "Sécurité",
		question: "Mes données sont-elles sécurisées ?",
		answer:
			"Absolument. Milo est 100% conforme RGPD et nous ne diffusons aucune publicité, jamais. Nous faisons très attention aux données et encore plus quand cela concerne nos enfants ou des données sensibles.",
	},
	{
		category: "Sécurité",
		question: "L'IA peut-elle dire des choses inappropriées ?",
		answer:
			"Non. Notre IA est bridée par des filtres de sécurité stricts ('guardrails') qui l'empêchent de sortir du cadre strictement scolaire et bienveillant. Plusieurs tests ont été réalisé pour affirmer cette information.",
	},
	{
		category: "Sécurité",
		question: "Vendez-vous les données à des tiers ?",
		answer: "Jamais. Les données de progression ne servent qu'à l'amélioration de l'apprentissage de votre enfant.",
	},
	{
		category: "Sécurité",
		question: "Est-ce que l'enfant peut naviguer sur internet via Milo ?",
		answer: "Non, Milo est un environnement fermé (clôturé). Aucun lien externe n'est accessible pour l'enfant.",
	},
	{
		category: "Sécurité",
		question: "Comment l'identité des autres enfants est-elle protégée ?",
		answer:
			"Dans les modes duels, seuls les prénoms (seulement) et les avatars sont visibles. Aucune information personnelle autre que le prénom n'est partagée.",
	},
	{
		category: "Sécurité",
		question: "Où sont stockées nos données ?",
		answer: "Toutes nos données sont hébergées sur des serveurs sécurisés situés en France.",
	},
];

/* ---------- Page Contact ---------- */

export const CONTACT_EMAIL = "miloeducationeip@gmail.com";

/// Sujets du formulaire : `value` est repris tel quel dans l'objet du mail
export const CONTACT_SUBJECTS: { value: string; label: string; icon: Emoji3DName }[] = [
	{ value: "info", label: "Informations générales", icon: "light_bulb" },
	{ value: "support", label: "Besoin d'aide (Support)", icon: "speech_balloon" },
	{ value: "press", label: "Partenariats", icon: "glowing_star" },
	{ value: "betatest", label: "Programme Beta-Testeur", icon: "rocket" },
];
