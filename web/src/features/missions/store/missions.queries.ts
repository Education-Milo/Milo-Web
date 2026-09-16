import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useUserStore } from "@shared/store/user/user.store";
import { MISSIONS_QUERY_KEY } from "@shared/lib/serverActions";
import type {
	DailyMission,
	DailyMissionsResponse,
} from "@shared/types/missions";

export const todayMissionsQueryKey = [...MISSIONS_QUERY_KEY, "today"] as const;

export const fetchTodayMissions = async (): Promise<DailyMissionsResponse> => {
	const response = await APIAxios.get<DailyMissionsResponse>(
		APIRoutes.GET_Missions_Today,
	);
	return response.data;
};

export const rerollMission = async (missionId: number): Promise<DailyMission> => {
	const response = await APIAxios.post<DailyMission>(
		APIRoutes.POST_Mission_Reroll(missionId),
	);
	return response.data;
};

/**
 * Missions du jour. Le premier appel de la journée tire les missions,
 * les suivants renvoient les mêmes : on peut donc les garder en cache
 * et ne les rafraîchir qu'après une action (voir refreshAfterServerAction).
 * Route réservée au rôle Enfant (403 sinon) : désactivée pour les autres.
 */
export const useDailyMissions = () => {
	const role = useUserStore((state) => state.user?.role);
	return useQuery({
		queryKey: todayMissionsQueryKey,
		queryFn: fetchTodayMissions,
		enabled: role === "Enfant",
		staleTime: 60 * 1000,
	});
};

export const useRerollMission = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: rerollMission,
		onSuccess: (newMission, missionId) => {
			queryClient.setQueryData<DailyMissionsResponse>(
				todayMissionsQueryKey,
				(current) =>
					current
						? {
								...current,
								reroll_available: false,
								missions: current.missions.map((mission) =>
									mission.id === missionId ? newMission : mission,
								),
							}
						: current,
			);
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: todayMissionsQueryKey });
		},
	});
};

/** Sépare les missions normales de la mission bonus. */
export const splitMissions = (missions: DailyMission[] = []) => ({
	regular: missions.filter((mission) => !mission.is_bonus),
	bonus: missions.find((mission) => mission.is_bonus) ?? null,
});
