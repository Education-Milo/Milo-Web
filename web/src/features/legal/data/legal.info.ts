import { CONTACT_EMAIL } from "@features/landing/data/landing.data";

/// Informations juridiques partagées par toutes les pages légales.
///
/// Une valeur `null` est une information que le projet ne contient pas
/// encore : elle s'affiche dans les pages comme une étiquette « À compléter »
/// bien visible (composant Fill). Compléter ce fichier suffit à mettre à jour
/// toutes les pages.
///
/// Les informations techniques viennent du dépôt Milo-Backend (octobre 2026) :
/// à revérifier si l'hébergement, les modèles ou les durées changent.
export const LEGAL_INFO = {
	brand: "Milo",
	contactEmail: CONTACT_EMAIL,

	/**
	 * Éditeur du site. Milo est un projet étudiant de fin d'études (EIP) :
	 * aucune société ni association derrière, donc ni SIRET ni RCS.
	 * Équipe reprise du pitch deck du projet.
	 */
	publisher: {
		name: "l'équipe Milo",
		members: ["Meddi Gueran", "Jérémy Delfino", "Jérémy Bisson", "Noam Bouriche", "Luca Giglio", "Alexandre Vittenet"],
		school: "Epitech",
		program: "EIP (Epitech Innovative Project)",
		projectUrl: "https://eip.epitech.eu/projects/561",
	},

	/** Aucun abonnement n'est vendu tant que Milo reste un projet étudiant */
	isCommercial: false,

	hosting: {
		/** Application web (fichiers servis aux navigateurs) — cf. web/vercel.json */
		web: {
			name: "Vercel Inc.",
			address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
			url: "https://vercel.com",
		},
		/**
		 * API, base de données et envoi des emails : instance OVHcloud Public
		 * Cloud (réseau PCI-GRA11, Gravelines) ; le SPF du domaine n'autorise
		 * que les serveurs mail d'OVH.
		 */
		api: {
			name: "OVH SAS (OVHcloud)",
			address: "2 rue Kellermann, 59100 Roubaix, France",
			datacenter: "Gravelines (Nord), France",
			url: "https://www.ovhcloud.com",
		},
	},

	/** Modèles appelés par backend/chat.py et backend/moderation.py */
	ai: {
		provider: "OpenAI",
		models: ["GPT-5 mini", "GPT-4.1 mini", "GPT-4.1 nano"],
		moderationModel: "omni-moderation",
	},

	/** Lecture des photos de cours (backend/ocr.py) */
	ocrProvider: "Google Cloud Vision",

	/**
	 * Durées de conservation constatées dans le code du backend. Il n'existe
	 * pas encore de purge automatique : les données suivent la vie du compte.
	 */
	retention: {
		account: "Tant que ton compte existe. Il est supprimé, avec ton profil et ta progression, à ta demande.",
		activity: "Tant que ton compte existe ; effacées avec lui.",
		aiExchanges:
			"Tes messages à Milo et les photos que tu importes ne sont pas conservés : ils sont traités puis oubliés. Seuls le type d'activité (question posée, QCM généré…) et des mesures techniques (volume, durée) sont gardés.",
		moderation:
			"Seulement la catégorie et la date, jamais le contenu. Gardés après la suppression du compte, rattachés à un simple numéro.",
		securityLogs:
			"Sessions : 14 jours après la dernière utilisation. Appareils de confiance : 30 jours. Codes de vérification : 10 à 15 minutes.",
		/** Les messages du formulaire arrivent par email (Web3Forms) : rien dans le code */
		contact: null as string | null,
	},
};
