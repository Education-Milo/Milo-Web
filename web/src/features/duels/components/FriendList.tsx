import React from "react";
import type { Friend } from "@shared/types/duels";
import "@features/duels/styles/DuelsScreen.css";

interface FriendListProps {
  friends: Friend[];
  onDuelRequest: (friendId: string) => void;
  loading?: boolean;
}

const FriendList: React.FC<FriendListProps> = ({
  friends,
  onDuelRequest,
  loading,
}) => {
  return (
    <div className="friend-list-container">
      <h3 className="friend-list-title">Mes Amis</h3>
      {loading ? (
        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Chargement...</p>
      ) : friends.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
          Aucun ami à afficher. Ajoute des amis pour les défier !
        </p>
      ) : (
        <div className="friend-list">
          {friends.map((friend, index) => (
            <div
              key={friend.id}
              className="friend-item"
              style={{ animationDelay: `${0.4 + index * 0.05}s` } as React.CSSProperties}
            >
              <div className="friend-avatar-container">
                {friend.avatarUrl ? (
                  <img
                    src={friend.avatarUrl}
                    alt={`${friend.firstName} ${friend.lastName}`}
                    className="friend-avatar"
                  />
                ) : (
                  <div className="friend-avatar-placeholder">
                    {friend.firstName[0]}
                    {friend.lastName[0]}
                  </div>
                )}
                <span className={`friend-status ${friend.status}`} />
              </div>
              <div className="friend-info">
                <span className="friend-name">
                  {friend.firstName} {friend.lastName}
                </span>
                <span className={`friend-status-label friend-status-label-${friend.status}`}>
                  {friend.status === "online"
                    ? "En ligne"
                    : friend.status === "in-game"
                    ? "En partie"
                    : "Hors ligne"}
                </span>
              </div>
              <button
                className="duel-button"
                onClick={() => onDuelRequest(friend.id)}
                disabled={friend.status === "offline"}
              >
                ⚔️ Duel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendList;
