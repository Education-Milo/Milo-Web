import axios, { AxiosError, type CreateAxiosDefaults } from 'axios';
import { useAuthStore } from '@store/auth/auth.store';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const APIAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
} as CreateAxiosDefaults);

// 🔹 Intercepteur de requête
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

// 🔹 Intercepteur de réponse
APIAxios.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    if (
      err.response?.status === 401 &&
      (err.response as any)?.data?.message !== 'CODE_NOT_CORRECT' &&
      !err.config?.headers?.['X-Token-Validation'] // Éviter les boucles infinies lors de la validation
    ) {
      console.warn('Unauthorized access - token expired, logging out');
      try {
        await useAuthStore.getState().logout();
        // Forcer le rechargement de la page pour rediriger vers /login
        window.location.href = '/login';
      } catch (logoutError) {
        console.error('Error during automatic logout:', logoutError);
        // En cas d'erreur, forcer quand même la redirection
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

// 🔹 Routes centralisées
export const APIRoutes = {
  POST_Register: '/register',
  POST_Login: '/token',
  POST_ForgotPassword: '/auth/forgot-password',
  POST_RequestConfirmEmail: '/auth/request-confirm-email',
  GET_Me: '/users/me',
  POST_CREATE_QCM: '/qcm',
};

export default APIAxios;
