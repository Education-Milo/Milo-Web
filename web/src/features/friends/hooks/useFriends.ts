import { useState, useMemo } from "react";
import {
	useFriends as useFriendsQuery,
	useDeleteFriend,
	useAcceptFriendRequest,
	useSendFriendRequest,
	useBlockFriend,
	useTogglePinFriend,
} from "@features/friends/store/friend.queries";
import type { FriendEnriched } from "@features/friends/store/friend.model";
import { getFriendDisplayName, getOtherUserId } from "@features/friends/store/friend.model";
import { useFriendDetails } from "@features/friends/hooks/useFriendDetails";
import { usePinnedFriendsMigration } from "@features/friends/hooks/usePinnedFriendsMigration";

export type FriendsTab = "Tous" | "Invitations" | "En attente";

// ─── Hook principal ──────────────────────────────────────────────────────────
export const useFriends = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<FriendsTab>("Tous");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	// Queries friends
	const {
		data: allFriends = [],
		isLoading: isLoadingFriends,
		isSuccess: isFriendsLoaded,
	} = useFriendsQuery();
	const deleteFriendMutation = useDeleteFriend();
	const acceptFriendMutation = useAcceptFriendRequest();
	const sendFriendMutation = useSendFriendRequest();
	const blockFriendMutation = useBlockFriend();
	const togglePinMutation = useTogglePinFriend();

	// Séparer acceptés / en attente.
	// La liste arrive déjà triée par le serveur (épinglés d'abord, puis par
	// date de relation) : on ne re-trie jamais côté client, on filtre seulement.
	const acceptedFriends = useMemo(
		() => allFriends.filter((f) => f.status === "accepted"),
		[allFriends],
	);

	const pendingFriends = useMemo(
		() => allFriends.filter((f) => f.status === "pending"),
		[allFriends],
	);

	// Migration unique des anciennes épingles localStorage vers l'API
	usePinnedFriendsMigration(acceptedFriends, isFriendsLoaded);

	// Enrichir avec les détails utilisateur (classe, xp, streak, interests)
	const { friendsWithDetails, isLoading: isLoadingDetails } =
		useFriendDetails(acceptedFriends);

	// Demandes reçues en attente
	const pendingReceived = useMemo(
		() => pendingFriends.filter((f) => f.direction === "received"),
		[pendingFriends],
	);

	// Demandes envoyées en attente : le back masque nom et prénom tant que la
	// demande n'est pas acceptée, on affiche le pseudo lu via /users/{id}.
	const pendingSentRaw = useMemo(
		() => pendingFriends.filter((f) => f.direction === "sent"),
		[pendingFriends],
	);
	const { friendsWithDetails: pendingSent } = useFriendDetails(pendingSentRaw, { live: false });

	const filteredFriends = useMemo(() => {
		const base: FriendEnriched[] =
			activeTab === "Invitations" ? pendingReceived :
			activeTab === "En attente" ? pendingSent : friendsWithDetails;
		const query = searchQuery.trim().toLowerCase();
		if (!query) return base;
		return base.filter((f) => {
			const username = "username" in f ? (f as { username?: string }).username ?? "" : "";
			return `${getFriendDisplayName(f)} ${username}`.toLowerCase().includes(query);
		});
	}, [friendsWithDetails, pendingReceived, pendingSent, searchQuery, activeTab]);

	/** Épingle / désépingle un ami (id utilisateur de l'ami, cf. getOtherUserId). */
	const togglePin = (friendUserId: number) => {
		const friend = acceptedFriends.find((f) => getOtherUserId(f) === friendUserId);
		if (!friend || togglePinMutation.isPending) return;
		togglePinMutation.mutate({ friendUserId, pinned: !friend.is_pinned });
	};

	const sendFriendRequest = (friendId: number) => {
		sendFriendMutation.mutate(friendId);
		setIsAddModalOpen(false);
	};

	const acceptFriend = (friendId: number) => {
		acceptFriendMutation.mutate(friendId);
	};

	const deleteFriend = (friendId: number) => {
		deleteFriendMutation.mutate(friendId);
	};

	const blockFriend = (friendId: number) => {
		blockFriendMutation.mutate(friendId);
	};

	return {
		friends: friendsWithDetails,
		pendingReceived,
		pendingSent,
		filteredFriends,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isAddModalOpen,
		setIsAddModalOpen,
		togglePin,
		isTogglingPin: togglePinMutation.isPending,
		sendFriendRequest,
		acceptFriend,
		deleteFriend,
		isDeletingFriend: deleteFriendMutation.isPending,
		blockFriend,
		isLoading: isLoadingFriends || isLoadingDetails,
	};
};
