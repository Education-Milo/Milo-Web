import React from 'react';
import '@styles/ProfilePage.css';
import { useProfilePage } from '@hooks/useProfilePage';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import TextFieldComponent from '@components/ui/common/TextField.component';

const ProfilePage: React.FC = () => {
  const {
    // États
    isEditing,
    profile,
    tempProfile,
    user,
    // Références
    fileInputRef,
    // Fonctions de gestion
    handleLogout,
    handleInputChange,
    handlePhotoUpload,
    handleSave,
    handleCancel,
    triggerPhotoUpload,
    startEditing
  } = useProfilePage();

  return (
    <>
      {/* Sidebar Navigation */}
      <Sidebar
        onLogout={handleLogout}
        userProfile={{
          email: user?.email || '',
          firstName: user?.prenom || '',
          lastName: user?.nom || '',
          level: user?.level?.toString() || '1',
          role: user?.role || '',
          profilePicture: undefined
        }}
      />

      {/* Main Content */}
      <main className="main-container">
        {/* Top Bar */}
        <TopBar
          energyPoints={user?.points || 0}
          streakDays={user?.streak || 0}
        />

        {/* Profile Content */}
        <div className="profile-container">
          {/* Profile Header */}
          <section className="profile-header">
            <div className="profile-header-content">
              <div className="profile-picture-section">
                <div className="profile-picture-container">
                  {tempProfile.profilePicture ? (
                    <img src={tempProfile.profilePicture} alt="Profile" className="profile-picture" />
                  ) : (
                    <div className="profile-picture-placeholder">👤</div>
                  )}
                  {isEditing && (
                    <button className="change-photo-btn" onClick={triggerPhotoUpload}>
                      📷
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="profile-info">
                <h1 className="profile-name">{profile.firstName} {profile.lastName}</h1>
                <p className="profile-level">Niveau {profile.level}</p>
                <p className="profile-bio">{profile.bio}</p>
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

          {/* Profile Form */}
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
                    value={tempProfile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                  <TextFieldComponent
                    type='text'
                    placeholder='Prénom'
                    // label="Prénom"
                    value={tempProfile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tempProfile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
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
              <div className="form-group">
                <label className="form-label">Date de naissance</label>
                <input
                  type="date"
                  className="form-input"
                  value={tempProfile.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  disabled={!isEditing}
                />
                {/* TODO: Ajouter le champ dateOfBirth au modèle User */}
              </div>
              </div>

              <div className="form-group">
                <label className="form-label">Niveau</label>
                <select
                  className="form-input"
                  value={tempProfile.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-textarea"
                  value={tempProfile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Parlez-nous de vous..."
                />
                {/* TODO: Ajouter le champ bio au modèle User */}
              </div>
            </div>
          </section>

          {/* Profile Stats */}
          <section className="profile-stats-section">
            <div className="section-header">
              <h2 className="section-title">📊 Statistiques</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <h4>Succès obtenus</h4>
                <p>{user?.challengesCompleted || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <h4>Cours terminés</h4>
                <p>{user?.documentsScanned || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <h4>Points totaux</h4>
                <p>{user?.points?.toLocaleString() || '0'}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <h4>Série actuelle</h4>
                <p>{user?.streak || 0} jours</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;