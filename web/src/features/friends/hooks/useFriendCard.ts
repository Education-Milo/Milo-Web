import { useQuery } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useUserStore } from "@shared/store/user/user.store";
import type { User } from "@shared/store/user/user.model";
import type { DuelHistoryEntry, DuelStatsData } from "@shared/types/duels";

/// Données de la carte de joueur d'un ami : son profil complet (tous ses
/// centres d'intérêt), sa présence en direct et vos duels l'un contre l'autre.

export type Presence = "online" | "in-game" | "offline";

const PRESENCE_POLL_MS = 10_000;
const MAX_RECENT_DUELS = 3;

export const useFriendCard = (otherUserId: number) => {
	const getUserById = useUserStore((state) => state.getUserById);

	/// (même clé que useFriendDetails : déjà en cache le plus souvent)
	const profile = useQuery<User>({
		queryKey: ["user", "id", otherUserId],
		queryFn: () => getUserById(String(otherUserId)),
		staleTime: 10_000,
		enabled: otherUserId > 0,
	});

	const presence = useQuery<Presence>({
		queryKey: ["presence", otherUserId],
		queryFn: async () => {
			const r = await APIAxios.get<Record<string, Presence>>(APIRoutes.GET_Users_Presence(String(otherUserId)));
			return r.data?.[String(otherUserId)] ?? "offline";
		},
		refetchInterval: PRESENCE_POLL_MS,
		enabled: otherUserId > 0,
	});

	const stats = useQuery<DuelStatsData>({
		queryKey: ["duels", "stats"],
		queryFn: async () => (await APIAxios.get<DuelStatsData>(APIRoutes.GET_DuelStats)).data,
		staleTime: 30_000,
	});

	const history = useQuery<DuelHistoryEntry[]>({
		queryKey: ["duels", "history"],
		queryFn: async () => (await APIAxios.get<DuelHistoryEntry[]>(APIRoutes.GET_DuelHistory)).data,
		staleTime: 30_000,
	});

	const headToHead = stats.data?.per_opponent.find((o) => o.opponent_id === otherUserId) ?? null;
	const recentDuels = (history.data ?? [])
		.filter((entry) => entry.opponent_id === otherUserId)
		.sort((a, b) => (b.played_at ?? "").localeCompare(a.played_at ?? ""))
		.slice(0, MAX_RECENT_DUELS);

	return {
		profile: profile.data,
		presence: presence.data ?? null,
		headToHead,
		recentDuels,
		duelsLoading: stats.isLoading || history.isLoading,
	};
};
