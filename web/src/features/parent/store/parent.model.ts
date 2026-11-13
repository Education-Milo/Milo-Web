import type { ProfileSummary } from "@shared/store/auth/auth.model";

/** Enfant suivi par le parent : un profil élève du compte famille. */
export type LinkedChild = ProfileSummary;

/**
 * Bilan hebdomadaire rédigé par l'IA. Forme attendue côté front : l'API ne
 * sert pas encore de bilans (voir parent.queries.ts), elle sera alignée sur
 * la route le jour où elle existera.
 */
export interface WeeklyReport {
	id: number;
	/** Premier et dernier jour de la semaine, ISO AAAA-MM-JJ */
	week_start: string;
	week_end: string;
	/** Texte narratif, paragraphes séparés par une ligne vide */
	text: string;
}

/**
 * Donnée de l'espace parent. `isUnavailable` : l'API n'expose pas encore la
 * route correspondante, l'écran affiche alors un état vide explicite plutôt
 * qu'une erreur.
 */
export interface ParentData<T> {
	data: T | undefined;
	isLoading: boolean;
	isError: boolean;
	isUnavailable: boolean;
}
