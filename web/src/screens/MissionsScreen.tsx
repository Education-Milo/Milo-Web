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

        <div className="missions-page-container">
          <div className="missions-top-row">
            
            <section className="section-card monthly-challenge-card">
              
              <div className="monthly-challenge-top-content">
                <div className="monthly-challenge-header">
                  <h3>{monthlyChallenge.title}</h3>
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
              </div>

              {/* MODIFICATION DE LA STRUCTURE INTERNE DE CETTE CARTE */}
              <div className="monthly-challenge-bottom-content">
                {/* Le span "jours restants" est maintenant un enfant direct de ce conteneur */}
                <span className="monthly-challenge-days-left-text">
                  📅 {monthlyChallenge.daysLeft} jours restants
                </span>
                <div className="monthly-challenge-fox-img">
                  <img src="/miloBook.webp" alt="Milo en explorateur" />
                </div>
              </div>
              {/* FIN DE LA MODIFICATION */}
              
            </section>

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
                            <img src={badge.imageUrl || '/badges/badge-default-missed.png'} alt={badge.month} />
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