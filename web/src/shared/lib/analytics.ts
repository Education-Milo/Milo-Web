/// Mesure d'audience et de conversion de Milo.
///
/// Deux outils, tous deux SANS cookie ni identifiant stocké sur l'appareil
/// (dispensés de consentement : pas de bandeau cookies, cf. /cookies) :
///  - Vercel Web Analytics + Speed Insights : visiteurs, pages vues, sources,
///    pays, appareils, Core Web Vitals. À activer dans le tableau de bord Vercel.
///  - Umami (si VITE_UMAMI_WEBSITE_ID est défini) : événements personnalisés,
///    objectifs, entonnoirs (taux de conversion), UTM.
///
/// Le reste du code n'appelle que `trackEvent` / `trackPageview` : changer
/// d'outil ne touche que ce fichier.
import { inject, pageview as vercelPageview, track as vercelTrack } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

/** Événements suivis : la liste fait office de plan de marquage. */
export type AnalyticsEvent =
	/** Clic sur un appel à l'action (S'inscrire, Se connecter, Contact…) */
	| "cta_click"
	/** Lien vers un autre site (réseaux sociaux, Epitech…) */
	| "outbound_click"
	/** Clic sur l'adresse email de contact */
	| "email_click"
	/** Profondeur de défilement de la page d'accueil (25/50/75/100 %) */
	| "scroll_depth"
	/** Question de FAQ dépliée */
	| "faq_open"
	/** Inscription, étape 1 : profil choisi (élève, parent…) */
	| "signup_role_selected"
	/** Inscription, étape 2 : formulaire envoyé */
	| "signup_submitted"
	/** Inscription réussie : LA conversion principale */
	| "signup_completed"
	/** Inscription refusée (email déjà pris, validation…) */
	| "signup_failed"
	/** Connexion réussie */
	| "login"
	/** Formulaire de contact envoyé : prise de contact */
	| "contact_submitted"
	/** Retour du parcours bêta envoyé */
	| "beta_feedback_submitted";

type Props = Record<string, string | number | boolean | null | undefined>;

interface UmamiTracker {
	track: {
		(event: string, data?: Record<string, unknown>): void;
		(payload: (props: Record<string, unknown>) => Record<string, unknown>): void;
	};
}

declare global {
	interface Window {
		umami?: UmamiTracker;
	}
}

/// Identifiant public du site dans Umami Cloud (il finit dans le HTML de toute
/// façon). Surchargeable par VITE_UMAMI_WEBSITE_ID ; ne PAS coller la balise
/// <script> fournie par Umami dans index.html : le script est chargé ici, avec
/// des chemins normalisés et sans double comptage.
const UMAMI_WEBSITE_ID =
	(import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined) || "d0522626-18b7-4ed1-9d1b-2ee59d8f7a1f";
const UMAMI_SCRIPT_URL =
	(import.meta.env.VITE_UMAMI_SCRIPT_URL as string | undefined) || "https://cloud.umami.is/script.js";
/** Seul le site de production est compté (pas localhost ni les préversions) */
const PROD_HOSTS = ["milo-education.fr", "www.milo-education.fr"];

const ATTRIBUTION_KEY = "milo_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

let initialized = false;
let speedInsights: ReturnType<typeof injectSpeedInsights> | null = null;
/** Événements émis avant le chargement du script Umami */
const umamiQueue: (() => void)[] = [];

const isProdHost = () => typeof window !== "undefined" && PROD_HOSTS.includes(window.location.hostname);

/**
 * Chemin regroupable : les identifiants (numériques, UUID, jetons) sont
 * remplacés par « :id » pour que /courses/12 et /courses/34 comptent ensemble
 * et qu'aucun identifiant ne parte dans les statistiques.
 */
export const normalizePath = (pathname: string): string =>
	pathname
		.split("/")
		.map((segment) =>
			/^\d+$/.test(segment) ||
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
			/^[A-Za-z0-9_-]{24,}$/.test(segment)
				? ":id"
				: segment,
		)
		.join("/") || "/";

/** URL débarrassée des paramètres, sauf les UTM (jamais d'email ni de jeton) */
const cleanUrl = (url: string): string => {
	try {
		const parsed = new URL(url, window.location.origin);
		const kept = new URLSearchParams();
		UTM_KEYS.forEach((key) => {
			const value = parsed.searchParams.get(key);
			if (value) kept.set(key, value);
		});
		const query = kept.toString();
		return `${parsed.origin}${normalizePath(parsed.pathname)}${query ? `?${query}` : ""}`;
	} catch {
		return url;
	}
};

const safeSession = {
	get(key: string): string | null {
		try {
			return window.sessionStorage.getItem(key);
		} catch {
			return null;
		}
	},
	set(key: string, value: string) {
		try {
			window.sessionStorage.setItem(key, value);
		} catch {
			// navigation privée stricte : on se passe de l'attribution
		}
	},
};

export interface Attribution {
	source: string;
	medium?: string;
	campaign?: string;
	term?: string;
	content?: string;
	landing: string;
}

/**
 * Source de la visite (premier contact de l'onglet) : UTM si présents,
 * sinon le site référent, sinon « direct ». Gardée le temps de l'onglet
 * (sessionStorage) pour rattacher une inscription à la campagne qui l'a amenée.
 */
const captureAttribution = (): Attribution => {
	const existing = safeSession.get(ATTRIBUTION_KEY);
	if (existing) {
		try {
			return JSON.parse(existing) as Attribution;
		} catch {
			// valeur corrompue : on recalcule
		}
	}
	const params = new URLSearchParams(window.location.search);
	let referrerHost = "";
	try {
		referrerHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
	} catch {
		referrerHost = "";
	}
	const ownSite = referrerHost === "milo-education.fr";
	const attribution: Attribution = {
		source: params.get("utm_source") || (referrerHost && !ownSite ? referrerHost : "direct"),
		medium: params.get("utm_medium") || (referrerHost && !ownSite ? "referral" : undefined),
		campaign: params.get("utm_campaign") || undefined,
		term: params.get("utm_term") || undefined,
		content: params.get("utm_content") || undefined,
		landing: normalizePath(window.location.pathname),
	};
	safeSession.set(ATTRIBUTION_KEY, JSON.stringify(attribution));
	return attribution;
};

export const getAttribution = (): Attribution | null => {
	const raw = safeSession.get(ATTRIBUTION_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as Attribution;
	} catch {
		return null;
	}
};

const loadUmami = () => {
	if (!UMAMI_WEBSITE_ID || document.querySelector("script[data-website-id]")) return;
	const script = document.createElement("script");
	script.defer = true;
	script.src = UMAMI_SCRIPT_URL;
	script.dataset.websiteId = UMAMI_WEBSITE_ID;
	// Pages vues envoyées à la main, avec le chemin normalisé
	script.dataset.autoTrack = "false";
	script.dataset.domains = PROD_HOSTS.join(",");
	script.onload = () => {
		umamiQueue.splice(0).forEach((send) => send());
	};
	document.head.appendChild(script);
};

const withUmami = (send: (umami: UmamiTracker) => void) => {
	if (!UMAMI_WEBSITE_ID) return;
	if (window.umami) send(window.umami);
	else umamiQueue.push(() => window.umami && send(window.umami));
};

/** À appeler une fois au démarrage de l'application. */
export const initAnalytics = (): void => {
	if (initialized || typeof window === "undefined") return;
	initialized = true;
	captureAttribution();

	// En dev et sur les préversions, rien n'est envoyé (mode debug Vercel en console)
	const production = import.meta.env.PROD && isProdHost();
	try {
		inject({
			mode: production ? "production" : "development",
			disableAutoTrack: true,
			beforeSend: (event) => ({ ...event, url: cleanUrl(event.url) }),
		});
		speedInsights = injectSpeedInsights({
			route: normalizePath(window.location.pathname),
			beforeSend: (event) => ({ ...event, url: cleanUrl(event.url) }),
		});
	} catch {
		// la mesure ne doit jamais casser l'application
	}
	if (production) loadUmami();
};

/** Page vue : appelée à chaque changement de route (AnalyticsTracker). */
export const trackPageview = (pathname: string): void => {
	const route = normalizePath(pathname);
	const url = cleanUrl(window.location.href);
	try {
		vercelPageview({ route, path: route });
		speedInsights?.setRoute(route);
	} catch {
		// silencieux
	}
	withUmami((umami) =>
		umami.track((props) => ({
			...props,
			url: url.replace(window.location.origin, ""),
			title: document.title,
		})),
	);
};

/** Événement personnalisé (conversion, clic, envoi de formulaire…). */
export const trackEvent = (event: AnalyticsEvent, props: Props = {}): void => {
	const clean: Record<string, string | number | boolean> = {};
	Object.entries(props).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") clean[key] = value;
	});
	clean.page = normalizePath(window.location.pathname);

	// Les conversions emportent la source de la visite
	if (event.startsWith("signup_") || event === "contact_submitted") {
		const attribution = getAttribution();
		if (attribution) {
			clean.source = attribution.source;
			if (attribution.medium) clean.medium = attribution.medium;
			if (attribution.campaign) clean.campaign = attribution.campaign;
			clean.landing = attribution.landing;
		}
	}

	if (import.meta.env.DEV) console.debug("[analytics]", event, clean);
	try {
		vercelTrack(event, clean);
	} catch {
		// silencieux
	}
	withUmami((umami) => umami.track(event, clean));
};
