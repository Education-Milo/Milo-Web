import React, { useState, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { authService } from '../services/authService';

// Interface pour les informations utilisateur
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  level: string;
  bio: string;
  profilePicture: string | null;
}

// Props pour le composant ProfilePage
interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  
  // État pour l'élément de navigation actif
  const [activeNav, setActiveNav] = useState('Profil');
  
  // État pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  
  // Référence pour l'input file
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour les informations du profil
  const [profile, setProfile] = useState<UserProfile>({
    firstName: 'Titouan',
    lastName: 'Dupont',
    email: 'titouan.dupont@email.com',
    dateOfBirth: '2005-03-15',
    level: 'Expert',
    bio: 'Passionné d\'apprentissage et toujours prêt à relever de nouveaux défis !',
    profilePicture: null
  });

  // État temporaire pour l'édition
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

  // Fonction pour gérer la navigation
  const handleNavigation = (page: string) => {
    setActiveNav(page);
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  // Fonction pour gérer le changement des champs
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour gérer l'upload de photo
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempProfile(prev => ({
          ...prev,
          profilePicture: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour sauvegarder les modifications
  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  // Fonction pour annuler les modifications
  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  // Fonction pour déclencher l'upload de photo
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/milo-logo2.png" alt="Milo Logo" className="logo" />
        </div>

        <nav className="sidebar-nav">
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
            <div className="user-avatar">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="profile-image" />
              ) : (
                '👤'
              )}
            </div>
            <div className="user-info">
              <h4>{profile.firstName}</h4>
              <p>Niveau {profile.level}</p>
            </div>
          </div>
          
          {/* Bouton de déconnexion */}
          <button 
            className="logout-button"
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <LogOut size={18} />
            <span>Se déconnecter</span>
          </button>
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
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
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
                <p>24</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <h4>Cours terminés</h4>
                <p>8</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <h4>Points totaux</h4>
                <p>2,450</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <h4>Série actuelle</h4>
                <p>15 jours</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;