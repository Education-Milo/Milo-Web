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
          const isValid = await checkTokenValidity();
          if (!isMounted) return;
          if (isValid) {
            await getMe(true);
            startTokenValidation();
          }
        } catch (error) {
          console.error('Erreur vérification token:', error);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

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