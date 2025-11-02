import React from 'react';
import { useDashboard } from '@hooks/useDashboard';
import TopBar from '@components/TopBar';
import '@styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const {
    welcomeMessage,
    user,
    children,
    selectedChild,
    handleLogout,
    handleSelectChild,
    handleViewDetails
  } = useDashboard();

  return (
    <div className="parent-dashboard">
      {/* Sidebar simplifiée pour parents */}
      <aside className="parent-sidebar">
        <div className="sidebar-logo">
          <img src="/milo-logo2.png" alt="Milo Logo" className="logo" />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-title">Navigation</div>
            <div className="nav-item active">
              <span className="nav-item-icon">🏠</span>
              <span>Tableau de bord</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">📊</span>
              <span>Statistiques</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">🏆</span>
              <span>Succès</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <h4>{user?.prenom}</h4>
              <p>Parent</p>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="parent-main-container">
        {/* Top Bar */}
        <TopBar 
          searchPlaceholder="Rechercher des informations..."
          energyPoints={0}
          streakDays={0}
        />

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h1 className="welcome-title">{welcomeMessage}</h1>
            <p className="welcome-subtitle">
              Suivez la progression de vos enfants dans leur apprentissage
            </p>
          </section>

          {/* Children Grid */}
          <section className="children-section">
            <h2 className="section-title">👨‍👩‍👧‍👦 Mes enfants</h2>
            <div className="children-grid">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`child-card ${selectedChild === child.id ? 'selected' : ''}`}
                  onClick={() => handleSelectChild(child.id)}
                >
                  <div className="child-header">
                    <div className="child-avatar">{child.avatar}</div>
                    <div className="child-info">
                      <h3 className="child-name">{child.name}</h3>
                      <p className="child-level">Niveau {child.level}</p>
                    </div>
                  </div>
                  
                  <div className="child-stats">
                    <div className="stat-item">
                      <span className="stat-icon">⚡</span>
                      <div className="stat-details">
                        <span className="stat-value">{child.points}</span>
                        <span className="stat-label">Points</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">🔥</span>
                      <div className="stat-details">
                        <span className="stat-value">{child.streak}</span>
                        <span className="stat-label">Jours</span>
                      </div>
                    </div>
                  </div>

                  <div className="child-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${child.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{child.progress}% complété</span>
                  </div>

                  {selectedChild === child.id && (
                    <div className="child-actions">
                      <button 
                        className="action-btn primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(child.id);
                        }}
                      >
                        Voir les détails
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Quick Stats */}
          <section className="stats-section">
            <h2 className="section-title">📊 Vue d'ensemble</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">📚</div>
                <div className="stat-card-content">
                  <h3>Cours complétés</h3>
                  <p className="stat-value">12</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">✅</div>
                <div className="stat-card-content">
                  <h3>Missions terminées</h3>
                  <p className="stat-value">45</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🏆</div>
                <div className="stat-card-content">
                  <h3>Succès obtenus</h3>
                  <p className="stat-value">18</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">⚔️</div>
                <div className="stat-card-content">
                  <h3>Duels remportés</h3>
                  <p className="stat-value">8</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

