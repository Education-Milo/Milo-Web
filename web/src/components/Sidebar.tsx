import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interface pour les informations utilisateur
interface UserProfile {
  firstName: string;
  lastName: string;
  level: string;
  profilePicture?: string | null;
}

// Props pour le composant Sidebar
interface SidebarProps {
  activeNav: string;
  onNavigation: (page: string) => void;
  onLogout: () => void;
  userProfile?: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavigation,
  onLogout,
  userProfile
}) => {
  const navigate = useNavigate();
  // Valeurs par défaut pour le profil utilisateur
  const defaultProfile: UserProfile = {
    firstName: 'Titouan',
    lastName: 'Dupont',
    level: 'Expert',
    profilePicture: null
  };

  const profile = userProfile || defaultProfile;

  return (
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
              onClick={() => onNavigation(item)}
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
        <div className="user-profile" onClick={() => navigate('/profile')}>
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
          onClick={onLogout}
          title="Se déconnecter"
        >
          <LogOut size={18} />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
