import React from 'react';
import '@styles/HomePage.css';
import { useHomePage } from '@hooks/useHomePage';
import MiloModel3D from '@components/Milo3DModel';
import ScreenLayout from '@components/ui/common/ScreenLayout.component';

const HomePage: React.FC = () => {
  const {
    welcomeMessage,
    missions,
    completedMissionsCount,
    handleMissionClick,
    handleMiloClick
  } = useHomePage();

  return (
    <>
      <ScreenLayout>
        <div className="dashboard">
          <div className="main-column">
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
          <div className="sidebar-column">
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
        </ScreenLayout>
      </>
  );
};

export default HomePage;