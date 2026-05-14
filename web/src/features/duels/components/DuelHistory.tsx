import React from "react";
import type { DuelHistoryEntry } from "@shared/types/duels";
import "@features/duels/styles/DuelsScreen.css";

interface DuelHistoryProps {
  history: DuelHistoryEntry[];
  loading: boolean;
}

const OUTCOME_LABEL: Record<string, string> = {
  win: "Victoire",
  loss: "Défaite",
  draw: "Égalité",
};

const OUTCOME_ICON: Record<string, string> = {
  win: "🏆",
  loss: "💀",
  draw: "🤝",
};

function formatDate(raw: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DuelHistory: React.FC<DuelHistoryProps> = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="duel-stats-empty">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="duel-stats-empty">
        <p>Aucun duel terminé pour l'instant.</p>
      </div>
    );
  }

  // Most recent first
  const sorted = [...history].sort(
    (a, b) =>
      new Date(b.played_at ?? 0).getTime() - new Date(a.played_at ?? 0).getTime()
  );

  return (
    <div className="duel-history-list">
      {sorted.map((entry) => (
        <div key={entry.duel_id} className={`duel-history-row duel-history-${entry.outcome}`}>
          <span className="duel-history-icon">{OUTCOME_ICON[entry.outcome]}</span>
          <div className="duel-history-info">
            <span className="duel-history-opponent">vs {entry.opponent_username}</span>
            <span className="duel-history-date">{formatDate(entry.played_at)}</span>
          </div>
          <div className="duel-history-score">
            <span className="duel-history-my-score">{entry.my_score}</span>
            <span className="duel-history-sep">–</span>
            <span className="duel-history-opp-score">{entry.opponent_score}</span>
          </div>
          <span className={`duel-history-badge duel-history-badge-${entry.outcome}`}>
            {OUTCOME_LABEL[entry.outcome]}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DuelHistory;
