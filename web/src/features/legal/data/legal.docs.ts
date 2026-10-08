import type { Emoji3DName } from "@features/landing/data/landing.data";

export type LegalSlug = "mentions" | "confidentialite" | "cookies" | "cgu" | "cgv" | "charte";

export interface LegalDoc {
	slug: LegalSlug;
	path: string;
	title: string;
	/** Libellé court (footer, liens entre documents) */
	shortTitle: string;
	description: string;
	icon: Emoji3DName;
	updatedAt: string;
	version: string;
}

/// Documents légaux, dans l'ordre d'affichage (footer, liens entre pages).
/// Changer un texte : mettre à jour `updatedAt` et `version` du document.
export const LEGAL_DOCS: LegalDoc[] = [
	{
		slug: "mentions",
		path: "/mentions",
		title: "Mentions légales",
		shortTitle: "Mentions légales",
		description: "Qui édite et héberge Milo.",
		icon: "card_index_dividers",
		updatedAt: "8 octobre 2026",
		version: "1.0",
	},
	{
		slug: "cgu",
		path: "/cgu",
		title: "Conditions générales d'utilisation",
		shortTitle: "CGU",
		description: "Les règles du jeu pour utiliser Milo.",
		icon: "books",
		updatedAt: "8 octobre 2026",
		version: "1.0",
	},
	{
		slug: "cgv",
		path: "/cgv",
		title: "Conditions générales de vente",
		shortTitle: "CGV",
		description: "Abonnements, essai gratuit et résiliation.",
		icon: "money_bag",
		updatedAt: "8 octobre 2026",
		version: "1.0",
	},
	{
		slug: "confidentialite",
		path: "/confidentialite",
		title: "Politique de confidentialité",
		shortTitle: "Confidentialité",
		description: "Les données que nous utilisons, et pourquoi.",
		icon: "locked",
		updatedAt: "8 octobre 2026",
		version: "1.0",
	},
	{
		slug: "cookies",
		path: "/cookies",
		title: "Cookies et stockage local",
		shortTitle: "Cookies",
		description: "Ce que Milo garde dans ton navigateur.",
		icon: "coin",
		updatedAt: "8 octobre 2026",
		version: "1.0",
	},
	{
		slug: "charte",
		path: "/charte",
		title: "Charte de l'IA",
		shortTitle: "Charte IA",
		description: "Comment le tuteur Milo utilise l'intelligence artificielle.",
		icon: "brain",
		updatedAt: "8 octobre 2026",
		version: "1.0",
	},
];

export const getLegalDoc = (slug: LegalSlug) => LEGAL_DOCS.find((doc) => doc.slug === slug)!;
