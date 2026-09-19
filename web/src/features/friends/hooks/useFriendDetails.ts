import { useUserStore } from "@shared/store/user/user.store";
import { useQueries } from "@tanstack/react-query";
import type { FriendEnriched } from "@features/friends/store/friend.model";
import { getOtherUserId } from "@features/friends/store/friend.model";
import type { User } from "@shared/store/user/user.model";

export interface FriendWithDetails extends FriendEnriched {
	classe?: string;
    streak?: number;
	xp?: number;
	interests?: { id: string; name: string }[];
	/** Objets équipés sur le Milo de l'ami (renvoyé par /users/{id}) */
	equipped_items?: number[];
}

export const useFriendDetails = (friends: FriendEnriched[]): {
	friendsWithDetails: FriendWithDetails[];
	isLoading: boolean;
} => {
	const getUserById = useUserStore((state) => state.getUserById);

	const queries = useQueries({
		queries: friends.map((friend) => {
			// Important : `friend_id` n'est le véritable id de l'ami que si la
			// demande a été envoyée par nous. Si on l'a reçue, l'ami est en
			// réalité `user_id`. Utiliser directement `friend_id` ici affichait
			// parfois nos propres streak/xp à la place de ceux de l'ami
			// (d'où la désynchronisation constatée).
			const otherUserId = getOtherUserId(friend);
			return {
				queryKey: ["user", "id", otherUserId],
				queryFn: () => getUserById(String(otherUserId)),
				// Rafraîchi régulièrement (comme la liste d'amis, cf. friend.queries.ts)
				// pour éviter d'afficher un streak/xp obsolète.
				staleTime: 10 * 1000,
				refetchInterval: 10 * 1000,
				enabled: !!otherUserId,
			};
		}),
	});

	const isLoading = queries.some((q) => q.isLoading);

	const friendsWithDetails: FriendWithDetails[] = friends.map((friend, idx) => {
		const userData: User | undefined = queries[idx]?.data;
		return {
			...friend,
			classe: userData?.class_ ?? undefined,
			streak: userData?.streak ?? undefined,
			xp: userData?.xp ?? undefined,
			interests: userData?.interests?.slice(0, 3) ?? [],
			equipped_items: userData?.equipped_items,
		};
	});

	return { friendsWithDetails, isLoading };
};
