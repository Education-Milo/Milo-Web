/**
 * Bascule d'un admin vers un profil de démonstration.
 *
 * Ce qui doit survivre à un rechargement de la page est gardé en
 * sessionStorage : propre à l'onglet, effacé à sa fermeture. Le jeton de démo
 * n'a aucun droit admin.
 *
 * Le jeton admin, lui, n'est PAS stocké en mode cookie : le cookie httpOnly
 * de refresh de l'admin reste intact pendant la bascule, et /token/refresh
 * redonne un jeton admin pour revenir ou pour redemander un jeton de démo à
 * l'expiration. Seul le mode legacy (sans cookie) le met de côté ici.
 */
export interface DemoSession {
	accountId: number;
	role: string;
	username: string;
	/** Jeton d'accès du profil de démo (pas de refresh token pour la démo) */
	accessToken: string;
	/** Mode legacy uniquement : jeton admin à restaurer au retour */
	adminToken?: string;
}

const DEMO_SESSION_KEY = "milo_demo_session";

export const loadDemoSession = (): DemoSession | null => {
	try {
		const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<DemoSession>;
		if (typeof parsed.accountId !== "number" || typeof parsed.accessToken !== "string") return null;
		return parsed as DemoSession;
	} catch {
		return null;
	}
};

export const saveDemoSession = (session: DemoSession) => {
	try {
		sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
	} catch {
		// stockage indisponible : la bascule ne survivra pas à un rechargement
	}
};

export const clearDemoSession = () => {
	try {
		sessionStorage.removeItem(DEMO_SESSION_KEY);
	} catch {
		// rien à nettoyer
	}
};

export const isDemoActive = () => loadDemoSession() !== null;
