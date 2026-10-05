import type { Emoji3DName } from "@features/landing/data/landing.data";

/// Une feature à tester pendant le parcours bêta. Le contenu reprend le
/// document « Milo – Parcours utilisateur par feature » (octobre 2026).
export interface BetaFeature {
	id: string;
	title: string;
	icon: Emoji3DName;
	/// Où la trouver dans l'app
	entry: string;
	/// Ce que le testeur essaie de faire
	goal: string;
	/// Petites missions à réaliser avant de noter
	tasks: string[];
	/// Problèmes fréquents à cocher en un clic
	issues: string[];
	/// Feature réservée à un rôle (sinon proposée à tout le monde)
	onlyFor?: BetaRole;
}

export type BetaRole = "eleve" | "parent";

export const ROLES: { value: BetaRole; label: string; icon: Emoji3DName; hint: string }[] = [
	{ value: "eleve", label: "Élève", icon: "student", hint: "Je teste Milo pour mes révisions" },
	{ value: "parent", label: "Parent", icon: "teacher", hint: "Je teste Milo pour mon enfant" },
];

export const CLASSES = ["6e", "5e", "4e", "3e", "Autre"] as const;

export const DEVICES = ["Ordinateur", "Tablette", "Téléphone"] as const;

export const RATING_LABELS = ["", "Pas du tout", "Bof", "Correct", "Bien", "Génial"];

export const BETA_FEATURES: BetaFeature[] = [
	{
		id: "decouverte",
		title: "Découverte du site",
		icon: "rocket",
		entry: "Page d'accueil du site, puis « Se connecter »",
		goal: "Comprendre ce qu'est Milo et entrer dans l'application.",
		tasks: [
			"Parcours la page d'accueil jusqu'aux offres",
			"Repère les matières et les niveaux proposés",
			"Connecte-toi avec ton compte",
		],
		issues: [
			"Le premier écran paraît vide",
			"Je ne sais pas quelles matières sont proposées",
			"Texte difficile à lire",
			"Je n'ai pas compris à qui s'adresse Milo",
			"Connexion compliquée",
		],
	},
	{
		id: "accueil",
		title: "Accueil élève",
		icon: "fox",
		entry: "Juste après la connexion, ou menu « Accueil »",
		goal: "Savoir quoi faire maintenant et reprendre là où tu t'étais arrêté.",
		tasks: [
			"Clique sur « Continuer le cours » et « Nouvelle mission »",
			"Ouvre une actualité et la cloche de notifications",
			"Regarde tes missions du jour",
		],
		issues: [
			"Un bouton ne fait rien",
			"Les actualités ne sont pas cliquables",
			"Je ne comprends pas l'XP ou les pièces",
			"La mascotte disparaît",
			"Je ne sais pas par où commencer",
		],
	},
	{
		id: "cours",
		title: "Trouver une leçon",
		icon: "books",
		entry: "Menu « Cours »",
		goal: "Trouver la leçon qui correspond à ce que tu fais en classe.",
		tasks: [
			"Choisis ta classe puis une matière",
			"Descends jusqu'à une leçon (programme → chapitre → leçon)",
			"Ouvre la fenêtre de choix QCM / Cours avec Milo",
		],
		issues: [
			"Ma matière n'existe pas",
			"Il manque des leçons",
			"Trop de clics pour arriver à une leçon",
			"Fenêtre cachée sous le menu",
			"Fautes ou texte bizarre",
		],
	},
	{
		id: "qcm",
		title: "QCM",
		icon: "bullseye",
		entry: "Cours → une leçon → mode « QCM »",
		goal: "T'entraîner sur une leçon et voir si tu as compris.",
		tasks: [
			"Lance un QCM et réponds aux 5 questions",
			"Trompe-toi exprès sur une question",
			"Regarde l'écran de résultats et tes gains",
		],
		issues: [
			"Une bonne réponse comptée fausse",
			"Deux réponses identiques",
			"Pas d'explication après une erreur",
			"Chargement trop long",
			"Questions hors sujet",
			"Aucun XP ou pièce gagné",
		],
	},
	{
		id: "milo",
		title: "Cours et discussion avec Milo",
		icon: "speech_balloon",
		entry: "Carte « Discute avec Milo ! » sur l'accueil, ou Cours → leçon → « Cours avec Milo »",
		goal: "Apprendre une leçon avec Milo comme professeur, ou lui poser une question.",
		tasks: [
			"Suis une leçon guidée en entier (les 3 parties)",
			"Ouvre « Lire tout »",
			"Pose une question à Milo, avec puis sans le son",
		],
		issues: [
			"Pas de réponse sans le son",
			"Texte du tableau coupé",
			"« Lire tout » illisible",
			"Milo coupé à l'écran",
			"Chargement trop long",
			"Entrée n'envoie pas le message",
		],
	},
	{
		id: "import",
		title: "Import de document",
		icon: "card_index_dividers",
		entry: "Menu « Import document »",
		goal: "Faire travailler Milo sur le cours ou l'exercice de ton professeur.",
		tasks: [
			"Choisis un type (cours, bulletin ou exercice)",
			"Envoie une photo ou un PDF",
			"Génère un QCM ou discute avec Milo sur ce document",
		],
		issues: [
			"Je ne sais pas ce qui se passe après l'envoi",
			"Pas de bouton photo",
			"Analyse trop longue ou en échec",
			"Résultat sans rapport avec mon document",
			"Je ne suis pas à l'aise d'envoyer un bulletin",
		],
	},
	{
		id: "missions",
		title: "Missions et récompenses",
		icon: "glowing_star",
		entry: "Menu « Missions », ou bloc « Missions du jour » de l'accueil",
		goal: "Savoir quoi faire aujourd'hui pour gagner de l'XP et des pièces.",
		tasks: [
			"Termine au moins une mission du jour",
			"Essaie le bouton « Changer »",
			"Regarde la quête du mois",
		],
		issues: [
			"La quête du mois n'avance pas",
			"Rien ne se passe quand je finis une mission",
			"Je ne comprends pas « Changer »",
			"Coins, miloros, XP : je m'y perds",
			"Missions impossibles sans amis",
		],
	},
	{
		id: "duels",
		title: "Duels et amis",
		icon: "crossed_swords",
		entry: "Menus « Amis » et « Duels »",
		goal: "Ajouter un ami, le défier et monter au classement.",
		tasks: [
			"Ajoute un ami avec son pseudo",
			"Lance un duel contre lui",
			"Consulte ton historique et tes statistiques de duel",
		],
		issues: [
			"Je n'ai trouvé personne à défier",
			"Le duel ne s'est pas lancé",
			"Trop d'infos personnelles visibles",
			"Fenêtre cachée sous le menu",
			"Comptes bizarres dans la liste",
		],
	},
	{
		id: "boutique",
		title: "Boutique et Mon Milo",
		icon: "t_shirt",
		entry: "Menus « Boutique » et « Mon Milo »",
		goal: "Dépenser tes pièces pour personnaliser ton renard.",
		tasks: [
			"Filtre les objets par catégorie et rareté",
			"Achète un objet",
			"Habille ton Milo et prépare ta roue des duels",
		],
		issues: [
			"L'aperçu 3D reste vide",
			"Pas d'objets dans certaines catégories",
			"Trop cher",
			"Achat pas clair",
			"Mise en page cassée",
		],
	},
	{
		id: "stats",
		title: "Statistiques",
		icon: "bar_chart",
		entry: "Menu « Statistiques »",
		goal: "Voir si tu progresses et où tu en es.",
		tasks: [
			"Change la période (7, 30, 90 jours)",
			"Regarde ton point fort et ta moyenne de QCM",
			"Ouvre le graphique jour par jour",
		],
		issues: [
			"Trop de chiffres",
			"Je ne sais pas quoi faire après",
			"Les chiffres me paraissent faux",
			"Niveau 2 beaucoup trop loin",
		],
	},
	{
		id: "parent",
		title: "Espace parent",
		icon: "shield",
		entry: "Connexion avec un compte parent",
		goal: "Abonner son enfant, suivre ses progrès et garder le contrôle.",
		tasks: [
			"Crée ou rattache le profil de ton enfant",
			"Consulte son activité et ses progrès",
			"Cherche le planning de révisions et le contrôle parental",
		],
		issues: [
			"Je ne trouve pas le profil de mon enfant",
			"Pas assez d'informations sur ses progrès",
			"Contrôle parental insuffisant",
			"Offres ou prix pas clairs",
			"Inquiétude sur les données de mon enfant",
		],
		onlyFor: "parent",
	},
];
