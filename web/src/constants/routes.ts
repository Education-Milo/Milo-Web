// src/constants/routes.ts

export const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',

    ROOT: '/',

    PROFILE: '/profile',
    UNAUTHORIZED: '/unauthorized',

    HOME: '/home',
    MILO: '/milo',
    COURSES: '/courses',
    MISSIONS: '/missions',
    DUELS: '/duels',

    PARENT: {
      DASHBOARD: '/parent/dashboard',
      CHILDREN: '/parent/children',
      PROGRESS: '/parent/progress',
      CONTROLS: '/parent/controls',
    },

    PROF: {
      DASHBOARD: '/prof/dashboard',
      CLASSES: '/prof/classes',
      STUDENTS: '/prof/students',
    },

    ADMIN: {
      DASHBOARD: '/admin',
    },
  } as const;