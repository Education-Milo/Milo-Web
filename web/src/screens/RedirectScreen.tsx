import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';

const RedirectScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);

  useEffect(() => {
    if (!user) return;

    // Rediriger automatiquement selon le rôle
    switch (user.role) {
      case 'User':
        navigate('/home', { replace: true });
        break;
      case 'Parent':
        navigate('/parent/dashboard', { replace: true });
        break;
      case 'Prof':
        navigate('/prof/dashboard', { replace: true });
        break;
      case 'ADMIN':
        navigate('/admin', { replace: true });
        break;
      default:
        // Si rôle inconnu, aller vers home par défaut
        navigate('/home', { replace: true });
        break;
    }
  }, [user, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      backgroundColor: 'var(--bg-primary, #ffffff)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #f97316',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ 
        color: '#6b7280', 
        fontSize: '0.875rem',
        margin: 0
      }}>
        Redirection en cours...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RedirectScreen;