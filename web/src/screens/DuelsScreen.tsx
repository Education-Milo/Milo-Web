import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DuelsScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (page: string) => {
    switch (page) {
      case 'Accueil':
        navigate('/home');
        break;
      case 'Cours':
        navigate('/courses');
        break;
      case 'Missions':
        navigate('/missions');
        break;
      case 'Duels':
        navigate('/duels');
        break;
      case 'Profil':
        navigate('/profile');
        break;
      default:
        navigate('/home');
    }
  };

  const handleLogout = () => {
    // Ici vous pouvez ajouter la logique de déconnexion
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '20px'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          color: '#333',
          marginBottom: '20px'
        }}>
          ⚔️ Page des Duels
        </h1>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '15px' }}>
            À quoi correspond cette page ?
          </h2>
          <p style={{ 
            lineHeight: '1.6', 
            color: '#666',
            fontSize: '1.1rem'
          }}>
            Cette page permet aux utilisateurs de participer à des duels de programmation 
            contre d'autres utilisateurs. Les duels peuvent prendre la forme de défis 
            de code en temps réel, de compétitions algorithmiques, ou de battles 
            de résolution de problèmes pour stimuler l'apprentissage compétitif.
          </p>
        </div>

        <Sidebar 
          activeNav="Duels"
          onNavigation={handleNavigation}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
};

export default DuelsScreen;
