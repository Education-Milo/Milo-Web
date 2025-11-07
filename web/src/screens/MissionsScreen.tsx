import React from 'react';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import { useMissionsScreen } from '@hooks/useMissionsScreen';
import MissionItem from '@components/MissionItem/MissionItem';
import BadgeItem from '@components/BadgeItem/BadgeItem';
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

  // Délais de base pour les animations
  const dailyMissionDelayStart = 0.3; // Après les cartes principales
  const badgeDelayStart = 0.5; // Après les missions quotidiennes

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
              <div className="monthly-challenge-bottom-content">
                <span className="monthly-challenge-days-left-text">
                  📅 {monthlyChallenge.daysLeft} jours restants
                </span>
                <div className="monthly-challenge-fox-img">
                  <img src="/miloBook.webp" alt="Milo reading a book" />
                </div>
              </div>

            </section>

            <section className="section-card daily-missions-card">
              <div className="section-header">
                <h2 className="section-title">🎯 Missions du jour</h2>
                <div className="missions-timer">⏳ 8 HEURES</div>
              </div>
              
              <div className="daily-missions-list">
                {dailyMissions.map((mission, index) => (
                  <MissionItem 
                    key={mission.id} 
                    mission={mission} 
                    animationDelay={`${dailyMissionDelayStart + index * 0.05}s`}
                  />
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
                    {badgesByYear[year].map((badge, index) => (
                      <BadgeItem 
                        key={badge.id} 
                        badge={badge} 
                        animationDelay={`${badgeDelayStart + index * 0.03}s`}
                      />
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