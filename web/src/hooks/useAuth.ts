import { useEffect, useState } from 'react';
import { useAuthStore } from '@store/auth/auth.store';
import { useUserStore } from '@store/user/user.store';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const accessToken = useAuthStore(state => state.accessToken);
  const checkTokenValidity = useAuthStore(state => state.checkTokenValidity);
  const startTokenValidation = useAuthStore(state => state.startTokenValidation);
  const stopTokenValidation = useAuthStore(state => state.stopTokenValidation);
  const getMe = useUserStore(state => state.getMe);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (accessToken) {
        try {
          // Vérifier la validité du token
          const isValid = await checkTokenValidity();

          if (!isMounted) return;

          if (isValid) {
            // Charger les données utilisateur
            await getMe(true);
            // Démarrer la validation périodique
            startTokenValidation();
          }
          // Si invalide, checkTokenValidity() appelle déjà logout()
        } catch (error) {
          console.error('Erreur vérification token:', error);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      stopTokenValidation();
    };
  }, [accessToken, checkTokenValidity, startTokenValidation, stopTokenValidation, getMe]);

  return {
    isAuthenticated: !!accessToken,
    isLoading
  };
};