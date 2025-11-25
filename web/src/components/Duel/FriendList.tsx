import React from 'react';
import type { Friend } from '../../types/duels';
import '@styles/DuelsScreen.css'; // We will create this next

interface FriendListProps {
    friends: Friend[];
    onDuelRequest: (friendId: string) => void;
}

const FriendList: React.FC<FriendListProps> = ({ friends, onDuelRequest }) => {
    return (
        <div className="friend-list-container">
            <h3 className="friend-list-title">Mes Amis</h3>
            <div className="friend-list">
                {friends.map((friend, index) => (
                    <div
                        key={friend.id}
                        className="friend-item"
                        style={{ animationDelay: `${0.4 + index * 0.05}s` } as React.CSSProperties}
                    >
                        <div className="friend-avatar-container">
                            {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={`${friend.firstName} ${friend.lastName}`} className="friend-avatar" />
                            ) : (
                                <div className="friend-avatar-placeholder">
                                    {friend.firstName[0]}{friend.lastName[0]}
                                </div>
                            )}
                            <span className={`friend-status ${friend.status}`}></span>
                        </div>
                        <div className="friend-info">
                            <span className="friend-name">{friend.firstName} {friend.lastName}</span>
                            <span className="friend-level">Niveau {friend.level}</span>
                        </div>
                        <button
                            className="duel-button"
                            onClick={() => onDuelRequest(friend.id)}
                            disabled={friend.status !== 'online'}
                        >
                            ⚔️ Duel
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendList;
