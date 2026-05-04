import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type { Friend } from "@features/friends/store/friend.model";

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

export const useFriends = (status?: "pending" | "accepted") => {
	return useQuery({
		queryKey: ["friends", status],
		queryFn: () => fetchFriends(status),
		refetchInterval: 10000,
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
