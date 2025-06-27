import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';
import ProfilePage from './ProfilePage';
import MiloModel3D from '../components/Milo3DModel';

// Type pour définir la structure d'une mission
interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  status: 'completed' | 'pending';
}

const HomePage: React.FC = () => {
  // État pour le message d'accueil dynamique
  const [welcomeMessage, setWelcomeMessage] = useState('Bon retour, champion ! 🎉');
  
  // État pour l'élément de navigation actif
  const [activeNav, setActiveNav] = useState('Accueil');
  
  // État pour la page active
  const [activePage, setActivePage] = useState('Accueil');

  // État pour la liste des missions
  const [missions, setMissions] = useState<Mission[]>([
    { id: 1, title: 'Révision quotidienne', description: 'Mission accomplie avec brio !', category: 'GÉNÉRAL', points: 50, status: 'completed' },
    { id: 2, title: 'Vocabulaire anglais', description: 'Apprendre 10 nouveaux mots', category: 'ANGLAIS', points: 30, status: 'pending' },
    { id: 3, title: 'Exercices de mathématiques', description: 'Résoudre 5 problèmes de géométrie', category: 'MATHÉMATIQUES', points: 40, status: 'pending' },
  ]);

  // Calcul du nombre de missions complétées
  const completedMissionsCount = missions.filter(m => m.status === 'completed').length;

  // Effet pour mettre à jour le message d'accueil au chargement
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setWelcomeMessage('Bonjour, Titouan ! 🌅');
    } else if (hour < 17) {
      setWelcomeMessage('Bon après-midi, Titouan ! ☀️');
    } else {
      setWelcomeMessage('Bonsoir, Titouan ! 🌙');
    }
  }, []);

  // Fonction pour gérer le clic sur une mission
  const handleMissionClick = (missionId: number) => {
    setMissions(prevMissions =>
      prevMissions.map(mission =>
        mission.id === missionId && mission.status === 'pending'
          ? { ...mission, status: 'completed', description: 'Mission accomplie avec brio !' }
          : mission
      )
    );
  };

  // Fonction pour gérer la navigation
  const handleNavigation = (page: string) => {
    setActiveNav(page);
    setActivePage(page);
  };

  // Si la page Profil est active, afficher le composant ProfilePage
  if (activePage === 'Profil') {
    return <ProfilePage onNavigate={handleNavigation} />;
  }

  return (
    <>
            {/* Sidebar Navigation */}
            {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/milo-logo2.png" alt="Milo Logo" className="logo" />
        </div>

        <nav className="sidebar-nav">
          {/* Exemple de gestion de l'état actif sur un groupe de navigation */}
          <div className="nav-group">
            <div className="nav-group-title">Principal</div>
            {['Accueil', 'Cours', 'Missions', 'Duels'].map(item => (
              <div 
                key={item} 
                className={`nav-item ${activeNav === item ? 'active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <span className="nav-item-icon">
                  {item === 'Accueil' && '🏠'}
                  {item === 'Cours' && '📚'}
                  {item === 'Missions' && '✅'}
                  {item === 'Duels' && '⚔️'}
                </span>
                <span>{item}</span>
                {item === 'Cours' && <span className="nav-item-badge">3</span>}
              </div>
            ))}
          </div>

          <div className="nav-group">
                <div className="nav-group-title">Progression</div>
                <div className="nav-item">
                    <span className="nav-item-icon">🏆</span>
                    <span>Succès</span>
                </div>
                <div className="nav-item">
                    <span className="nav-item-icon">📊</span>
                    <span>Statistiques</span>
                </div>
                <div className="nav-item">
                    <span className="nav-item-icon">🎯</span>
                    <span>Objectifs</span>
                </div>
            </div>
            
            <div className="nav-group">
                <div className="nav-group-title">Social</div>
                <div className="nav-item">
                    <span className="nav-item-icon">👥</span>
                    <span>Amis</span>
                </div>
                <div className="nav-item">
                    <span className="nav-item-icon">🌟</span>
                    <span>Classements</span>
                </div>
            </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile" onClick={() => handleNavigation('Profil')}>
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <h4>Profil</h4>
              <p>Niveau Expert</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-container">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Rechercher des cours, missions, amis..." />
          </div>

          <div className="top-bar-actions">
            <div className="stats-badges">
              <div className="stat-badge yellow">
                <span>⚡</span>
                <span>450</span>
              </div>
              <div className="stat-badge orange">
                <span>🔥</span>
                <span>3</span>
              </div>
            </div>

            <button className="action-button">🔔</button>
            <button className="action-button">⚙️</button>
          </div>
        </header>

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
            <section className="section-card chat-milo-central">
              <div className="chat-content-with-milo">
                <div className="milo-3d-fullscreen">
                  <MiloModel3D modelPath="/milo.glb" />
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