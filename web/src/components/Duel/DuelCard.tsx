
import React from 'react';
import type { Duel } from '../../types/duels';
import '@styles/DuelsScreen.css';

interface DuelCardProps {
    duel?: Duel;
    isSearching?: boolean;
    onRandomDuel?: () => void;
    animationDelay?: string;
}

const DuelCard: React.FC<DuelCardProps> = ({ duel, isSearching, onRandomDuel, animationDelay }) => {
    if (isSearching) {
        return (
            <div className="duel-card searching" style={{ animationDelay }}>
                <div className="spinner"></div>
                <h3>Recherche d'un adversaire...</h3>
                <p>Prépare-toi au combat !</p>
            </div>
        );
    }

    if (!duel && onRandomDuel) {
        return (
            <div className="duel-card random-duel" onClick={onRandomDuel} style={{ animationDelay }}>
                <div className="duel-icon">🎲</div>
                <h3>Duel Aléatoire</h3>
                <p>Affronte un adversaire de ton niveau</p>
                <button className="start-random-duel-btn">Trouver un match</button>
            </div>
        );
    }

    if (duel) {
        return (
            <div className="duel-card active-duel" style={{ animationDelay }}>
                <div className="duel-header">
                    <span className="duel-status">{duel.status === 'pending' ? 'En attente...' : 'En cours'}</span>
                </div>
                <div className="duel-content">
                    <div className="duel-opponent">
                        <div className="opponent-avatar">
                            {duel.opponent.firstName[0]}
                        </div>
                        <span className="opponent-name">{duel.opponent.firstName}</span>
                    </div>
                    <div className="duel-vs">VS</div>
                    <div className="duel-user">
                        <div className="user-avatar">Moi</div>
                    </div>
                </div>
                <button className="join-duel-btn">
                    {duel.status === 'pending' ? 'Annuler' : 'Rejoindre'}
                </button>
            </div>
        );
    }

    return null;
};

export default DuelCard;
