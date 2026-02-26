import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import qs from 'qs';
import type { AuthStore } from '@store/auth/auth.model';
import APIAxios, { APIRoutes } from '@api/axios.api';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      loading: false,
      accessToken: '',
      tokenValidationInterval: null as NodeJS.Timeout | null,

      isTokenExpired: () => {
        const { accessToken } = get();
        if (!accessToken) return true;

        try {
          const decoded: any = jwtDecode(accessToken);
          const currentTime = Date.now() / 1000;

          return decoded.exp < currentTime + 60;
        } catch (error) {
          console.error('Erreur décodage token:', error);
          return true;
        }
      },

      checkTokenValidity: async () => {
        const { isTokenExpired, accessToken } = get();

        if (!accessToken || isTokenExpired()) {
          await get().logout();
          return false;
        }

        try {
          await APIAxios.get(APIRoutes.GET_Me, {
            headers: { 'X-Token-Validation': 'true' }
          });
          return true;
        } catch (error: any) {
          if (error.response?.status === 401) {
            await get().logout();
            return false;
          }
          return true;
        }
      },

      startTokenValidation: () => {
        const state = get();
        if (state.tokenValidationInterval) {
          return;
        }

        const interval = setInterval(async () => {
          const { accessToken, isTokenExpired } = get();
          if (!accessToken) {
            get().stopTokenValidation();
            return;
          }

          if (isTokenExpired()) {
            await get().logout();
            get().stopTokenValidation();
            return;
          }
        }, 5 * 60 * 1000);

        set({ tokenValidationInterval: interval });
      },

      stopTokenValidation: () => {
        const { tokenValidationInterval } = get();
        if (tokenValidationInterval) {
          clearInterval(tokenValidationInterval);
          set({ tokenValidationInterval: null });
        }
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

      register: async (email, password, lastName, firstName, role, classe) => {
        console.log('Registering user with data:', { email, password, lastName, firstName, role, classe });
        try {
          const response = await APIAxios.post(APIRoutes.POST_Register, {
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role,
            class_: classe,
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
        get().stopTokenValidation();
        const { useUserStore } = await import('@store/user/user.store');
        useUserStore.getState().clearUserData();
        set({
          accessToken: '',
          tokenValidationInterval: null,
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
