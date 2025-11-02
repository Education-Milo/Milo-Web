// Sidebar.tsx - MEILLEURE APPROCHE
import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import  type { UserProfile }   from '@store/auth/auth.model';
import { ROUTES } from '@constants/routes';

interface SidebarProps {
  onLogout: () => void;
  userProfile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, userProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Configuration des items de navigation
  const navItems = [
    { label: 'Accueil', path: ROUTES.HOME, icon: '🏠' },
    { label: 'Cours', path: ROUTES.COURSES, icon: '📚', badge: 3 },
    { label: 'Missions', path: ROUTES.MISSIONS, icon: '✅' },
    { label: 'Duels', path: ROUTES.DUELS, icon: '⚔️' },
  ];

  const progressItems = [
    { label: 'Succès', path: '/achievements', icon: '🏆' },
    { label: 'Statistiques', path: '/stats', icon: '📊' },
    { label: 'Objectifs', path: '/goals', icon: '🎯' },
  ];

  const socialItems = [
    { label: 'Amis', path: '/friends', icon: '👥' },
    { label: 'Classements', path: '/leaderboard', icon: '🌟' },
  ];

  // Vérifier si la route est active
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/milo-logo2.png" alt="Milo Logo" className="logo" />
      </div>

      <nav className="sidebar-nav">
        {/* Groupe Principal */}
        <div className="nav-group">
          <div className="nav-group-title">Principal</div>
          {navItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-item-badge">{item.badge}</span>}
            </div>
          ))}
        </div>

        {/* Groupe Progression */}
        <div className="nav-group">
          <div className="nav-group-title">Progression</div>
          {progressItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Groupe Social */}
        <div className="nav-group">
          <div className="nav-group-title">Social</div>
          {socialItems.map(item => (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" onClick={() => navigate('/profile')}>
          <div className="user-avatar">
            {userProfile?.profilePicture ? (
              <img src={userProfile.profilePicture} alt="Profile" className="profile-image" />
            ) : (
              '👤'
            )}
          </div>
          <div className="user-info">
            <h4>{userProfile?.firstName || 'Utilisateur'}</h4>
            <p>Niveau {userProfile?.level || '1'}</p>
          </div>
        </div>
        <button className="logout-button" onClick={onLogout} title="Se déconnecter">
          <LogOut size={18} />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;