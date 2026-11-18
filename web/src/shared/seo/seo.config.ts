/// Référencement : métadonnées de chaque page publique.
///
/// Source unique utilisée à la fois :
///  - dans l'application (SeoHead met à jour <head> à chaque navigation) ;
///  - au build (tools/seo/prerender.ts génère une page HTML statique par route,
///    le sitemap, llms.txt…), pour que moteurs de recherche, IA et aperçus de
///    liens des réseaux sociaux voient le vrai contenu sans exécuter le JS.
///
/// ⚠️ Imports RELATIFS uniquement : ce fichier est aussi chargé par
/// vite.config.ts, qui ne connaît pas les alias (@features…).
import { LEGAL_DOCS } from "../../features/legal/data/legal.docs";

export const SITE_URL = "https://milo-education.fr";
export const SITE_NAME = "Milo";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const SOCIAL_PROFILES = [
	"https://www.instagram.com/milo_educ/",
	"https://www.linkedin.com/company/107749290/",
];

export interface SeoRoute {
	path: string;
	/** Titre complet de l'onglet et des résultats de recherche (≈ 60 caractères max) */
	title: string;
	/** Description des résultats de recherche (≈ 155 caractères max) */
	description: string;
	/** Titre des aperçus de liens (réseaux sociaux, messageries) si différent */
	ogTitle?: string;
	image?: string;
	changefreq: "weekly" | "monthly" | "yearly";
	priority: number;
	/** false : page publique mais sans intérêt dans les résultats (noindex) */
	index?: boolean;
}

const HOME_DESCRIPTION =
	"Milo, le renard qui fait aimer réviser aux collégiens de la 6e à la 3e : cours expliqués, QCM, exercices sur mesure, missions et duels entre amis, conformes au programme officiel.";

export const SEO_ROUTES: SeoRoute[] = [
	{
		path: "/",
		title: "Milo, le compagnon qui fait aimer réviser | Révisions collège 6e–3e",
		ogTitle: "Milo, le compagnon qui fait aimer réviser",
		description: HOME_DESCRIPTION,
		changefreq: "weekly",
		priority: 1,
	},
	{
		path: "/faq",
		title: "Questions fréquentes – Milo, révisions et tuteur IA au collège",
		description:
			"Tout savoir sur Milo : matières et programme du collège, tuteur IA qui guide sans donner les réponses, duels, sécurité des données des enfants, comptes parents et tarifs.",
		changefreq: "monthly",
		priority: 0.8,
	},
	{
		path: "/contact",
		title: "Contacter l'équipe Milo",
		description:
			"Une question, un bug, une idée ou un partenariat ? Écris à l'équipe Milo, le compagnon de révision des collégiens. On lit tous les messages.",
		changefreq: "yearly",
		priority: 0.6,
	},
	{
		path: "/register",
		title: "Créer un compte Milo – élève ou parent",
		description:
			"Crée ton compte Milo en une minute : espace élève de la 6e à la 3e ou espace parent pour suivre les progrès de vos enfants.",
		changefreq: "yearly",
		priority: 0.7,
	},
	{
		path: "/login",
		title: "Connexion – Milo",
		description: "Connecte-toi à Milo pour retrouver tes cours, tes missions du jour et tes duels.",
		changefreq: "yearly",
		priority: 0.4,
	},
	...LEGAL_DOCS.map<SeoRoute>((doc) => ({
		path: doc.path,
		title: `${doc.title} | Milo`,
		description: `${doc.description} ${doc.title} de Milo, le compagnon de révision des collégiens.`,
		changefreq: "yearly",
		priority: doc.slug === "charte" ? 0.5 : 0.3,
	})),
];

export const findSeoRoute = (pathname: string): SeoRoute | undefined =>
	SEO_ROUTES.find((route) => route.path === pathname);

/** Préfixes privés (espace élève, parent, admin) : jamais indexés */
export const PRIVATE_PREFIXES = [
	"/home",
	"/milo",
	"/courses",
	"/course-milo",
	"/qcm",
	"/exercise-result",
	"/exercice-genere",
	"/ocr",
	"/missions",
	"/stats",
	"/duels",
	"/boutique",
	"/personnalisation",
	"/mon-milo",
	"/bienvenue",
	"/friends",
	"/profile",
	"/parent",
	"/prof",
	"/admin",
	"/unauthorized",
	"/forgot-password",
	"/feedback",
];

export const isPrivatePath = (pathname: string): boolean =>
	PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/* ---------- Données structurées (JSON-LD, schema.org) ---------- */

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#application`;

export const organizationLd = () => ({
	"@type": ["Organization", "EducationalOrganization"],
	"@id": ORGANIZATION_ID,
	name: SITE_NAME,
	alternateName: "Milo Education",
	url: SITE_URL,
	logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png`, width: 512, height: 512 },
	image: DEFAULT_OG_IMAGE,
	description:
		"Milo est un projet étudiant Epitech (EIP) : une plateforme de révision ludique avec un tuteur IA pour les collégiens de la 6e à la 3e.",
	email: "miloeducationeip@gmail.com",
	sameAs: SOCIAL_PROFILES,
	parentOrganization: { "@type": "CollegeOrUniversity", name: "Epitech", url: "https://www.epitech.eu" },
	areaServed: { "@type": "Country", name: "France" },
	knowsLanguage: "fr",
});

export const websiteLd = () => ({
	"@type": "WebSite",
	"@id": WEBSITE_ID,
	url: SITE_URL,
	name: SITE_NAME,
	description: HOME_DESCRIPTION,
	inLanguage: "fr-FR",
	publisher: { "@id": ORGANIZATION_ID },
});

export const applicationLd = (plans: { name: string; price: number }[]) => ({
	"@type": ["WebApplication", "SoftwareApplication"],
	"@id": APP_ID,
	name: SITE_NAME,
	url: SITE_URL,
	applicationCategory: "EducationalApplication",
	applicationSubCategory: "Soutien scolaire",
	operatingSystem: "Web, navigateur récent",
	inLanguage: "fr-FR",
	description: HOME_DESCRIPTION,
	image: DEFAULT_OG_IMAGE,
	publisher: { "@id": ORGANIZATION_ID },
	audience: {
		"@type": "EducationalAudience",
		educationalRole: "student",
		audienceType: "Collégiens de la 6e à la 3e et leurs parents",
	},
	educationalLevel: ["6e", "5e", "4e", "3e"],
	featureList: [
		"Cours expliqués au tableau par Milo",
		"Tuteur IA qui guide par questions, sans donner la réponse",
		"QCM et flashcards",
		"Exercices personnalisés selon les centres d'intérêt",
		"Import de cours par photo",
		"Missions du jour et coins",
		"Duels en direct entre amis et ligues",
		"Tableau de bord parent et bilans hebdomadaires",
	],
	offers: plans.map((plan) => ({
		"@type": "Offer",
		name: plan.name,
		price: plan.price,
		priceCurrency: "EUR",
		category: "subscription",
		url: `${SITE_URL}/#tarifs`,
	})),
});

export const faqLd = (entries: { question: string; answer: string }[]) => ({
	"@type": "FAQPage",
	mainEntity: entries.map((entry) => ({
		"@type": "Question",
		name: entry.question,
		acceptedAnswer: { "@type": "Answer", text: entry.answer },
	})),
});

export const breadcrumbLd = (route: SeoRoute) => ({
	"@type": "BreadcrumbList",
	itemListElement: [
		{ "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
		{
			"@type": "ListItem",
			position: 2,
			name: route.title.split(" – ")[0],
			item: `${SITE_URL}${route.path}`,
		},
	],
});

export const webPageLd = (route: SeoRoute) => ({
	"@type": route.path === "/contact" ? "ContactPage" : "WebPage",
	"@id": `${SITE_URL}${route.path}#webpage`,
	url: `${SITE_URL}${route.path}`,
	name: route.title,
	description: route.description,
	inLanguage: "fr-FR",
	isPartOf: { "@id": WEBSITE_ID },
	about: { "@id": APP_ID },
});

export const canonicalFor = (pathname: string) => `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
