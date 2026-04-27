import { useState, useMemo } from "react";
import {
	useFriends as useFriendsQuery,
	useDeleteFriend,
	useAcceptFriendRequest,
	useSendFriendRequest,
	useBlockFriend,
} from "@features/friends/store/friend.queries";
import type { FriendEnriched } from "@features/friends/store/friend.model";
import { useFriendDetails } from "@features/friends/hooks/useFriendDetails";

export type FriendsTab = "Tous" | "En attente" | "Meilleurs amis";

// ─── Persistance locale des favoris ─────────────────────────────────────────
const loadBestFriends = (): Set<number> => {
	try {
		const stored = localStorage.getItem("bestFriends");
		return stored ? new Set(JSON.parse(stored)) : new Set();
	} catch {
		return new Set();
	}
};

const saveBestFriends = (ids: Set<number>) => {
	localStorage.setItem("bestFriends", JSON.stringify([...ids]));
};

// ─── Hook principal ──────────────────────────────────────────────────────────
export const useFriends = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<FriendsTab>("Tous");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [bestFriendIds, setBestFriendIds] =
		useState<Set<number>>(loadBestFriends);

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

	// Enrichir avec isBestFriend (localStorage)
	const enrichedFriends: FriendEnriched[] = useMemo(
		() =>
			acceptedFriends.map((f) => ({
				...f,
				isBestFriend: bestFriendIds.has(f.id),
			})),
		[acceptedFriends, bestFriendIds],
	);

	// Enrichir avec les détails utilisateur (classe, xp, interests)
	const { friendsWithDetails, isLoading: isLoadingDetails } =
		useFriendDetails(enrichedFriends);

	// Demandes reçues en attente
	const pendingReceived = useMemo(
		() => pendingFriends.filter((f) => f.direction === "received"),
		[pendingFriends],
	);

	// Enrichir les pending avec isBestFriend: false pour éviter les erreurs de type
	const enrichedPending: FriendEnriched[] = useMemo(
		() => pendingReceived.map((f) => ({ ...f, isBestFriend: false })),
		[pendingReceived],
	);

	const filteredFriends = useMemo(() => {
		const base =
			activeTab === "En attente" ? enrichedPending : friendsWithDetails;
		return base.filter((f) => {
			const fullName =
				`${f.friend_first_name} ${f.friend_last_name}`.toLowerCase();
			const matchesSearch = fullName.includes(searchQuery.toLowerCase());
			const matchesTab =
				activeTab === "Tous" ||
				activeTab === "En attente" ||
				(activeTab === "Meilleurs amis" && f.isBestFriend);
			return matchesSearch && matchesTab;
		});
	}, [friendsWithDetails, enrichedPending, searchQuery, activeTab]);

	const toggleBestFriend = (id: number) => {
		setBestFriendIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			saveBestFriends(next);
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
		pendingFriends: pendingReceived,
		filteredFriends,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isAddModalOpen,
		setIsAddModalOpen,
		toggleBestFriend,
		sendFriendRequest,
		acceptFriend,
		deleteFriend,
		blockFriend,
		isLoading: isLoadingFriends || isLoadingDetails,
	};
};