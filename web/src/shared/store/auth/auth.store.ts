import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import qs from 'qs';
import { isAxiosError } from 'axios';
import type {
  AccountLoginResponse,
  AccountLoginResult,
  AuthStore,
  ProfileSummary,
  AuthResponse,
  LoginResponse,
  LogoutOptions,
} from '@shared/store/auth/auth.model';
import APIAxios, { APIRoutes, AuthAxios, AUTH_COOKIE_MODE, authCookieParams } from '@api/axios.api';
import { jwtDecode } from 'jwt-decode';
import {
  clearDemoSession,
  loadDemoSession,
  saveDemoSession,
} from '@shared/store/auth/demoSession';
import type { DemoTokenResponse } from '@features/admin/store/admin.model';
import { ROUTES } from '@shared/constants/routes';

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

/**
 * Même principe pour la session de compte (cookie httpOnly `milo_account`,
 * 30 min) : sans ce drapeau, chaque visiteur anonyme déclencherait un
 * GET /profiles voué au 401 au démarrage.
 */
const ACCOUNT_HINT_KEY = 'milo_account_session';
const setAccountHint = (active: boolean) => {
  try {
    if (active && AUTH_COOKIE_MODE) localStorage.setItem(ACCOUNT_HINT_KEY, '1');
    else localStorage.removeItem(ACCOUNT_HINT_KEY);
  } catch {
    // stockage indisponible : pas de reprise de l'écran de choix
  }
};
const hasAccountHint = () => {
  try {
    return localStorage.getItem(ACCOUNT_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Appareil de confiance hors mode cookie : le back renvoie `device_token` dans
 * le corps de /token/2fa, à présenter en `X-Device-Token` aux /token suivants.
 * En mode cookie, c'est le cookie httpOnly `milo_device` qui fait ce travail et
 * rien n'est stocké ici.
 */
const DEVICE_TOKEN_KEY = 'milo_device_token';
const loadDeviceToken = () => {
  if (AUTH_COOKIE_MODE) return null;
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
};
const saveDeviceToken = (token: string | undefined) => {
  if (AUTH_COOKIE_MODE || !token) return;
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } catch {
    // stockage indisponible : le code sera simplement redemandé
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

/**
 * Données de niveau compte en cache (liste des profils, réglages) : à oublier
 * à chaque changement de compte, sinon l'écran « Qui est-ce ? » d'un compte
 * pourrait afficher les profils du précédent sur un navigateur partagé.
 */
const forgetAccountQueries = async () => {
  const { queryClient } = await import('@shared/lib/queryClient');
  queryClient.removeQueries({ queryKey: ['account'] });
};

const clearLocalSession = async () => {
  const { useUserStore } = await import('@shared/store/user/user.store');
  useUserStore.getState().clearUserData();
  const { queryClient } = await import('@shared/lib/queryClient');
  queryClient.clear();
};

const NO_ACCOUNT_SESSION = {
  hasAccountSession: false,
  accountToken: '',
  accountTokenExpiresAt: 0,
  profiles: [],
};

/** État local d'une session de compte fermée (le drapeau de reprise avec). */
const noAccountSession = () => {
  setAccountHint(false);
  return NO_ACCOUNT_SESSION;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      /**
       * Compte authentifié (mot de passe, puis second facteur s'il y en a un) :
       * on garde le jeton de compte le temps de choisir un profil. Un compte
       * à un seul profil sans PIN n'a rien à choisir : il est ouvert d'office.
       */
      const enterAccount = async (data: AccountLoginResponse): Promise<AccountLoginResult> => {
        const profiles = data.profiles ?? [];
        await forgetAccountQueries();
        set({
          // Null en mode cookie : le navigateur porte le cookie milo_account
          accountToken: data.account_token ?? '',
          accountTokenExpiresAt: Date.now() + data.expires_in * 1000,
          profiles,
        });
        setAccountHint(true);
        // Le serveur a révoqué la session de profil que portait le cookie
        // milo_refresh (connexion aboutie) : le drapeau local n'a plus d'objet
        setSessionHint(false);
        if (profiles.length === 1 && !profiles[0].has_pin) {
          try {
            await get().selectProfile(profiles[0].id);
            return { status: 'authenticated' };
          } catch {
            // Échec de l'ouverture directe : l'écran de choix prendra le relais
          }
        }
        // Seulement maintenant : l'écran de connexion renvoie vers le choix
        // de profil dès qu'une session de compte est ouverte
        set({ hasAccountSession: true });
        return { status: 'select_profile', profiles };
      };

      return {
      loading: false,
      accessToken: '',
      ...NO_ACCOUNT_SESSION,
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
          // Compte connecté sur « Qui est-ce ? » (F5) : l'écran de choix passe
          // avant toute session de profil, et on ne se rabat JAMAIS sur le
          // refresh, même si le cookie de compte a expiré. Sinon un refresh
          // token resté sur le navigateur rouvrirait un profil sans son PIN.
          if (hasAccountHint()) {
            await get().restoreAccountSession();
            return false;
          }
          // Une session de profil rend la main directement dans l'application
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
        const deviceToken = loadDeviceToken();
        const data = qs.stringify({
          grant_type: "password",
          username: email,
          password,
          scope: "",
          client_id: "",
          client_secret: "",
        });
        const response = await APIAxios.post<LoginResponse>(
          APIRoutes.POST_Login,
          data,
          {
            params: authCookieParams,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              ...(deviceToken ? { 'X-Device-Token': deviceToken } : {}),
            },
          }
        );
        // Mot de passe vérifié, second facteur attendu : aucune session encore
        if (response.data.two_factor_required) {
          return { status: 'two_factor', challenge: response.data };
        }
        return enterAccount(response.data);
      },

      completeTwoFactor: async ({ challengeToken, method, code, trustDevice, deviceName }) => {
        const response = await APIAxios.post<AccountLoginResponse>(
          APIRoutes.POST_Login_2FA,
          {
            challenge_token: challengeToken,
            method,
            code: code.trim(),
            trust_device: trustDevice,
            ...(trustDevice && deviceName?.trim() ? { device_name: deviceName.trim() } : {}),
          },
          { params: authCookieParams },
        );
        saveDeviceToken(response.data.device_token);
        return enterAccount(response.data);
      },

      selectProfile: async (profileId, pin) => {
        // Toujours depuis la session de compte, jamais avec le jeton d'un
        // profil : le serveur ne redemande pas le PIN à un appelant déjà dans
        // le profil visé. D'où AuthAxios, sans l'intercepteur qui poserait le
        // jeton d'accès. Pour changer de profil : leaveProfile d'abord.
        const { accountToken } = get();
        const response = await AuthAxios.post<AuthResponse>(
          APIRoutes.POST_Profile_Select(profileId),
          pin ? { pin } : null,
          {
            params: authCookieParams,
            // Mode cookie : milo_account part tout seul
            headers: accountToken ? { Authorization: `Bearer ${accountToken}` } : undefined,
          },
        );
        const token = extractAccessToken(response.data);
        if (!token) {
          throw new Error('No access token received from server');
        }
        await get().openSession(response.data);
        // Après l'ouverture : l'écran de choix ne doit jamais se retrouver
        // sans aucun jeton, il renverrait à la connexion. Le cookie de compte
        // peut subsister côté navigateur : le jeton du profil l'emporte.
        set(noAccountSession());
      },

      leaveProfile: async () => {
        const token = await get().ensureFreshAccessToken();
        if (!token) {
          // Session du profil déjà morte : rien à quitter, retour à la connexion
          await get().logout();
          return 'logged_out';
        }
        // Révoque la session du profil (cookie milo_refresh) et réémet la
        // session de compte : pas de mot de passe à retaper
        const response = await AuthAxios.post<AccountLoginResponse>(
          APIRoutes.POST_Logout_Profile,
          null,
          { params: authCookieParams, headers: { Authorization: `Bearer ${token}` } },
        );
        // Le jeton du profil quitté doit disparaître : présenté à nouveau, il
        // rouvrirait ce profil sans PIN (le serveur voit un appelant déjà dedans)
        clearDemoSession();
        get().stopTokenValidation();
        setSessionHint(false);
        setAccountHint(true);
        await clearLocalSession();
        await forgetAccountQueries();
        if (AUTH_COOKIE_MODE) {
          // Le jeton ne vit qu'en mémoire : le rechargement complet le jette,
          // avec tout ce qui restait du profil (stores, WebSockets). Le
          // démarrage reprend la session de compte (cookie milo_account).
          // Pas de remise à zéro avant : l'application basculerait un instant
          // sur le site public.
          reloadAs(ROUTES.PROFILE_SELECT);
          return 'reloading';
        }
        // Hors mode cookie : jeton persisté, effacé ici ; le jeton de compte ne
        // vit qu'en mémoire, donc pas de rechargement
        set({
          accessToken: '',
          tokenValidationInterval: null,
          hasAccountSession: true,
          accountToken: response.data.account_token ?? '',
          accountTokenExpiresAt: Date.now() + response.data.expires_in * 1000,
          profiles: response.data.profiles ?? [],
        });
        return 'select_profile';
      },

      clearAccountSession: async () => {
        if (AUTH_COOKIE_MODE) {
          // Efface milo_account (et un éventuel milo_refresh) ; jamais bloquant
          await AuthAxios.post(APIRoutes.POST_Logout).catch(() => {});
        }
        set(noAccountSession());
        await forgetAccountQueries();
      },

      restoreAccountSession: async () => {
        if (!AUTH_COOKIE_MODE || !hasAccountHint()) return false;
        try {
          // Sans intercepteur : un 401 ici veut seulement dire « pas de compte »
          const response = await AuthAxios.get<ProfileSummary[]>(APIRoutes.GET_Profiles);
          await forgetAccountQueries();
          set({
            hasAccountSession: true,
            accountToken: '',
            // Échéance inconnue après un rechargement : le 401 fera foi
            accountTokenExpiresAt: 0,
            profiles: response.data,
          });
          return true;
        } catch {
          set(noAccountSession());
          return false;
        }
      },

      accountAuthHeaders: (): Record<string, string> => {
        const { accessToken, accountToken } = get();
        return !accessToken && accountToken ? { Authorization: `Bearer ${accountToken}` } : {};
      },

      sendTwoFactorEmail: async (challengeToken) => {
        await APIAxios.post(APIRoutes.POST_Login_2FA_Email, { challenge_token: challengeToken });
      },

      openSession: async (data: AuthResponse) => {
        // refresh_token vaut null : il est dans le cookie, on n'en garde rien en JS
        const token = extractAccessToken(data);
        if (!token) {
          throw new Error('No access token received from server');
        }
        set({ accessToken: token });
        setSessionHint(true);
        // Un profil est ouvert : plus d'écran de choix à reprendre au démarrage
        setAccountHint(false);
        const { useUserStore } = await import('@shared/store/user/user.store');
        await useUserStore.getState().getMe(true);
      },

      registerStudent: async (payload) => {
        const response = await APIAxios.post<AuthResponse>(
          APIRoutes.POST_Register_Student,
          payload,
          { params: authCookieParams },
        );
        await get().openSession(response.data);
      },

      registerParent: async ({ first_name, last_name, username, email, password }) => {
        // Corps reconstruit champ par champ : rien d'autre ne doit partir
        const response = await APIAxios.post<AuthResponse>(
          APIRoutes.POST_Register_Parent,
          { first_name, last_name, username, email, password },
          { params: authCookieParams },
        );
        await get().openSession(response.data);
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
        set({ accessToken: '', ...noAccountSession(), tokenValidationInterval: null });
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
          ...noAccountSession(),
          tokenValidationInterval: null,
        });
      },

      logoutEverywhere: async () => {
        clearDemoSession();
        // Tous les profils du compte, sur tous les appareils
        const token = get().accessToken || get().accountToken;
        get().stopTokenValidation();
        await AuthAxios.post(APIRoutes.POST_LogoutAll, null, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => {});
        setSessionHint(false);
        await clearLocalSession();
        set({
          accessToken: '',
          ...noAccountSession(),
          tokenValidationInterval: null,
        });
      },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Mode cookie : rien n'est persisté, l'access token ne vit qu'en mémoire
      // et la session est restaurée au démarrage via le cookie de refresh.
      // Le jeton de compte n'est jamais persisté, dans aucun mode.
      partialize: (state) => (AUTH_COOKIE_MODE ? {} : { accessToken: state.accessToken }),
    }
  )
);
