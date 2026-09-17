import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type { Friend } from "@features/friends/store/friend.model";
import { getOtherUserId } from "@features/friends/store/friend.model";
import { refreshAfterServerAction } from "@shared/lib/serverActions";

export const fetchFriends = async (
	status?: "pending" | "accepted"
): Promise<Friend[]> => {
	const response = await APIAxios.get(APIRoutes.GET_Friends, {
		params: status ? { status } : null,
	});
	return response.data;
};

export const deleteFriends = async (friendId: number): Promise<void> => {
	const response = await APIAxios.delete(APIRoutes.DELETE_FRIEND(friendId), {});
	return response.data;
};

export const sendFriendRequest = async (friendId: number): Promise<Friend> => {
	const response = await APIAxios.post(
		APIRoutes.POST_SEND_FRIEND_REQUEST(friendId),
		{}
	);
	return response.data;
};

export const acceptFriendRequest = async (
	friendId: number
): Promise<Friend> => {
	const response = await APIAxios.patch(
		APIRoutes.PATCH_ACCEPT_FRIEND_REQUEST(friendId),
		{}
	);
	return response.data;
};

export const blockFriend = async (friendId: number): Promise<Friend> => {
	const response = await APIAxios.patch(
		APIRoutes.PATCH_BLOCK_FRIEND(friendId),
		{}
	);
	return response.data;
};

export interface PinResponse {
	friend_id: number;
	is_pinned: boolean;
	pinned_at: string | null;
}

export const pinFriend = async (friendUserId: number): Promise<PinResponse> => {
	const response = await APIAxios.put(APIRoutes.PUT_PIN_FRIEND(friendUserId));
	return response.data;
};

export const unpinFriend = async (friendUserId: number): Promise<PinResponse> => {
	const response = await APIAxios.delete(APIRoutes.DELETE_PIN_FRIEND(friendUserId));
	return response.data;
};

/** Réordonne comme le serveur : épinglés d'abord, ordre relatif conservé. */
export const sortPinnedFirst = (friends: Friend[]): Friend[] => [
	...friends.filter((f) => f.is_pinned),
	...friends.filter((f) => !f.is_pinned),
];

export const useFriends = (status?: "pending" | "accepted") => {
	return useQuery({
		queryKey: ["friends", status],
		queryFn: () => fetchFriends(status),
		refetchInterval: 10000,
	});
};

interface TogglePinVariables {
	/** Id utilisateur de l'ami (cf. getOtherUserId), pas l'id de la relation. */
	friendUserId: number;
	pinned: boolean;
}

/**
 * Épingle / désépingle un ami avec mise à jour optimiste de toutes les
 * queries "friends" (bascule is_pinned et remonte / redescend l'élément),
 * rollback si le serveur refuse, puis invalidation.
 */
export const useTogglePinFriend = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ friendUserId, pinned }: TogglePinVariables) =>
			pinned ? pinFriend(friendUserId) : unpinFriend(friendUserId),
		onMutate: async ({ friendUserId, pinned }) => {
			await queryClient.cancelQueries({ queryKey: ["friends"] });
			const previous = queryClient.getQueriesData<Friend[]>({
				queryKey: ["friends"],
			});
			queryClient.setQueriesData<Friend[]>({ queryKey: ["friends"] }, (current) =>
				current
					? sortPinnedFirst(
							current.map((f) =>
								getOtherUserId(f) === friendUserId
									? {
											...f,
											is_pinned: pinned,
											pinned_at: pinned ? new Date().toISOString() : null,
										}
									: f,
							),
						)
					: current,
			);
			return { previous };
		},
		onError: (_error, _variables, context) => {
			context?.previous.forEach(([queryKey, data]) => {
				queryClient.setQueryData(queryKey, data);
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["friends"] });
		},
	});
};

export const useDeleteFriend = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteFriends,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["friends"] });
		},
	});
};

export const useSendFriendRequest = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: sendFriendRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["friends"] });
		},
	});
};

export const useAcceptFriendRequest = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: acceptFriendRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["friends"] });
			// Le back fait avancer les missions après une acceptation d'ami
			refreshAfterServerAction();
		},
	});
};

export const useBlockFriend = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: blockFriend,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["friends"] });
		},
	});
};
