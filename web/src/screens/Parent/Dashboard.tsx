import React from 'react';
import '@styles/HomePage.css';
import '@styles/Dashboard.css';
import { useDashboard } from '@hooks/useDashboard';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';

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

  // 1. On sécurise le tableau (au cas où le hook renvoie undefined pendant le chargement)
  const safeChildren = children || [];
  
  // 2. On récupère l'enfant actif de manière sécurisée
  const activeChild = safeChildren.find(c => c.id === selectedChild) || safeChildren[0];

  return (
    <>
      <Sidebar
        onLogout={handleLogout}
        userProfile={{
          email: user?.email || '',
          first_name: user?.prenom || '',
          last_name: user?.nom || '',
          role: 'Parent',
        }}
      />
      
      <main className="main-container">
        <TopBar 
          searchPlaceholder="Rechercher une leçon, une statistique..."
          energyPoints={0}
          streakDays={0}
        />

        <div className="dashboard">
          <div className="main-column">
            
            <section className="welcome-section">
              <div className="welcome-content">
                <h1 className="welcome-title">{welcomeMessage || 'Bienvenue !'}</h1>
                <p className="welcome-subtitle">
                  Suivez la progression de vos enfants et leur temps d'apprentissage avec Milo.
                </p>
                
                {/* Ne s'affiche que s'il y a des enfants */}
                {safeChildren.length > 0 && (
                  <div className="quick-action-buttons">
                    {safeChildren.map((child) => (
                      <button 
                        key={child.id}
                        className={`quick-action-btn ${selectedChild === child.id ? 'active' : ''}`}
                        onClick={() => handleSelectChild(child.id)}
                        style={{ 
                          background: selectedChild === child.id ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)' 
                        }}
                      >
                        {child.avatar || '👤'} {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* CAS 1 : AUCUN ENFANT (Nouveau compte) */}
            {safeChildren.length === 0 && (
              <section className="section-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🦊</div>
                <h2 style={{ fontSize: '1.5rem', color: '#2d3748', marginBottom: '1rem' }}>
                  Prêt à accompagner votre enfant ?
                </h2>
                <p style={{ color: '#718096', marginBottom: '2rem' }}>
                  Il semble que vous n'ayez pas encore relié de compte enfant à votre profil parent.
                </p>
                <button 
                  className="quick-action-btn" 
                  style={{ background: '#ff6b35', color: 'white', border: 'none', padding: '1rem 2rem' }}
                >
                  + Lier un compte enfant
                </button>
              </section>
            )}

            {/* CAS 2 : STATISTIQUES (S'il y a un enfant actif) */}
            {activeChild && (
              <>
                <section className="section-card">
                  <div className="section-header">
                    <h2 className="section-title">📊 Vue d'ensemble : {activeChild.name}</h2>
                    <div className="progress-indicator">Ligue Actuelle : {activeChild.league || 'Débutant'}</div>
                  </div>

                  <div className="missions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', display: 'grid' }}>
                    <div className="mission-card green">
                      <div className="mission-content">
                        <div className="mission-info">
                          <h3 className="mission-title">Temps de révision</h3>
                          <p className="mission-description">Sur les 7 derniers jours</p>
                          <span className="mission-category">4h 30min</span>
                        </div>
                        <div className="mission-meta">
                          <div className="mission-icon" style={{fontSize: '2rem'}}>⏱️</div>
                        </div>
                      </div>
                    </div>

                    <div className="mission-card orange">
                      <div className="mission-content">
                        <div className="mission-info">
                          <h3 className="mission-title">Exercices réalisés</h3>
                          <p className="mission-description">Quizz et Flashcards</p>
                          <span className="mission-category">32 complétés</span>
                        </div>
                        <div className="mission-meta">
                          <div className="mission-icon" style={{fontSize: '2rem'}}>📚</div>
                        </div>
                      </div>
                    </div>

                    <div className="mission-card green">
                      <div className="mission-content">
                        <div className="mission-info">
                          <h3 className="mission-title">Cours importés</h3>
                          <p className="mission-description">Traités par Milo</p>
                          <span className="mission-category">8 documents</span>
                        </div>
                        <div className="mission-meta">
                          <div className="mission-icon" style={{fontSize: '2rem'}}>📄</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="section-card">
                  <div className="section-header">
                    <h2 className="section-title">🎯 Analyse pédagogique</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(72, 187, 120, 0.1)', borderRadius: '16px', borderLeft: '4px solid #48bb78' }}>
                      <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>Points forts</h3>
                      <ul style={{ color: '#4a5568', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Géométrie (Triangles)</li>
                        <li>Histoire contemporaine</li>
                        <li>Régularité des connexions</li>
                      </ul>
                    </div>
                    <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', borderLeft: '4px solid #ef4444' }}>
                      <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>Sujets à renforcer</h3>
                      <ul style={{ color: '#4a5568', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Multiplications complexes</li>
                        <li>Orthographe (Accords)</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* COLONNE LATÉRALE */}
          <div className="sidebar-column">
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">📝 Dernières activités</h2>
              </div>
              
              {activeChild ? (
                <>
                  <div className="achievements-list">
                    <div className="achievement-item">
                      <div className="achievement-icon">✅</div>
                      <div className="achievement-info">
                        <h4>Quizz de Mathématiques</h4>
                        <p>Score : 18/20 • Il y a 2h</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewDetails?.(activeChild.id)}
                    style={{
                      width: '100%', marginTop: '1.5rem', padding: '0.75rem', 
                      background: 'rgba(255, 107, 53, 0.1)', color: '#ff6b35', 
                      border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    Voir tout l'historique
                  </button>
                </>
              ) : (
                <p style={{ color: '#718096', textAlign: 'center' }}>Aucune activité récente.</p>
              )}
            </section>

            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">🏆 Gamification</h2>
              </div>
              {activeChild ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌟</div>
                  {/* Utilisation sécurisée de activeChild.points avec ? */}
                  <h3 style={{ fontSize: '1.5rem', color: '#2d3748' }}>{activeChild?.points || '0'} XP</h3>
                  <p style={{ color: '#718096', marginBottom: '1.5rem' }}>Top 15% de sa ligue</p>
                  <div style={{ background: '#edf2f7', borderRadius: '20px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', background: 'linear-gradient(135deg, #ff6b35, #f7931e)', height: '100%' }}></div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#718096', textAlign: 'center' }}>En attente de données...</p>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;