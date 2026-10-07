import { keepPreviousData, useQuery } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type {
	AiUsage,
	ModerationEventsFilters,
	ModerationEventsPage,
	ModerationOverview,
} from "@features/admin/store/moderation.model";

const MODERATION_KEY = ["admin", "moderation"] as const;

export const useModerationOverview = (days: number) =>
	useQuery({
		queryKey: [...MODERATION_KEY, "overview", days],
		queryFn: async () =>
			(await APIAxios.get<ModerationOverview>(APIRoutes.GET_Admin_Moderation, { params: { days } })).data,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});

export const useModerationEvents = (filters: ModerationEventsFilters, enabled = true) =>
	useQuery({
		queryKey: [...MODERATION_KEY, "events", filters],
		queryFn: async () => {
			const params: Record<string, string | number> = {
				days: filters.days,
				limit: filters.limit,
				offset: filters.offset,
			};
			if (filters.direction) params.direction = filters.direction;
			if (filters.family) params.family = filters.family;
			if (filters.user_id) params.user_id = filters.user_id;
			return (await APIAxios.get<ModerationEventsPage>(APIRoutes.GET_Admin_Moderation_Events, { params })).data;
		},
		enabled,
		staleTime: 30 * 1000,
		placeholderData: keepPreviousData,
	});

/** Sans `userId` : toute la plateforme. Avec : un seul compte (fiche Support). */
export const useAiUsage = (days: number, userId?: number) =>
	useQuery({
		queryKey: ["admin", "ai-usage", days, userId ?? "all"],
		queryFn: async () =>
			(await APIAxios.get<AiUsage>(APIRoutes.GET_Admin_AI_Usage, {
				params: userId ? { days, user_id: userId } : { days },
			})).data,
		staleTime: 60 * 1000,
		placeholderData: keepPreviousData,
	});
