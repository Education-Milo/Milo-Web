import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
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
 *   mot de passe du compte exigé, refusé sur un profil de démonstration) ;
 * - GET /parent/children/{id}/stats et /activity : statistiques et journal
 *   d'un enfant du compte famille, même forme que /tracking/stats/me et
 *   /tracking/activity/me (profil Parent uniquement) ;
 * - GET /parent/children/{id}/reports : bilans hebdomadaires rédigés par l'IA,
 *   générés à la demande pour la dernière semaine terminée.
 *
 * Absent de l'API au 13/11/2026 : la liaison d'un compte élève par un code
 * généré côté élève (F-26). Le formulaire reste désactivé.
 *
 * Les composants lisent `data`, `isLoading`, `isError` et `isUnavailable` :
 * brancher une nouvelle route revient à remplacer le hook par un useQuery.
 */

/** Période des cartes du tableau de bord : la semaine écoulée */
const WEEK_DAYS = 7;
/** Activités affichées dans « Activité récente » */
const RECENT_ACTIVITY_LIMIT = 6;

const PARENT_QUERY_KEY = ["parent", "child"] as const;

/** Forme commune des hooks parent à partir d'une query react-query */
const toParentData = <T,>(query: { data: T | undefined; isLoading: boolean; isError: boolean }): ParentData<T> => ({
	data: query.data,
	isLoading: query.isLoading,
	isError: query.isError,
	isUnavailable: false,
});

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

/**
 * Statistiques des 7 derniers jours d'un enfant. Rafraîchies au retour sur
 * l'onglet : les données suivent l'activité de l'enfant sans recharger.
 */
export const useChildStats = (childId: number | null): ParentData<StatsResponse> =>
	toParentData(
		useQuery({
			queryKey: [...PARENT_QUERY_KEY, childId, "stats", WEEK_DAYS],
			queryFn: async () =>
				(
					await APIAxios.get<StatsResponse>(APIRoutes.GET_Parent_Child_Stats(childId as number), {
						params: { days: WEEK_DAYS },
					})
				).data,
			enabled: childId !== null,
			staleTime: 60 * 1000,
		}),
	);

/** Dernières activités d'un enfant, du plus récent au plus ancien. */
export const useChildActivity = (childId: number | null): ParentData<ActivityItem[]> =>
	toParentData(
		useQuery({
			queryKey: [...PARENT_QUERY_KEY, childId, "activity", WEEK_DAYS],
			queryFn: async () =>
				(
					await APIAxios.get<ActivityItem[]>(APIRoutes.GET_Parent_Child_Activity(childId as number), {
						params: { days: WEEK_DAYS, limit: RECENT_ACTIVITY_LIMIT },
					})
				).data,
			enabled: childId !== null,
			staleTime: 60 * 1000,
		}),
	);

/**
 * Bilans hebdomadaires d'un enfant, du plus récent au plus ancien. La première
 * visite après la fin d'une semaine déclenche sa rédaction côté back (quelques
 * secondes) ; ensuite le bilan est resservi tel quel.
 */
export const useWeeklyReports = (childId: number | null): ParentData<WeeklyReport[]> =>
	toParentData(
		useQuery({
			queryKey: [...PARENT_QUERY_KEY, childId, "reports"],
			queryFn: async () =>
				(await APIAxios.get<WeeklyReport[]>(APIRoutes.GET_Parent_Child_Reports(childId as number))).data,
			enabled: childId !== null,
			// Un bilan par semaine : inutile de redemander à chaque retour sur l'onglet
			staleTime: 30 * 60 * 1000,
		}),
	);

/** Liaison d'un compte élève par code. Route absente : le formulaire reste désactivé. */
export const LINK_BY_CODE_AVAILABLE = false;
