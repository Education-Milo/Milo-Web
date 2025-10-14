import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import qs from 'qs';
import type { AuthStore } from '@store/auth/auth.model';
import APIAxios, { APIRoutes } from '@api/axios.api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      loading: false,
      accessToken: '',

      // Nouvelle fonction pour vérifier la validité du token
      checkTokenValidity: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          return false;
        }

        try {
          // Appel à une route qui nécessite une authentification
          // avec un en-tête spécial pour éviter la déconnexion automatique
          await APIAxios.get(APIRoutes.GET_Me, {
            headers: {
              'X-Token-Validation': 'true'
            }
          });
          return true;
        } catch (error: any) {
          if (error.response?.status === 401) {
            console.log('Token invalide détecté, déconnexion automatique');
            await get().logout();
            return false;
          }
          // Pour les autres erreurs (réseau, etc.), on considère le token comme valide
          return true;
        }
      },

      // Fonction pour démarrer la vérification périodique
      startTokenValidation: () => {
        const interval = setInterval(async () => {
          const { accessToken } = get();
          if (!accessToken) {
            clearInterval(interval);
            return;
          }

          try {
            // Appel à une route qui nécessite une authentification
            await APIAxios.get(APIRoutes.GET_Me, {
              headers: {
                'X-Token-Validation': 'true'
              }
            });
          } catch (error: any) {
            if (error.response?.status === 401) {
              console.log('Token invalide détecté lors de la vérification périodique, déconnexion automatique');
              await get().logout();
              clearInterval(interval);
            }
          }
        }, 5 * 60 * 1000); // Vérification toutes les 5 minutes

        // Retourner la fonction pour arrêter l'intervalle
        return () => clearInterval(interval);
      },

      login: async (email, password) => {
        try {
          const data = qs.stringify({
            grant_type: "password",
            username: email,
            password,
            scope: "",
            client_id: "",
            client_secret: "",
          });
          const response = await APIAxios.post(
            APIRoutes.POST_Login,
            data,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );
          const token = response.data.access_token || response.data.accessToken;
          set({
            accessToken: token,
          });
          const { useUserStore } = await import('@store/user/user.store');
          await useUserStore.getState().getMe(true);
        } catch (error) {
          throw error;
        }
      },

      register: async (email, password, lastName, firstName, role) => {
        try {
          console.log('Registering user with role:', role, email, lastName, firstName, password);
          const response = await APIAxios.post(APIRoutes.POST_Register, {
            email,
            password,
            nom: lastName,
            prenom: firstName,
            role
          });
          const token = response.data.access_token || response.data.accessToken;
          if (!token) {
            throw new Error('No access token received from server');
          }
          set({
            accessToken: token,
          });
          const { useUserStore } = await import('@store/user/user.store');
          await useUserStore.getState().getMe(true);
        } catch (error) {
          console.error('Register error:', error);
          throw error;
        }
      },

      forgetPassword: async (email) => {
        try {
          await APIAxios.post(APIRoutes.POST_ForgotPassword, {
            email,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: async () => {
        const { useUserStore } = await import('@store/user/user.store');
        useUserStore.getState().clearUserData();
        set({
          accessToken: '',
        });
      },

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
