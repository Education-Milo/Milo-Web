import { useUserStore } from "@shared/store/user/user.store";
import { useQueries } from "@tanstack/react-query";
import type { FriendEnriched } from "@features/friends/store/friend.model";
import type { User } from "@shared/store/user/user.model";

export interface FriendWithDetails extends FriendEnriched {
	classe?: string;
    streak?: number;
	xp?: number;
	interests?: { id: string; name: string }[];
}

export const useFriendDetails = (friends: FriendEnriched[]): {
	friendsWithDetails: FriendWithDetails[];
	isLoading: boolean;
} => {
	const getUserById = useUserStore((state) => state.getUserById);

	const queries = useQueries({
		queries: friends.map((friend) => ({
			queryKey: ["user", "id", friend.friend_id],
			queryFn: () => getUserById(String(friend.friend_id)),
			staleTime: 5 * 60 * 1000, // 5 min de cache
			enabled: !!friend.friend_id,
		})),
	});

	const isLoading = queries.some((q) => q.isLoading);

	const friendsWithDetails: FriendWithDetails[] = friends.map((friend, idx) => {
		const userData: User | undefined = queries[idx]?.data;
		return {
			...friend,
			classe: userData?.classe ?? undefined,
			xp: userData?.xp ?? undefined,
			interests: userData?.Interests?.slice(0, 3) ?? [],
		};
	});

	return { friendsWithDetails, isLoading };
};