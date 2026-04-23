import { useState, useMemo } from "react";
import { Friend } from "../types";

export type FriendsTab = "Tous" | "En ligne" | "Meilleurs amis";

const INITIAL_FRIENDS: Friend[] = [
	{ id: 1, name: "Léo", avatar: "🧑‍🦱", level: "6ème", streak: 12, isOnline: true, isBestFriend: true, interests: ["Football", "Jeux Vidéo"] },
	{ id: 2, name: "Emma", avatar: "👩‍🦰", level: "5ème", streak: 3, isOnline: false, isBestFriend: false, interests: ["Lecture", "Dessin"] },
	{ id: 3, name: "Lucas", avatar: "👦", level: "6ème", streak: 25, isOnline: true, isBestFriend: true, interests: ["Maths", "Échecs"] },
	{ id: 4, name: "Chloé", avatar: "👧", level: "4ème", streak: 0, isOnline: false, isBestFriend: false, interests: ["Musique", "Animaux"] },
	{ id: 5, name: "Hugo", avatar: "👱", level: "3ème", streak: 7, isOnline: true, isBestFriend: false, interests: ["Skate", "Manga"] },
	{ id: 6, name: "Alice", avatar: "👩", level: "6ème", streak: 5, isOnline: true, isBestFriend: false, interests: ["Danse", "Cinéma"] },
	{ id: 7, name: "Maxime", avatar: "👨", level: "5ème", streak: 10, isOnline: false, isBestFriend: true, interests: ["Science", "Programmation"] },
	{ id: 8, name: "Juliette", avatar: "👱‍♀️", level: "4ème", streak: 2, isOnline: true, isBestFriend: false, interests: ["Voyages", "Photographie"] },
	{ id: 9, name: "Thomas", avatar: "👦🏽", level: "3ème", streak: 18, isOnline: false, isBestFriend: false, interests: ["Histoire", "Bricolage"] },
	{ id: 10, name: "Sarah", avatar: "👩🏽‍🦱", level: "6ème", streak: 1, isOnline: true, isBestFriend: false, interests: ["Pâtisserie", "Séries"] },
];

export const useFriends = () => {
	const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<FriendsTab>("Tous");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const filteredFriends = useMemo(() => {
		return friends.filter((friend) => {
			const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab =
				activeTab === "Tous" ||
				(activeTab === "En ligne" && friend.isOnline) ||
				(activeTab === "Meilleurs amis" && friend.isBestFriend);
			return matchesSearch && matchesTab;
		});
	}, [friends, searchQuery, activeTab]);

	const toggleBestFriend = (id: number) => {
		setFriends((prev) =>
			prev.map((f) => (f.id === id ? { ...f, isBestFriend: !f.isBestFriend } : f))
		);
	};

	const simulateAddFriend = (pseudo: string) => {
		console.log(`Demande d'ami envoyée à ${pseudo}`);
		setIsAddModalOpen(false);
	};

	return {
		friends,
		filteredFriends,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isAddModalOpen,
		setIsAddModalOpen,
		toggleBestFriend,
		simulateAddFriend,
	};
};
