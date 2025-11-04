import React from 'react';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import { useMissionsScreen } from '@hooks/useMissionsScreen';
import '@styles/MissionsScreen.css';
import '@styles/HomePage.css'; 

const MissionsScreen: React.FC = () => {
  const {
    user,
    handleNavigation,
    handleLogout,
    dailyMissions,
    monthlyChallenge,
    badgesByYear,
    sortedYears
  } = useMissionsScreen();

  return (
    <>
      <Sidebar 
        activeNav="Missions"
        onNavigation={handleNavigation}
        onLogout={handleLogout}
        userProfile={{
          firstName: user?.prenom || '',
          lastName: user?.nom || '',
          level: user?.level?.toString() || '1',
          profilePicture: null
        }}
      />

      <main className="main-container">
        <TopBar
          energyPoints={user?.points || 0}
          streakDays={user?.streak || 0}
        />

        {/* MODIFIÉ : Le layout est maintenant une seule colonne verticale */}
        <div className="missions-page-container">

          {/* NOUVEAU : Rangée du haut contenant les 2 cartes de missions */}
          <div className="missions-top-row">
            
            {/* Carte Défi Mensuel (prend 2/3 de la largeur) */}
            <section className="section-card monthly-challenge-card">
              <div className="monthly-challenge-header">
                <h3>{monthlyChallenge.title}</h3>
                <span>📅 {monthlyChallenge.daysLeft} jours restants</span>
              </div>
              <div className="monthly-challenge-body">
                <p>Termine {monthlyChallenge.questsTotal} quêtes ce mois-ci pour gagner un badge exclusif !</p>
                <div className="mission-progress-container">
                  <div className="mission-progress-bar">
                    <div 
                      className="mission-progress-fill" 
                      style={{ width: `${(monthlyChallenge.questsCurrent / monthlyChallenge.questsTotal) * 100}%` }}
                    ></div>
                  </div>
                  <span>{monthlyChallenge.questsCurrent}/{monthlyChallenge.questsTotal}</span>
                </div>
              </div>
              <div className="monthly-challenge-fox-img">
                <img src="/buttonGo.png" alt="Milo en explorateur" />
              </div>
            </section>

            {/* Carte Missions du Jour (prend 1/3 de la largeur) */}
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">🎯 Missions du jour</h2>
                <div className="missions-timer">⏳ 8 HEURES</div>
              </div>
              
              <div className="daily-missions-list">
                {dailyMissions.map((mission) => (
                  <div key={mission.id} className="mission-item">
                    <div className="mission-item-icon">{mission.icon}</div>
                    <div className="mission-item-info">
                      <h4>{mission.title}</h4>
                      <div className="mission-progress-container">
                        <div className="mission-progress-bar">
                          <div 
                            className="mission-progress-fill" 
                            style={{ width: `${(mission.progressCurrent / mission.progressTotal) * 100}%` }}
                          ></div>
                        </div>
                        <span>{mission.progressCurrent}/{mission.progressTotal}</span>
                      </div>
                    </div>
                    <div className="mission-item-reward">
                      <span>+{mission.rewardPoints} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* NOUVEAU : Section Calendrier des Badges (pleine largeur) */}
          <section className="section-card badge-calendar-card">
            <div className="section-header">
              <h2 className="section-title">🏆 Badges Mensuels</h2>
            </div>
            
            <div className="badge-calendar-content">
              {sortedYears.map((year) => (
                <div key={year} className="badge-year-section">
                  <h3 className="badge-year-title">Badges {year}</h3>
                  <div className="badge-grid">
                    {badgesByYear[year].map((badge) => (
                      <div key={badge.id} className={`badge-item ${badge.status}`}>
                        <div className="badge-circle">
                          {badge.status === 'locked' ? (
                            <span className="badge-lock-icon">🔒</span>
                          ) : (
                            // Utilisez une image par défaut si imageUrl est nul mais que le badge n'est pas verrouillé
                            <img src={badge.imageUrl || './public/badges/badge1.png'} alt={badge.month} />
                          )}
                        </div>
                        <span className="badge-month-label">{badge.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  );
};

export default MissionsScreen;