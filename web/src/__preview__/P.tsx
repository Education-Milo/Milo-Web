// FICHIER TEMPORAIRE de vérification visuelle : à supprimer.
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@shared/lib/queryClient";
import APIAxios from "@api/axios.api";
import "@shared/styles/brand.css";
import "@shared/styles/proximity.css";
import "@shared/styles/info-chips.css";
import "@shared/styles/layout.css";
import DuelsPage from "@features/duels/pages/Duels.page";
import { DuelProvider } from "@features/duels/context/DuelContext";
import { useUserStore } from "@shared/store/user/user.store";
useUserStore.setState({ user: { id: "1", first_name: "Jérémy", last_name: "D", username: "j", classe: "5eme", role: "Enfant", xp: 1240, streak: 6, Interests: [] } as never, getMe: async () => undefined } as never);
document.documentElement.classList.add("milo-app");
const data = (url: string): unknown => {
	if (url.includes("presence")) return { 12: "online", 13: "in-game", 14: "offline" };
	if (url.includes("friends")) return [
		{ id: 1, user_id: 1, friend_id: 12, status: "accepted", direction: "sent", friend_first_name: "Léo", friend_last_name: "Martin" },
		{ id: 2, user_id: 1, friend_id: 13, status: "accepted", direction: "sent", friend_first_name: "Inès", friend_last_name: "B" },
		{ id: 3, user_id: 1, friend_id: 14, status: "accepted", direction: "sent", friend_first_name: "Tom", friend_last_name: "R" },
	];
	if (url.includes("history")) return [
		{ duel_id: 1, opponent_username: "leo_lefox", my_score: 4, opponent_score: 2, outcome: "win", played_at: "2026-11-12T10:00:00Z" },
		{ duel_id: 2, opponent_username: "ines.b", my_score: 2, opponent_score: 3, outcome: "loss", played_at: "2026-11-11T10:00:00Z" },
		{ duel_id: 3, opponent_username: "tom_r", my_score: 3, opponent_score: 3, outcome: "draw", played_at: "2026-11-10T10:00:00Z" },
		{ duel_id: 4, opponent_username: "leo_lefox", my_score: 5, opponent_score: 1, outcome: "win", played_at: "2026-11-09T10:00:00Z" },
		{ duel_id: 5, opponent_username: "ines.b", my_score: 4, opponent_score: 1, outcome: "win", played_at: "2026-11-08T10:00:00Z" },
	];
	if (url.includes("stats")) return { total_games: 12, wins: 7, draws: 2, losses: 3, winrate: 58, avg_score: 3.4, per_opponent: [
		{ opponent_id: 12, opponent_username: "leo_lefox", wins: 4, draws: 1, losses: 1, winrate: 67 },
		{ opponent_id: 13, opponent_username: "ines.b", wins: 2, draws: 0, losses: 2, winrate: 50 } ] };
	if (url.includes("users/")) return { username: "ami", equipped_meshes: [] };
	if (url.includes("cosmetic") || url.includes("locker") || url.includes("equipped")) return [];
	return {};
};
APIAxios.defaults.adapter = async (config) => ({ data: data(config.url ?? ""), status: 200, statusText: "OK", headers: {}, config } as never);
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={["/duels"]}><DuelProvider><DuelsPage /></DuelProvider></MemoryRouter></QueryClientProvider>);
