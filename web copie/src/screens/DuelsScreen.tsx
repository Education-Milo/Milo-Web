import React from 'react';
import { useDuelsScreen } from '@hooks/useDuelsScreen';
import FriendList from '@components/Duel/FriendList';
import DuelCard from '@components/Duel/DuelCard';
import ScreenLayout from '@components/ui/common/ScreenLayout.component';
import '@styles/DuelsScreen.css';

const DuelsScreen: React.FC = () => {
  const {
    friends,
    activeDuels,
    isSearching,
    handleDuelRequest,
    handleRandomDuel
  } = useDuelsScreen();

  return (
    <>
      <ScreenLayout>
        <div className="duels-page-container">
          {/* Welcome Banner */}
          <section className="duels-welcome-card">
            <div className="duels-welcome-milo-image-container">
              <img src="/buttonGo.webp" alt="Milo greetings" className="milo-greeting-image" />
            </div>
            <div className="duels-welcome-text">
              <h1 className="welcome-card-title">
                Arène de Duels
              </h1>
              <p className="welcome-card-subtitle">
                Défie tes amis ou affronte des adversaires aléatoires pour monter dans le classement !
              </p>
            </div>
          </section>

          <div className="duels-top-row">
            {/* Active Duels / Random Duel Section */}
            <section className="duels-section-card">
              <div className="section-header">
                <h2 className="section-title">⚔️ Duels</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeDuels.length > 0 ? (
                  activeDuels.map((duel, index) => (
                    <DuelCard
                      key={duel.id}
                      duel={duel}
                      animationDelay={`${0.4 + index * 0.1}s`}
                    />
                  ))
                ) : (
                  <DuelCard
                    isSearching={isSearching}
                    onRandomDuel={handleRandomDuel}
                    animationDelay="0.4s"
                  />
                )}
              </div>
            </section>

            {/* Friends List Section */}
            <section className="duels-section-card">
              <FriendList
                friends={friends}
                onDuelRequest={handleDuelRequest}
              />
            </section>
          </div>

          {/* History or Leaderboard could go here */}
          <section className="duels-section-card">
            <div className="section-header">
              <h2 className="section-title">🏆 Classement Hebdomadaire</h2>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
              <p>Le classement sera bientôt disponible !</p>
            </div>
          </section>
        </div>
      </ScreenLayout>
    </>
  );
};

export default DuelsScreen;
