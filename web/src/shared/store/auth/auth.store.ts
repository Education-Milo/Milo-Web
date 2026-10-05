import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import qs from 'qs';
import { isAxiosError } from 'axios';
import type { AuthStore, AuthResponse, LogoutOptions } from '@shared/store/auth/auth.model';
import APIAxios, { APIRoutes, AuthAxios, AUTH_COOKIE_MODE, authCookieParams } from '@api/axios.api';
import { jwtDecode } from 'jwt-decode';
import {
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
} from '@shared/store/auth/demoSession';
import type { DemoTokenResponse } from '@features/admin/store/admin.model';

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

const isJwtExpired = (token: string | undefined, marginSeconds = 60) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    return !decoded.exp || decoded.exp < Date.now() / 1000 + marginSeconds;
  } catch {
    return true;
  }
};

/**
 * Jeton admin pendant une bascule, sans toucher à l'état : en mode cookie,
 * le cookie de refresh de l'admin est intact et en redonne un ; en mode
 * legacy, celui mis de côté à l'entrée.
 */
const fetchAdminTokenSilently = async (legacyAdminToken?: string): Promise<string | null> => {
  if (!AUTH_COOKIE_MODE) {
    return legacyAdminToken && !isJwtExpired(legacyAdminToken, 0) ? legacyAdminToken : null;
  }
  try {
    const response = await AuthAxios.post<AuthResponse>(APIRoutes.POST_Refresh, null, {
      params: authCookieParams,
    });
    return extractAccessToken(response.data) || null;
  } catch {
    return null;
  }
};

/** Nouveau jeton de démo via la route admin (pas de refresh token pour une démo). */
const requestDemoToken = async (accountId: number, adminToken: string) => {
  const response = await AuthAxios.post<DemoTokenResponse>(
    APIRoutes.POST_Admin_Demo_Token(accountId),
    null,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  return response.data;
};

/**
 * Changement d'identité (admin ↔ démo) : rechargement complet. Le cache de
 * requêtes, les stores (bulletin scanné, chat, QCM…) et les WebSockets
 * repartent de zéro, rien de l'autre identité ne subsiste en mémoire.
 */
const reloadAs = (path: string) => {
  window.location.assign(path);
};

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
        const demo = loadDemoSession();
        if (!AUTH_COOKIE_MODE && !demo) return Promise.resolve(null);
        if (!refreshInFlight) {
          refreshInFlight = (async () => {
            // Pendant une bascule : surtout pas le refresh normal, qui rendrait
            // silencieusement la main au compte admin. On redemande un jeton de
            // démo avec un jeton admin obtenu sans modifier l'état.
            if (demo) {
              try {
                const adminToken = await fetchAdminTokenSilently(demo.adminToken);
                if (!adminToken) throw new Error('admin session lost');
                const renewed = await requestDemoToken(demo.accountId, adminToken);
                saveDemoSession({ ...demo, accessToken: renewed.access_token });
                set({ accessToken: renewed.access_token });
                return renewed.access_token;
              } catch {
                // Profil supprimé ou session admin perdue : fin de la démo.
                // Si l'admin est encore connecté, on recharge sur son compte.
                clearDemoSession();
                const adminToken = await fetchAdminTokenSilently(demo.adminToken);
                if (adminToken) window.location.assign('/');
                return null;
              } finally {
                refreshInFlight = null;
              }
            }
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
        // Bascule en cours (rechargement de la page) : on reprend la démo
        const demo = loadDemoSession();
        if (demo) {
          if (!isJwtExpired(demo.accessToken)) {
            set({ accessToken: demo.accessToken });
            return true;
          }
          return Boolean(await refreshAccessToken());
        }
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
        clearDemoSession();
        setSessionHint(false);
        await clearLocalSession();
        set({ accessToken: '', tokenValidationInterval: null });
      },

      enterDemo: async (accountId) => {
        const adminToken = get().accessToken;
        if (!adminToken) throw new Error('Not logged in');
        // Jeton de démo demandé avec le jeton admin courant
        const response = await APIAxios.post<DemoTokenResponse>(
          APIRoutes.POST_Admin_Demo_Token(accountId),
        );
        const demoToken = response.data.access_token;
        if (!demoToken) throw new Error('No demo token received');
        saveDemoSession({
          accountId,
          role: response.data.account.role,
          username: response.data.account.username,
          accessToken: demoToken,
          adminToken: AUTH_COOKIE_MODE ? undefined : adminToken,
        });
        // Au rechargement, bootstrapSession reprend la démo depuis sessionStorage
        // et la page de redirection choisit l'accueil selon le rôle.
        reloadAs('/');
      },

      exitDemo: async () => {
        const demo = loadDemoSession();
        clearDemoSession();
        if (!AUTH_COOKIE_MODE) {
          // Mode legacy : le jeton admin mis de côté redevient le jeton persisté
          if (!demo?.adminToken || isJwtExpired(demo.adminToken, 0)) {
            await get().logout({ remote: false });
            reloadAs('/login');
            return;
          }
          set({ accessToken: demo.adminToken });
        }
        // Mode cookie : au rechargement, /token/refresh (cookie admin intact)
        // redonne un jeton admin.
        reloadAs('/admin');
      },

      logout: async ({ remote = true }: LogoutOptions = {}) => {
        clearDemoSession();
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
        clearDemoSession();
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
