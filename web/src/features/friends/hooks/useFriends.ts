import { useState, useMemo } from "react";
import {
	useFriends as useFriendsQuery,
	useDeleteFriend,
	useAcceptFriendRequest,
	useSendFriendRequest,
	useBlockFriend,
} from "@features/friends/store/friend.queries";
import type { FriendEnriched } from "@features/friends/store/friend.model";
import { getOtherUserId } from "@features/friends/store/friend.model";
import { useFriendDetails } from "@features/friends/hooks/useFriendDetails";

export type FriendsTab = "Tous" | "Invitations" | "En attente";

// ─── Persistance locale des épingles ────────────────────────────────────────
// Les ids stockés sont ceux de l'utilisateur ami (cf. getOtherUserId), pas
// l'id de la relation d'amitié, pour rester stables et cohérents avec le
// reste de l'app.
const PINNED_FRIENDS_KEY = "pinnedFriends";

const loadPinnedFriends = (): Set<number> => {
	try {
		const stored = localStorage.getItem(PINNED_FRIENDS_KEY);
		return stored ? new Set(JSON.parse(stored)) : new Set();
	} catch {
		return new Set();
	}
};

const savePinnedFriends = (ids: Set<number>) => {
	localStorage.setItem(PINNED_FRIENDS_KEY, JSON.stringify([...ids]));
};

// ─── Hook principal ──────────────────────────────────────────────────────────
export const useFriends = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<FriendsTab>("Tous");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [pinnedFriendIds, setPinnedFriendIds] =
		useState<Set<number>>(loadPinnedFriends);

	// Queries friends
	const { data: allFriends = [], isLoading: isLoadingFriends } =
		useFriendsQuery();
	const deleteFriendMutation = useDeleteFriend();
	const acceptFriendMutation = useAcceptFriendRequest();
	const sendFriendMutation = useSendFriendRequest();
	const blockFriendMutation = useBlockFriend();

	// Séparer acceptés / en attente
	const acceptedFriends = useMemo(
		() => allFriends.filter((f) => f.status === "accepted"),
		[allFriends],
	);

	const pendingFriends = useMemo(
		() => allFriends.filter((f) => f.status === "pending"),
		[allFriends],
	);

	// Enrichir avec isPinned (localStorage), identifié par l'id de l'ami
	const enrichedFriends: FriendEnriched[] = useMemo(
		() =>
			acceptedFriends.map((f) => ({
				...f,
				isPinned: pinnedFriendIds.has(getOtherUserId(f)),
			})),
		[acceptedFriends, pinnedFriendIds],
	);

	// Enrichir avec les détails utilisateur (classe, xp, interests)
	const { friendsWithDetails: friendsWithDetailsUnsorted, isLoading: isLoadingDetails } =
		useFriendDetails(enrichedFriends);

	// Les amis épinglés sont affichés en premier (ordre stable sinon)
	const friendsWithDetails = useMemo(
		() =>
			[...friendsWithDetailsUnsorted].sort((a, b) =>
				a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1,
			),
		[friendsWithDetailsUnsorted],
	);

	// Demandes reçues en attente
	const pendingReceived = useMemo(
		() => pendingFriends.filter((f) => f.direction === "received"),
		[pendingFriends],
	);

	// Demandes envoyées en attente
	const pendingSent = useMemo(
		() => pendingFriends.filter((f) => f.direction === "sent"),
		[pendingFriends],
	);

	// Enrichir les pending avec isPinned: false pour éviter les erreurs de type
	const enrichedPendingReceived: FriendEnriched[] = useMemo(
		() => pendingReceived.map((f) => ({ ...f, isPinned: false })),
		[pendingReceived],
	);

	const enrichedPendingSent: FriendEnriched[] = useMemo(
		() => pendingSent.map((f) => ({ ...f, isPinned: false })),
		[pendingSent],
	);

	const filteredFriends = useMemo(() => {
		const base =
			activeTab === "Invitations" ? enrichedPendingReceived :
			activeTab === "En attente" ? enrichedPendingSent : friendsWithDetails;
		return base.filter((f) => {
			const fullName =
				`${f.friend_first_name} ${f.friend_last_name}`.toLowerCase();
			return fullName.includes(searchQuery.toLowerCase());
		});
	}, [friendsWithDetails, enrichedPendingReceived, enrichedPendingSent, searchQuery, activeTab]);

	const togglePin = (friendUserId: number) => {
		setPinnedFriendIds((prev) => {
			const next = new Set(prev);
			next.has(friendUserId) ? next.delete(friendUserId) : next.add(friendUserId);
			savePinnedFriends(next);
			return next;
		});
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
		sendFriendRequest,
		acceptFriend,
		deleteFriend,
		blockFriend,
		isLoading: isLoadingFriends || isLoadingDetails,
	};
};
