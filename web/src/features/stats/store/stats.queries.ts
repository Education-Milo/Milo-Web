import { keepPreviousData, useQuery } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useUserStore } from "@shared/store/user/user.store";
import { STATS_QUERY_KEY } from "@shared/lib/serverActions";
import { useStatsScope, type StatsScope } from "@features/stats/context/StatsScope";
import type {
	ActivityItem,
	PerformanceFilters,
	PerformanceItem,
	StatsResponse,
} from "@features/stats/store/stats.model";

/** GET /admin/users/{id}/activity : journal et résultats en un seul appel */
interface AdminUserActivity {
	activity: ActivityItem[];
	performances: PerformanceItem[];
}

export const fetchStats = async (days: number, scope: StatsScope = { kind: "me" }): Promise<StatsResponse> => {
	const url =
		scope.kind === "user" ? APIRoutes.GET_Admin_User_Stats(scope.userId) : APIRoutes.GET_Tracking_Stats_Me;
	const response = await APIAxios.get<StatsResponse>(url, { params: { days } });
	return response.data;
};

const fetchAdminUserActivity = async (userId: number, days: number, limit: number) => {
	const response = await APIAxios.get<AdminUserActivity>(APIRoutes.GET_Admin_User_Activity(userId), {
		params: { days, limit },
	});
	return response.data;
};

export const fetchPerformances = async (
	filters: PerformanceFilters,
	scope: StatsScope = { kind: "me" },
): Promise<PerformanceItem[]> => {
	if (scope.kind === "user") {
		// La route admin ne filtre pas : matière et type sont filtrés ici
		const { performances } = await fetchAdminUserActivity(scope.userId, filters.days ?? 30, filters.limit ?? 50);
		return performances.filter(
			(p) => (!filters.subject || p.subject === filters.subject) && (!filters.kind || p.kind === filters.kind),
		);
	}
	const response = await APIAxios.get<PerformanceItem[]>(APIRoutes.GET_Tracking_Performance_Me, {
		params: filters,
	});
	return response.data;
};

export const fetchActivities = async (
	days: number,
	limit: number,
	scope: StatsScope = { kind: "me" },
): Promise<ActivityItem[]> => {
	if (scope.kind === "user") {
		return (await fetchAdminUserActivity(scope.userId, days, limit)).activity;
	}
	const response = await APIAxios.get<ActivityItem[]>(APIRoutes.GET_Tracking_Activity_Me, {
		params: { days, limit },
	});
	return response.data;
};

const scopeKey = (scope: StatsScope) => (scope.kind === "user" ? ["user", scope.userId] : ["me"]);

/** Pour soi : routes réservées aux élèves. Pour un autre compte : panel admin. */
const useIsEnabled = (scope: StatsScope) => {
	const isStudent = useUserStore((state) => state.user?.role === "Enfant");
	return scope.kind === "user" || isStudent;
};

/**
 * Une seule query "stats" pour toute la page. Pendant un changement de
 * période, l'ancien rendu est conservé (pas de flash de squelette).
 * Invalidée via refreshAfterServerAction (fin de QCM, duel, cours) et
 * après chaque envoi de temps passé.
 */
export const useStats = (days: number) => {
	const scope = useStatsScope();
	const enabled = useIsEnabled(scope);
	return useQuery({
		queryKey: [...STATS_QUERY_KEY, ...scopeKey(scope), days],
		queryFn: () => fetchStats(days, scope),
		enabled,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});
};

export const usePerformances = (filters: PerformanceFilters) => {
	const scope = useStatsScope();
	const enabled = useIsEnabled(scope);
	return useQuery({
		queryKey: [...STATS_QUERY_KEY, ...scopeKey(scope), "performance", filters],
		queryFn: () => fetchPerformances(filters, scope),
		enabled,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});
};

export const useActivities = (days = 7, limit = 20) => {
	const scope = useStatsScope();
	const enabled = useIsEnabled(scope);
	return useQuery({
		queryKey: [...STATS_QUERY_KEY, ...scopeKey(scope), "activity", { days, limit }],
		queryFn: () => fetchActivities(days, limit, scope),
		enabled,
		staleTime: 60 * 1000,
	});
};
