import React from "react";
import { useDuelsScreen } from "@features/duels/hooks/useDuelsPage";
import DuelGame from "@features/duels/components/DuelGame";
import { FriendsTile, RankTile, RivalTile, ShelfTile } from "@features/duels/components/lobby/LobbyTiles";
import DuelArena from "@features/duels/components/lobby/DuelArena";
import { useUserStore } from "@shared/store/user/user.store";
import { tileMotion } from "@features/duels/components/lobby/tileMotion";
import LobbyToast from "@features/duels/components/LobbyToast";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, useReducedMotion } from "framer-motion";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import QuizLoader from "@shared/components/quiz/QuizLoader.component";
import { emojiSrc } from "@shared/components/quiz/quiz.assets";
import "@shared/styles/Quiz.css";
import "@features/duels/styles/DuelsScreen.css";
import "@features/duels/styles/DuelGame.css";
import "@features/duels/styles/DuelsLobby.css";

const DuelsScreen: React.FC = () => {
	const {
		friends,
		loadingFriends,
		history,
		stats,
		handleDuelRequest,
		screen,
		startMatchmaking,
		waitingMessage,
		goToLobby,
	} = useDuelsScreen();
	const { equippedMeshNames } = useEquippedMeshNames();
	const reduceMotion = useReducedMotion();
	const firstName = useUserStore((state) => state.user?.first_name);

	// ── Game / End screens (full takeover) ────────────────────────────────────
	// Plein écran, sans barre latérale : rien ne doit distraire du duel
	if (screen === "game" || screen === "end") {
		return <DuelGame />;
	}

	// ── Waiting screen ────────────────────────────────────────────────────────
	if (screen === "waiting") {
		return (
			<QuizLoader
				variant="duel"
				className="dg-search"
				title="On te trouve un adversaire"
				highlight="adversaire"
				messages={[waitingMessage, "Échauffe tes neurones !", "Le plus rapide gagne la manche.", "Prépare ta plus belle émote…"]}
				art={
					<div className="dg-search-faceoff">
						<span className="dg-avatar dg-avatar--lg">
							<MiloAvatar equippedMeshNames={equippedMeshNames} initials="T" />
						</span>
						<motion.img
							src={emojiSrc("crossed_swords")}
							alt=""
							className="dg-search-swords"
							animate={{ rotate: [-10, 10, -10], scale: [1, 1.12, 1] }}
							transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
						/>
						<motion.span
							className="dg-search-slot--mystery"
							animate={{ rotate: [0, -8, 8, 0] }}
							transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
						>
							?
						</motion.span>
					</div>
				}
			>
				<button type="button" className="qz-btn qz-btn--sec" onClick={goToLobby}>
					Annuler la recherche
				</button>
			</QuizLoader>
		);
	}

	const onlineCount = friends.filter((f) => f.status === "online").length;
	const wins = stats?.wins ?? 0;

	// ── Lobby : le jeu d'abord ────────────────────────────────────────────────
	return (
		<ScreenLayout>
			<div className="dz">
				<div className="dz-toast-slot">
					<LobbyToast />
				</div>

				<div className="dz-bento">
					<DuelArena
						firstName={firstName}
						equippedMeshNames={equippedMeshNames ?? []}
						onlineCount={onlineCount}
						onStart={startMatchmaking}
					/>

					<motion.section className="dz-tile dz-rank" aria-label="Ton rang" {...tileMotion(1, reduceMotion)}>
						<RankTile wins={wins} />
					</motion.section>

					<motion.section className="dz-tile dz-friends-tile" aria-label="Défie un ami" {...tileMotion(2, reduceMotion)}>
						<FriendsTile friends={friends} loading={loadingFriends} onChallenge={handleDuelRequest} />
					</motion.section>

					<motion.section className="dz-tile dz-rival-tile" aria-label="Ton rival" {...tileMotion(3, reduceMotion)}>
						<RivalTile stats={stats} friends={friends} onChallenge={handleDuelRequest} />
					</motion.section>

					<motion.section className="dz-tile dz-shelf-tile" aria-label="Tes derniers combats" {...tileMotion(4, reduceMotion)}>
						<ShelfTile history={history} wins={wins} />
					</motion.section>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default DuelsScreen;
