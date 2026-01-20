import React from 'react';
import '@styles/ProfilePage.css';
import { useProfilePage } from '@hooks/useProfilePage';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';

const ProfilePage: React.FC = () => {
  const {
    isEditing,
    profile,
    tempProfile,
    user,
    fileInputRef,
    handleLogout,
    handleInputChange,
    handleSave,
    handleCancel,
    startEditing
  } = useProfilePage();

  console.log('Rendering ProfilePage with user:', user?.classe);

  return (
    <>
      <Sidebar
        onLogout={handleLogout}
        userProfile={{
          email: user?.email || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          classe: user?.classe,
          role: user?.role,
        }}
      />
      <main className="main-container">
        <TopBar
          energyPoints={0}
          streakDays={0}
        />
        <div className="profile-container">
          <section className="profile-header">
            <div className="profile-header-content">
              <div className="profile-picture-section">
                <div className="profile-picture-container">
                    <div className="profile-picture-placeholder">👤</div>
                </div>
              </div>
              <div className="profile-info">
                <h1 className="profile-name">{profile.first_name} {profile.last_name}</h1>
                <p className="profile-level">Niveau 1</p>
                <p className="profile-classe">Classe {profile.classe?.toLowerCase()}</p>
              </div>

              <div className="profile-actions">
                {!isEditing ? (
                  <button className="edit-btn" onClick={startEditing}>
                    ✏️ Modifier le profil
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSave}>
                      ✅ Sauvegarder
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      ❌ Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
          <section className="profile-form-section">
            <div className="section-header">
              <h2 className="section-title">📝 Informations personnelles</h2>
            </div>

            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tempProfile.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tempProfile.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={tempProfile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Classe</label>
                <select
                  className="form-input"
                  value={tempProfile.classe}
                  onChange={(e) => handleInputChange('classe', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="" disabled>Sélectionnez votre classe</option>
                  <option value="6ème">6ème</option>
                  <option value="5ème">5ème</option>
                  <option value="4ème">4ème</option>
                  <option value="3ème">3ème</option>
                </select>
              </div>
            </div>
          </section>
          <section className="profile-stats-section">
            <div className="section-header">
              <h2 className="section-title">📊 Statistiques</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <h4>Succès obtenus</h4>
                <p>{0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <h4>Cours terminés</h4>
                <p>{0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <h4>Points totaux</h4>
                <p>{0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <h4>Série actuelle</h4>
                <p>{0} jours</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;