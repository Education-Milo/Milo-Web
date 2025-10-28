import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import AuthNavigator from '@navigation/AuthNavigator';
import PublicNavigator from '@navigation/PublicNavigator';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  const accessToken = useAuthStore(state => state.accessToken);
  const checkTokenValidity = useAuthStore(state => state.checkTokenValidity);
  const startTokenValidation = useAuthStore(state => state.startTokenValidation);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken) {
        try {
          const isValid = await checkTokenValidity();
          setIsAuthenticated(isValid);

          if (isValid) {
            startTokenValidation();
          }
        } catch (error) {
          console.error('Erreur vérification token:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    initializeAuth();
    // Cleanup lors du démontage
    return () => {
      const stopValidation = useAuthStore.getState().stopTokenValidation;
      stopValidation();
    };
  }, [accessToken]);

  if (isLoading) {
    return (
      <ThemeProvider>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Vérification de l'authentification...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        {isAuthenticated ? <AuthNavigator /> : <PublicNavigator />}
      </Router>
    </ThemeProvider>
  );
};

export default App;