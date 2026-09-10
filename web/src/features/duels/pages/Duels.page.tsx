import React from "react";
import { BarChart3, History, Sparkles, Trophy, Users } from "lucide-react";
import { useDuelsScreen } from "@features/duels/hooks/useDuelsPage";
import FriendList from "@features/duels/components/FriendList";
import DuelGame from "@features/duels/components/DuelGame";
import DuelStats from "@features/duels/components/DuelStats";
import DuelHistory from "@features/duels/components/DuelHistory";
import LobbyToast from "@features/duels/components/LobbyToast";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import "@features/duels/styles/DuelsScreen.css";
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

	// ── Game / End screens (full takeover) ────────────────────────────────────
	if (screen === "game" || screen === "end") {
		return (
			<ScreenLayout>
				<DuelGame />
			</ScreenLayout>
		);
	}

	// ── Waiting screen ────────────────────────────────────────────────────────
	if (screen === "waiting") {
		return (
			<ScreenLayout>
				<div className="dl-fullscreen-wrap">
					<div className="dl-waiting-card">
						<div className="spinner" />
						<h2 className="dl-waiting-title">⏳ En attente...</h2>
						<p className="dl-waiting-text">{waitingMessage}</p>
						<button className="dl-btn-ghost" onClick={goToLobby}>
							Annuler
						</button>
					</div>
				</div>
			</ScreenLayout>
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