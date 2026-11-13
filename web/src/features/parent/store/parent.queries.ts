import { useMemo } from "react";
import { useAccountProfiles } from "@features/account/store/account.queries";
import type { ActivityItem, StatsResponse } from "@features/stats/store/stats.model";
import type { LinkedChild, ParentData, WeeklyReport } from "@features/parent/store/parent.model";

/**
 * Données de l'espace parent.
 *
 * Disponible dans l'API :
 * - GET /profiles : les profils élèves du compte famille, c'est-à-dire les
 *   enfants que le parent suit (accepte le jeton du profil Parent) ;
 * - POST /profiles : ajout d'un profil élève au compte (useCreateProfile,
 *   mot de passe du compte exigé, refusé sur un profil de démonstration).
 *
 * Absent de l'API au 13/11/2026 (aucune route, vérifié sur le back et en
 * production). Les écrans affichent un état vide explicite en attendant :
 * - liaison d'un compte élève par un code généré côté élève (F-26) ;
 * - statistiques d'un enfant lisibles par son parent (F-27). Le back a déjà
 *   la fonction d'agrégat (`compute_stats`, même forme que
 *   GET /tracking/stats/me), il manque la route ;
 * - journal d'activité d'un enfant pour son parent (F-27, F-28) ;
 * - bilans hebdomadaires rédigés par l'IA (F-28).
 *
 * Pour brancher une route : remplacer le hook concerné par un useQuery,
 * les composants lisent déjà `data`, `isLoading`, `isError` et `isUnavailable`.
 */

const UNAVAILABLE = { data: undefined, isLoading: false, isError: false, isUnavailable: true } as const;

/** Enfants suivis : les profils « Enfant » du compte. */
export const useLinkedChildren = () => {
	const query = useAccountProfiles();
	const children = useMemo<LinkedChild[]>(
		() => (query.data ?? []).filter((profile) => profile.role === "Enfant"),
		[query.data],
	);
	return {
		children,
		/** Tous les profils du compte (parents compris), pour la limite de profils */
		profileCount: query.data?.length ?? 0,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
};

/** Statistiques de la semaine d'un enfant (forme de GET /tracking/stats/me). Route absente. */
export const useChildStats = (_childId: number | null): ParentData<StatsResponse> => UNAVAILABLE;

/** Dernières activités d'un enfant (forme de GET /tracking/activity/me). Route absente. */
export const useChildActivity = (_childId: number | null): ParentData<ActivityItem[]> => UNAVAILABLE;

/** Bilans hebdomadaires d'un enfant, du plus récent au plus ancien. Route absente. */
export const useWeeklyReports = (_childId: number | null): ParentData<WeeklyReport[]> => UNAVAILABLE;

/** Liaison d'un compte élève par code. Route absente : le formulaire reste désactivé. */
export const LINK_BY_CODE_AVAILABLE = false;
