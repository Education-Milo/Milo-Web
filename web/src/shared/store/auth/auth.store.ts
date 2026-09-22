import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import qs from 'qs';
import { isAxiosError } from 'axios';
import type { AuthStore, AuthResponse, LogoutOptions } from '@shared/store/auth/auth.model';
import APIAxios, { APIRoutes, AuthAxios, AUTH_COOKIE_MODE, authCookieParams } from '@api/axios.api';
import { jwtDecode } from 'jwt-decode';

/** Un seul refresh en vol : les appels concurrents partagent la même promesse. */
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Le cookie de refresh est httpOnly, donc invisible en JS. Ce drapeau local
 * indique seulement qu'une session a été ouverte sur ce navigateur : il évite
 * d'appeler /token/refresh (et un 401 attendu) pour un visiteur anonyme.
 * Il ne contient aucun secret.
 */
const SESSION_HINT_KEY = 'milo_session';
const setSessionHint = (active: boolean) => {
  try {
    if (active) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // stockage indisponible : on tentera simplement le refresh
  }
};
const hasSessionHint = () => {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return true;
  }
};

const TOKEN_CHECK_INTERVAL_MS = 60 * 1000;
/** On rafraîchit de façon proactive quand il reste moins de 2 minutes. */
const PROACTIVE_REFRESH_MARGIN_S = 120;

const extractAccessToken = (data: Partial<AuthResponse> & { accessToken?: string }) =>
  data?.access_token || data?.accessToken || '';

const clearLocalSession = async () => {
  const { useUserStore } = await import('@shared/store/user/user.store');
  useUserStore.getState().clearUserData();
  const { queryClient } = await import('@shared/lib/queryClient');
  queryClient.clear();
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      loading: false,
      accessToken: '',
      tokenValidationInterval: null as NodeJS.Timeout | null,

      isTokenExpired: (marginSeconds = 60) => {
        const { accessToken } = get();
        if (!accessToken) return true;
        try {
          const decoded = jwtDecode<{ exp?: number }>(accessToken);
          if (!decoded.exp) return true;
          return decoded.exp < Date.now() / 1000 + marginSeconds;
        } catch {
          return true;
        }
      },

      refreshAccessToken: () => {
        if (!AUTH_COOKIE_MODE) return Promise.resolve(null);
        if (!refreshInFlight) {
          refreshInFlight = (async () => {
            try {
              // Corps vide : le cookie httpOnly porte le refresh token
              const response = await AuthAxios.post<AuthResponse>(
                APIRoutes.POST_Refresh,
                null,
                { params: authCookieParams },
              );
              const token = extractAccessToken(response.data);
              if (!token) return null;
              set({ accessToken: token });
              setSessionHint(true);
              return token;
            } catch {
              setSessionHint(false);
              return null;
            } finally {
              refreshInFlight = null;
            }
          })();
        }
        return refreshInFlight;
      },

      ensureFreshAccessToken: async () => {
        const { accessToken, isTokenExpired, refreshAccessToken } = get();
        if (accessToken && !isTokenExpired(PROACTIVE_REFRESH_MARGIN_S)) {
          return accessToken;
        }
        const refreshed = await refreshAccessToken();
        if (refreshed) return refreshed;
        // Pas de refresh possible (mode legacy) : le token courant s'il est encore valide
        return accessToken && !isTokenExpired(0) ? accessToken : null;
      },

      bootstrapSession: async () => {
        const { accessToken, isTokenExpired, refreshAccessToken } = get();
        if (accessToken && !isTokenExpired()) return true;
        if (AUTH_COOKIE_MODE) {
          if (!hasSessionHint()) return false;
          return Boolean(await refreshAccessToken());
        }
        // Mode legacy : token persisté expiré → session terminée
        if (accessToken) await get().logout({ remote: false });
        return false;
      },

      checkTokenValidity: async () => {
        const token = await get().ensureFreshAccessToken();
        if (!token) {
          await get().logout({ remote: false });
          return false;
        }
        try {
          await APIAxios.get(APIRoutes.GET_Me, {
            headers: { 'X-Token-Validation': 'true' }
          });
          return true;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) {
            return false;
          }
          return true;
        }
      },

      startTokenValidation: () => {
        if (get().tokenValidationInterval) return;

        const interval = setInterval(async () => {
          const { accessToken, isTokenExpired, ensureFreshAccessToken } = get();
          if (!accessToken) {
            get().stopTokenValidation();
            return;
          }
          if (isTokenExpired(PROACTIVE_REFRESH_MARGIN_S)) {
            const token = await ensureFreshAccessToken();
            if (!token) {
              get().stopTokenValidation();
              await get().logout({ remote: false });
            }
          }
        }, TOKEN_CHECK_INTERVAL_MS);

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
        const data = qs.stringify({
          grant_type: "password",
          username: email,
          password,
          scope: "",
          client_id: "",
          client_secret: "",
        });
        const response = await APIAxios.post<AuthResponse>(
          APIRoutes.POST_Login,
          data,
          {
            params: authCookieParams,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        // refresh_token vaut null : il est dans le cookie, on n'en garde rien en JS
        const token = extractAccessToken(response.data);
        if (!token) {
          throw new Error('No access token received from server');
        }
        set({ accessToken: token });
        setSessionHint(true);
        const { useUserStore } = await import('@shared/store/user/user.store');
        await useUserStore.getState().getMe(true);
      },

      register: async (email, password, lastName, firstName, role, classe, username) => {
        try {
          const response = await APIAxios.post<AuthResponse>(
            APIRoutes.POST_Register,
            {
              email,
              password,
              first_name: firstName,
              last_name: lastName,
              role,
              class_: classe,
              username,
            },
            { params: authCookieParams },
          );
          const token = extractAccessToken(response.data);
          if (!token) {
            throw new Error('No access token received from server');
          }
          set({ accessToken: token });
          setSessionHint(true);
          const { useUserStore } = await import('@shared/store/user/user.store');
          await useUserStore.getState().getMe(true);
        } catch (error) {
          console.error('Register error:', error);
          throw error;
        }
      },

      forgetPassword: async (email) => {
        await APIAxios.post(APIRoutes.POST_Password_Forgot, { email });
      },

      resetPassword: async (email, code, newPassword) => {
        await APIAxios.post(APIRoutes.POST_Password_Reset, {
          email,
          code,
          new_password: newPassword,
        });
        // Le serveur a révoqué toutes les sessions : les jetons locaux ne
        // valent plus rien. On efface aussi le cookie de refresh, sans bloquer.
        get().stopTokenValidation();
        if (AUTH_COOKIE_MODE) {
          await AuthAxios.post(APIRoutes.POST_Logout).catch(() => {});
        }
        setSessionHint(false);
        await clearLocalSession();
        set({ accessToken: '', tokenValidationInterval: null });
      },

      logout: async ({ remote = true }: LogoutOptions = {}) => {
        get().stopTokenValidation();
        if (remote && AUTH_COOKIE_MODE) {
          // Efface le cookie côté serveur ; jamais bloquant
          await AuthAxios.post(APIRoutes.POST_Logout).catch(() => {});
        }
        setSessionHint(false);
        await clearLocalSession();
        set({
          accessToken: '',
          tokenValidationInterval: null,
        });
      },

      logoutEverywhere: async () => {
        const { accessToken } = get();
        get().stopTokenValidation();
        await AuthAxios.post(APIRoutes.POST_LogoutAll, null, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        }).catch(() => {});
        setSessionHint(false);
        await clearLocalSession();
        set({
          accessToken: '',
          tokenValidationInterval: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Mode cookie : rien n'est persisté, l'access token ne vit qu'en mémoire
      // et la session est restaurée au démarrage via le cookie de refresh.
      partialize: (state) => (AUTH_COOKIE_MODE ? {} : { accessToken: state.accessToken }),
    }
  )
);
