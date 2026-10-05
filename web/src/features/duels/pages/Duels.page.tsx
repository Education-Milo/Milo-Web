import React from "react";
import { BarChart3, History, Sparkles, Trophy, Users } from "lucide-react";
import { useDuelsScreen } from "@features/duels/hooks/useDuelsPage";
import FriendList from "@features/duels/components/FriendList";
import DuelGame from "@features/duels/components/DuelGame";
import DuelStats from "@features/duels/components/DuelStats";
import DuelHistory from "@features/duels/components/DuelHistory";
import LobbyToast from "@features/duels/components/LobbyToast";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion } from "framer-motion";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import QuizLoader from "@shared/components/quiz/QuizLoader.component";
import { emojiSrc } from "@shared/components/quiz/quiz.assets";
import "@shared/styles/Quiz.css";
import "@features/duels/styles/DuelsScreen.css";
import "@features/duels/styles/DuelGame.css";
import miloMascot from "/buttonGo.webp";
import duelsMilo from "/duels_milo.png";

const DuelsScreen: React.FC = () => {
	const {
		friends,
		loadingFriends,
		history,
		loadingHistory,
		stats,
		loadingStats,
		handleDuelRequest,
		screen,
		startMatchmaking,
		waitingMessage,
		goToLobby,
	} = useDuelsScreen();
	const { equippedMeshNames } = useEquippedMeshNames();

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
				eyebrow="Arène de duels"
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

	const onlineFriendsCount = friends.filter((f) => f.status !== "offline").length;

	// ── Lobby (bento) ─────────────────────────────────────────────────────────
	return (
		<ScreenLayout>
			<div className="dl-page">
				<div className="dl-toast-slot">
					<LobbyToast />
				</div>

				<div className="dl-grid">
					{/* =============== COLONNE PRINCIPALE =============== */}
					<div className="dl-main-col">
						{/* --- HERO --- */}
						<section className="dl-hero">
							<div className="dl-hero-halo" aria-hidden="true" />
							<div className="dl-hero-left">
								<img src={miloMascot} alt="Milo" className="dl-hero-mascot" />
							</div>
							<div className="dl-hero-center">
								<div className="dl-hero-chip">
									<Sparkles size={14} />
									<span>Arène de duels</span>
								</div>
								<h1 className="dl-hero-title">Défie tes amis !</h1>
								<p className="dl-hero-sub">
									Affronte tes amis ou des adversaires aléatoires pour monter
									dans le classement.
								</p>
							</div>
							<div className="dl-hero-stats">
								<div className="dl-hero-stat">
									<Users size={16} />
									<span>{onlineFriendsCount} ami(s) en ligne</span>
								</div>
								<div className="dl-hero-stat">
									<Trophy size={16} />
									<span>{stats?.wins ?? 0} victoires</span>
								</div>
							</div>
						</section>

						{/* --- BANNIÈRE DUEL ALÉATOIRE --- */}
						<button
							type="button"
							className="dl-duel-banner"
							onClick={startMatchmaking}
							aria-label="Lancer un duel aléatoire"
						>
							<img
								src={duelsMilo}
								alt="Lance un duel aléatoire"
								className="dl-duel-banner-img"
							/>
							<div className="dl-duel-banner-shine" aria-hidden="true" />
							<div className="dl-duel-banner-shine-2" aria-hidden="true" />
						</button>

						{/* --- STATISTIQUES --- */}
						<section className="dl-card dl-stats">
							<header className="dl-section-header">
								<div className="dl-section-title-wrap">
									<BarChart3 size={20} className="dl-section-icon" />
									<h2 className="dl-section-title">Mes statistiques</h2>
								</div>
							</header>
							<DuelStats stats={stats} loading={loadingStats} />
						</section>
					</div>

					{/* =============== COLONNE SECONDAIRE =============== */}
					<div className="dl-side-col">
						{/* --- AMIS --- */}
						<section className="dl-card dl-friends">
							<header className="dl-section-header">
								<div className="dl-section-title-wrap">
									<Users size={20} className="dl-section-icon" />
									<h2 className="dl-section-title">Mes amis</h2>
								</div>
								<span className="dl-count-pill">{onlineFriendsCount}</span>
							</header>
							<FriendList
								friends={friends}
								onDuelRequest={handleDuelRequest}
								loading={loadingFriends}
							/>
						</section>

						{/* --- HISTORIQUE --- */}
						<section className="dl-card dl-history">
							<header className="dl-section-header">
								<div className="dl-section-title-wrap">
									<History size={20} className="dl-section-icon" />
									<h2 className="dl-section-title">Historique</h2>
								</div>
							</header>
							<DuelHistory history={history} loading={loadingHistory} />
						</section>
					</div>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default DuelsScreen;