import { keepPreviousData, useQuery } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useUserStore } from "@shared/store/user/user.store";
import { STATS_QUERY_KEY } from "@shared/lib/serverActions";
import type {
	ActivityItem,
	PerformanceFilters,
	PerformanceItem,
	StatsResponse,
} from "@features/stats/store/stats.model";

export const fetchStats = async (days: number): Promise<StatsResponse> => {
	const response = await APIAxios.get<StatsResponse>(
		APIRoutes.GET_Tracking_Stats_Me,
		{ params: { days } },
	);
	return response.data;
};

export const fetchPerformances = async (
	filters: PerformanceFilters,
): Promise<PerformanceItem[]> => {
	const response = await APIAxios.get<PerformanceItem[]>(
		APIRoutes.GET_Tracking_Performance_Me,
		{ params: filters },
	);
	return response.data;
};

export const fetchActivities = async (
	days: number,
	limit: number,
): Promise<ActivityItem[]> => {
	const response = await APIAxios.get<ActivityItem[]>(
		APIRoutes.GET_Tracking_Activity_Me,
		{ params: { days, limit } },
	);
	return response.data;
};

const useIsStudent = () => useUserStore((state) => state.user?.role === "Enfant");

/**
 * Une seule query "stats" pour toute la page. Pendant un changement de
 * période, l'ancien rendu est conservé (pas de flash de squelette).
 * Invalidée via refreshAfterServerAction (fin de QCM, duel, cours) et
 * après chaque envoi de temps passé.
 */
export const useStats = (days: number) => {
	const isStudent = useIsStudent();
	return useQuery({
		queryKey: [...STATS_QUERY_KEY, "me", days],
		queryFn: () => fetchStats(days),
		enabled: isStudent,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});
};

export const usePerformances = (filters: PerformanceFilters) => {
	const isStudent = useIsStudent();
	return useQuery({
		queryKey: [...STATS_QUERY_KEY, "performance", filters],
		queryFn: () => fetchPerformances(filters),
		enabled: isStudent,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});
};

export const useActivities = (days = 7, limit = 20) => {
	const isStudent = useIsStudent();
	return useQuery({
		queryKey: [...STATS_QUERY_KEY, "activity", { days, limit }],
		queryFn: () => fetchActivities(days, limit),
		enabled: isStudent,
		staleTime: 60 * 1000,
	});
};
