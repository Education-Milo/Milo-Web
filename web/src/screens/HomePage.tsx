import React from 'react';
import '@styles/HomePage.css';
import { useHomePage } from '@hooks/useHomePage';
import MiloModel3D from '@components/Milo3DModel';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';

const HomePage: React.FC = () => {
  const {
    // États
    welcomeMessage,
    activeNav,
    missions,
    completedMissionsCount,
    user,
    
    // Fonctions de gestion
    handleMissionClick,
    handleNavigation,
    handleLogout,
    handleMiloClick
  } = useHomePage();

  return (
    <>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeNav={activeNav}
        onNavigation={handleNavigation}
        onLogout={handleLogout}
        userProfile={{
          firstName: user?.prenom || '',
          lastName: user?.nom || '',
          level: user?.level?.toString() || '1',
          profilePicture: null
        }}
      />

      {/* Main Content */}
      <main className="main-container">
        {/* Top Bar */}
        <TopBar
          energyPoints={user?.points || 0}
          streakDays={user?.streak || 0}
        />

        {/* Dashboard Content */}
        <div className="dashboard">
          {/* Main Column */}
          <div className="main-column">
            {/* Welcome Section */}
            <section className="welcome-section">
              <div className="welcome-content">
                <h1 className="welcome-title">{welcomeMessage}</h1>
                <p className="welcome-subtitle">Prêt à conquérir de nouveaux défis aujourd'hui ?</p>
                <div className="quick-action-buttons">
                  <button className="quick-action-btn">📚 Continuer le cours</button>
                  <button className="quick-action-btn">🎯 Nouvelle mission</button>
                </div>
              </div>
            </section>

            {/* Chat with Milo - New Central Section */}
            <section
              className="section-card chat-milo-central"
              onClick={handleMiloClick}
            >
              <div className="chat-content-with-milo">
                <div className="milo-3d-fullscreen">
                  <MiloModel3D modelPath="/MiloV1RIGGED.glb" />
                </div>
                <div className="chat-text-overlay">
                  <h3>Discuter avec Milo</h3>
                  <p>Ton assistant IA t'attend !</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="sidebar-column">
            {/* Daily Missions - Moved to Sidebar */}
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">🎯 Missions du jour</h2>
                <div className="progress-indicator">{completedMissionsCount}/{missions.length} complétées</div>
              </div>

              <div className="missions-grid">
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    className={`mission-card ${mission.status === 'completed' ? 'green' : 'orange'}`}
                    onClick={() => handleMissionClick(mission.id)}
                  >
                    <div className="mission-content">
                      <div className="mission-info">
                        <h3 className="mission-title">{mission.title}</h3>
                        <p className="mission-description">{mission.description}</p>
                        <span className="mission-category">{mission.category}</span>
                      </div>
                      <div className="mission-meta">
                        <div className="mission-points">+{mission.points} pts</div>
                        {mission.status === 'completed' ? (
                          <div className="mission-check">✅</div>
                        ) : (
                          <div style={{ fontSize: '1.2rem', opacity: 0.7 }}>⏰</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Achievements - Remains in Sidebar */}
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">🏆 Derniers succès</h2>
              </div>
              <div className="achievements-list">
                <div className="achievement-item">
                  <div className="achievement-icon">🏅</div>
                  <div className="achievement-info">
                    <h4>Mathématicien</h4>
                    <p>15/01/2024</p>
                  </div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">📖</div>
                  <div className="achievement-info">
                    <h4>Lecteur assidu</h4>
                    <p>20/01/2024</p>
                  </div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">⚡</div>
                  <div className="achievement-info">
                    <h4>Série éclair</h4>
                    <p>22/01/2024</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;