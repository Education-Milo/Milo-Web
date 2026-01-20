import axios, { type CreateAxiosDefaults } from 'axios';
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

APIAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = ['/token', '/register'].some(endpoint => originalRequest.url?.includes(endpoint));
    if (error.response?.status === 401 && !isAuthRequest) {
      const { logout } = useAuthStore.getState();
      await logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 🔹 Routes centralisées
export const APIRoutes = {
  POST_Register: '/register',
  POST_Login: '/token',
  POST_ForgotPassword: '/auth/forgot-password',
  GET_Me: '/users/me',
  PUT_Update_user: (userId: string) => `/users/${userId}`,
  POST_CREATE_QCM: '/qcm',
};

export default APIAxios;
