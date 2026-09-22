import axios, { type CreateAxiosDefaults, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@shared/store/auth/auth.store';

const API_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Mode cookie (défaut) : le refresh token est posé par le back dans un cookie
 * httpOnly en ajoutant `?cookie=true` aux appels d'authentification, et
 * l'access token ne vit qu'en mémoire.
 *
 * `VITE_AUTH_COOKIE_MODE=false` (dev en http, cookie Secure impossible) :
 * comportement historique, access token persisté, pas de refresh.
 */
export const AUTH_COOKIE_MODE =
  String(import.meta.env.VITE_AUTH_COOKIE_MODE ?? 'true') !== 'false';

/** Paramètres à joindre aux appels /token, /register, /token/refresh. */
export const authCookieParams = AUTH_COOKIE_MODE ? { cookie: true } : undefined;

const baseConfig: CreateAxiosDefaults = {
  baseURL: API_URL,
  // Indispensable pour que le cookie de refresh parte et revienne
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

const APIAxios = axios.create(baseConfig);

/**
 * Instance sans intercepteurs, réservée à /token/refresh et /logout :
 * ces appels ne doivent jamais déclencher eux-mêmes un refresh.
 */
export const AuthAxios = axios.create(baseConfig);

// 🔹 Intercepteur de requête : Bearer access token
APIAxios.interceptors.request.use(
  config => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  err => Promise.reject(err)
);

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Routes qui ne doivent jamais provoquer de refresh sur 401. */
const AUTH_ENDPOINTS = ['/token', '/register', '/logout'];

// 🔹 Intercepteur de réponse : sur 401, un seul refresh puis rejeu de la requête
APIAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? '';
    const isAuthRequest = AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
    const { accessToken, refreshAccessToken, logout } = useAuthStore.getState();

    // Pas de session, requête d'auth, ou déjà rejouée : on ne boucle jamais.
    if (isAuthRequest || originalRequest._retry || !accessToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    // Les refresh concurrents sont sérialisés dans le store (une seule requête)
    const newToken = await refreshAccessToken();
    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return APIAxios(originalRequest);
    }

    // Refresh impossible : vraie déconnexion
    await logout({ remote: false });
    window.location.href = '/login';
    return Promise.reject(error);
  }
);

// 🔹 Routes centralisées
export const APIRoutes = {
  POST_Register: '/register',
  POST_Login: '/token',
  POST_Refresh: '/token/refresh',
  POST_Logout: '/logout',
  POST_LogoutAll: '/logout/all',
  // Réinitialisation par code à 6 chiffres (sans authentification).
  // L'ancienne route /forgotPassword est obsolète : ne plus l'utiliser.
  POST_Password_Forgot: '/password/forgot',
  POST_Password_Reset: '/password/reset',

  // User API
  GET_Me: '/users/me',
  PUT_Update_user: (userId: string) => `/users/${userId}`,
  POST_Add_User_Interest: (userId: string) => `/users/${userId}/interests`,
  DELETE_User_Interest: (userId: string, interestId: string) => `/users/${userId}/interests/${interestId}`,
  GET_User_By_Id: (userId: string) => `/users/${userId}`,
  GET_User_Search: '/users/search',
  GET_User_By_Username: (username: string) => `/users/by-username/${username}`,
  GET_Users_Presence: (ids: string) => `/users/presence?ids=${ids}`,

  // Friend API
  GET_Friends: '/friends',
  DELETE_FRIEND: (friendId: number) => `/friends/${friendId}`,
  POST_SEND_FRIEND_REQUEST: (friendId: number) => `/friends/${friendId}`,
  PATCH_ACCEPT_FRIEND_REQUEST: (friendId: number) => `/friends/${friendId}/accept`,
  PATCH_BLOCK_FRIEND: (friendId: number) => `/friends/${friendId}/block`,
  // Le paramètre est l'id utilisateur de l'ami, pas l'id de la relation
  PUT_PIN_FRIEND: (friendUserId: number) => `/friends/${friendUserId}/pin`,
  DELETE_PIN_FRIEND: (friendUserId: number) => `/friends/${friendUserId}/pin`,

  // Admin API (rôle Admin uniquement)
  POST_Admin_User_Role: (userId: number | string) => `/admin/users/${userId}/role`,
  GET_Admin_Audit: '/admin/audit',

  // Cosmetics API (boutique et casier)
  GET_Cosmetics: '/cosmetics',
  GET_Locker: (userId: string | number) => `/user/${userId}/locker`,
  POST_Locker_Add: (userId: string | number) => `/user/${userId}/locker/add`,
  PUT_Locker_Equip: (userId: string | number) => `/user/${userId}/locker/equip`,
  // DELETE sans paramètre : retire tout ; ?type=... : retire un emplacement
  DELETE_Locker_Equip: (userId: string | number) => `/user/${userId}/locker/equip`,
  GET_Locker_Equipped: (userId: string | number) => `/user/${userId}/locker/equipped`,

  // Missions API
  GET_Missions_Today: '/missions/today',
  POST_Mission_Reroll: (missionId: number) => `/missions/${missionId}/reroll`,

  // Tracking API (télémétrie élève)
  POST_Tracking_Performance: '/tracking/performance',
  POST_Tracking_Activity: '/tracking/activity',
  GET_Tracking_Stats_Me: '/tracking/stats/me',
  GET_Tracking_Performance_Me: '/tracking/performance/me',
  GET_Tracking_Activity_Me: '/tracking/activity/me',

  // Duel API
  POST_Challenge: (targetUserId: number) => `/duels/challenge/${targetUserId}`,
  POST_AcceptChallenge: (challengeId: string) => `/duels/challenge/${challengeId}/accept`,
  POST_DeclineChallenge: (challengeId: string) => `/duels/challenge/${challengeId}/decline`,
  GET_PendingChallenges: '/duels/pending',
  GET_DuelHistory: '/duels/history',
  GET_DuelStats: '/duels/stats',

  // Course API
  GET_Subjects: '/get_subjects',
  GET_Courses: '/get_courses',
  GET_Chapters: '/get_chapters',
  GET_Lessons: '/get_lessons',
  POST_Chat_Lesson: '/chat_lesson',
  POST_QCM_Lesson: '/qcm_lesson',
  POST_Lesson_Question: '/chat_lesson_question',
  POST_Free_Chat: '/chat',


  // OCR
  POST_OCR_Report_Card: '/ocr/report_card',
  POST_OCR_Exercise_generation: '/ocr/exercise_generation',
  POST_OCR_Course_qcm: '/ocr/course_qcm',
};

export default APIAxios;
