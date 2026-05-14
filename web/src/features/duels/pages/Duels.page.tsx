import React from "react";
import { useDuelsScreen } from "@features/duels/hooks/useDuelsPage";
import FriendList from "@features/duels/components/FriendList";
import DuelCard from "@features/duels/components/DuelCard";
import DuelGame from "@features/duels/components/DuelGame";
import DuelStats from "@features/duels/components/DuelStats";
import DuelHistory from "@features/duels/components/DuelHistory";
import LobbyToast from "@features/duels/components/LobbyToast";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import "@features/duels/styles/DuelsScreen.css";

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
        <div className="duel-game-container">
          <div className="duel-game-card" style={{ textAlign: "center", gap: "24px" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
            <h2 style={{ color: "#f97316", fontWeight: 700 }}>⏳ En attente...</h2>
            <p style={{ color: "#64748b" }}>{waitingMessage}</p>
            <button className="challenge-decline-btn" onClick={goToLobby}>
              Annuler
            </button>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  return (
    <ScreenLayout>
      <div className="duels-page-container">
        {/* Welcome Banner */}
        <section className="duels-welcome-card">
          <div className="duels-welcome-milo-image-container">
            <img
              src="/buttonGo.webp"
              alt="Milo greetings"
              className="milo-greeting-image"
            />
          </div>
          <div className="duels-welcome-text">
            <h1 className="welcome-card-title">Arène de Duels</h1>
            <p className="welcome-card-subtitle">
              Défie tes amis ou affronte des adversaires aléatoires pour
              monter dans le classement !
            </p>
          </div>
        </section>

        <LobbyToast />

        <div className="duels-top-row">
          {/* Duel actions */}
          <section className="duels-section-card">
            <div className="section-header">
              <h2 className="section-title">⚔️ Duels</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Random matchmaking card */}
              <DuelCard onRandomDuel={startMatchmaking} animationDelay="0.4s" />

              {/* Challenge a friend by username */}
            </div>
          </section>

          {/* Friends list */}
          <section className="duels-section-card">
            <FriendList
              friends={friends}
              onDuelRequest={handleDuelRequest}
              loading={loadingFriends}
            />
          </section>
        </div>

        {/* Stats */}
        <section className="duels-section-card">
          <div className="section-header">
            <h2 className="section-title">📊 Mes Statistiques</h2>
          </div>
          <DuelStats stats={stats} loading={loadingStats} />
        </section>

        {/* History */}
        <section className="duels-section-card">
          <div className="section-header">
            <h2 className="section-title">📜 Historique des parties</h2>
          </div>
          <DuelHistory history={history} loading={loadingHistory} />
        </section>
      </div>
    </ScreenLayout>
  );
};

export default DuelsScreen;
