import { useEffect, useState } from 'react';
import { useAuthStore } from '@shared/store/auth/auth.store';
import { useUserStore } from '@shared/store/user/user.store';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const accessToken = useAuthStore(state => state.accessToken);
  const bootstrapSession = useAuthStore(state => state.bootstrapSession);
  const startTokenValidation = useAuthStore(state => state.startTokenValidation);
  const stopTokenValidation = useAuthStore(state => state.stopTokenValidation);
  const getMe = useUserStore(state => state.getMe);

  // Au démarrage : restaure la session (cookie de refresh en mode cookie,
  // token persisté en mode legacy) puis charge le profil. Une seule fois.
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const hasSession = await bootstrapSession();
        if (!isMounted) return;
        if (hasSession) {
          await getMe(true);
        }
      } catch (error) {
        console.error('Erreur initialisation session:', error);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Surveillance proactive de l'expiration tant qu'une session existe
  useEffect(() => {
    if (accessToken) {
      startTokenValidation();
    } else {
      stopTokenValidation();
    }
    return () => stopTokenValidation();
  }, [accessToken, startTokenValidation, stopTokenValidation]);

  return {
    isAuthenticated: !!accessToken,
    isLoading
  };
};
