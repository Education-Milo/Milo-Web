import React from "react";
import type { DuelStatsData } from "@shared/types/duels";
import "@features/duels/styles/DuelsScreen.css";

interface DuelStatsProps {
  stats: DuelStatsData | null;
  loading: boolean;
}

const DuelStats: React.FC<DuelStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="duel-stats-empty">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!stats || stats.total_games === 0) {
    return (
      <div className="duel-stats-empty">
        <p>Aucune partie jouée pour l'instant. Lance ton premier duel !</p>
      </div>
    );
  }

  return (
    <div className="duel-stats-container">
      {/* Global counters */}
      <div className="duel-stats-grid">
        <div className="duel-stat-chip duel-stat-win">
          <span className="duel-stat-icon">🏆</span>
          <span className="duel-stat-value">{stats.wins}</span>
          <span className="duel-stat-label">Victoires</span>
        </div>
        <div className="duel-stat-chip duel-stat-draw">
          <span className="duel-stat-icon">🤝</span>
          <span className="duel-stat-value">{stats.draws}</span>
          <span className="duel-stat-label">Égalités</span>
        </div>
        <div className="duel-stat-chip duel-stat-loss">
          <span className="duel-stat-icon">💀</span>
          <span className="duel-stat-value">{stats.losses}</span>
          <span className="duel-stat-label">Défaites</span>
        </div>
        <div className="duel-stat-chip duel-stat-total">
          <span className="duel-stat-icon">⚔️</span>
          <span className="duel-stat-value">{stats.total_games}</span>
          <span className="duel-stat-label">Total</span>
        </div>
      </div>

      {/* Winrate bar */}
      <div className="duel-winrate-row">
        <div className="duel-winrate-labels">
          <span>Taux de victoire</span>
          <span className="duel-winrate-pct">{stats.winrate}%</span>
        </div>
        <div className="duel-winrate-bar-wrap">
          <div
            className="duel-winrate-bar"
            style={{ width: `${stats.winrate}%` }}
          />
        </div>
        <div className="duel-avg-score">
          Score moyen : <strong>{stats.avg_score}</strong> / 5
        </div>
      </div>

      {/* Per-opponent breakdown */}
      {stats.per_opponent.length > 0 && (
        <div className="duel-per-opponent">
          <h4 className="duel-per-opponent-title">Face à face</h4>
          <div className="duel-opponent-list">
            {stats.per_opponent
              .sort((a, b) => b.wins + b.draws + b.losses - (a.wins + a.draws + a.losses))
              .map((opp) => (
                <div key={opp.opponent_id} className="duel-opponent-row">
                  <span className="duel-opponent-name">{opp.opponent_username}</span>
                  <div className="duel-opponent-record">
                    <span className="rec-win">{opp.wins}V</span>
                    <span className="rec-draw">{opp.draws}N</span>
                    <span className="rec-loss">{opp.losses}D</span>
                  </div>
                  <span className="duel-opponent-winrate">{opp.winrate}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelStats;
