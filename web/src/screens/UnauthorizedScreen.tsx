import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useUserStore } from '@store/user/user.store';
import { useAuthStore } from '@store/auth/auth.store';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const logout = useAuthStore(state => state.logout);


  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    logout().then(() => {
      navigate('/login');
    });
  };

  const getRoleMessage = () => {
    switch (user?.role) {
      case 'User':
        return "Cette page est réservée aux parents, professeurs ou administrateurs.";
      case 'Parent':
        return "Cette page est réservée aux élèves, professeurs ou administrateurs.";
      case 'Prof':
        return "Cette page est réservée aux élèves, parents ou administrateurs.";
      case 'ADMIN':
        return "Vous n'avez pas l'autorisation d'accéder à cette page.";
      default:
        return "Vous n'avez pas les permissions nécessaires pour accéder à cette page.";
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'User':
        return 'Élève';
      case 'Parent':
        return 'Parent';
      case 'Prof':
        return 'Professeur';
      case 'ADMIN':
        return 'Administrateur';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        {/* Icône */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            padding: '1rem',
            display: 'inline-flex'
          }}>
            <ShieldAlert size={48} color="#dc2626" />
          </div>
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Accès refusé
        </h1>

        {/* Message */}
        <p style={{
          color: '#6b7280',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          {getRoleMessage()}
        </p>

        {/* Informations supplémentaires */}
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#4b5563',
            margin: 0
          }}>
            <strong>Votre rôle actuel :</strong> {getRoleLabel()}
          </p>
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexDirection: 'column'
        }}>
          <button
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#f97316',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
          >
            <Home size={20} />
            Se reconnecter
          </button>

          <button
            onClick={handleGoBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: 'transparent',
              color: '#6b7280',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <ArrowLeft size={20} />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;