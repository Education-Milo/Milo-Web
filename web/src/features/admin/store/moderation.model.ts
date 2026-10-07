export interface DayCount {
	date: string;
	count: number;
}

/** GET /admin/moderation */
export interface ModerationOverview {
	days: number;
	since: string;
	ai_requests_total: number;
	flagged_input: number;
	/** null (et non 0) quand ai_requests_total vaut 0 : rien n'a été mesuré */
	flagged_input_rate: number | null;
	/** 0 attendu : au-delà, une injection a probablement abouti */
	flagged_output: number;
	self_harm_events: number;
	self_harm_accounts: number;
	/** Trié par volume décroissant, familles déjà en français */
	by_family: { family: string; count: number }[];
	/** Complet, jours sans donnée à 0 */
	daily: DayCount[];
}

export type ModerationDirection = "input" | "output";

export interface ModerationEvent {
	id: number;
	user_id: number;
	/** null si le compte a été supprimé */
	username: string | null;
	route: string;
	direction: ModerationDirection;
	/** Détail technique (ex. self_harm_intent) */
	categories: string[];
	/** Regroupement en français, pour le filtre et l'affichage compact */
	families: string[];
	created_at: string;
}

/** GET /admin/moderation/events */
export interface ModerationEventsPage {
	total: number;
	limit: number;
	offset: number;
	/** false : seules les catégories sont conservées, jamais le message */
	content_stored: boolean;
	items: ModerationEvent[];
}

export interface ModerationEventsFilters {
	days: number;
	direction?: ModerationDirection;
	family?: string;
	user_id?: number;
	limit: number;
	offset: number;
}

/** GET /admin/ai-usage */
export interface AiUsage {
	days: number;
	since: string;
	total: number;
	/**
	 * generated : appel au modèle, donc facturé. cached : resservi, gratuit.
	 * blocked : arrêté par la modération avant tout appel. Ne jamais les
	 * additionner dans un chiffre présenté comme un coût.
	 */
	by_outcome: { generated: number; cached: number; blocked: number };
	/** Requêtes facturées uniquement */
	tokens: { input: number; output: number };
	/** null quand aucune requête n'est mesurée */
	latency_ms: { p50: number; p95: number } | null;
	/** Clés variables : une absence vaut 0 */
	by_route: { route: string; generated?: number; cached?: number; blocked?: number }[];
	/** Même longueur et mêmes dates que daily_generated */
	daily: DayCount[];
	daily_generated: DayCount[];
	top_users: { user_id: number; username: string | null; count: number }[];
	distinct_users: number;
}
