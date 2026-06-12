import axios, { type CreateAxiosDefaults } from 'axios';
import { useAuthStore } from '@shared/store/auth/auth.store';

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
  POST_ForgotPassword: '/forgotPassword',

  // User API
  GET_Me: '/users/me',
  PUT_Update_user: (userId: string) => `/users/${userId}`,
  POST_Add_User_Interest: (userId: string) => `/users/${userId}/interests/`,
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
