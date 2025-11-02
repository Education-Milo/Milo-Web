// src/constants/routes.ts

export const ROUTES = {
    // Routes publiques
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',

    // Route de redirection
    ROOT: '/',

    // Routes communes (tous les utilisateurs connectés)
    PROFILE: '/profile',
    UNAUTHORIZED: '/unauthorized',

    // Routes USER (Élève)
    HOME: '/home',
    MILO: '/milo',
    COURSES: '/courses',
    MISSIONS: '/missions',
    DUELS: '/duels',

    // Routes PARENT
    PARENT: {
      DASHBOARD: '/parent/dashboard',
      CHILDREN: '/parent/children',
      PROGRESS: '/parent/progress',
      CONTROLS: '/parent/controls',
    },

    // Routes PROF
    PROF: {
      DASHBOARD: '/prof/dashboard',
      CLASSES: '/prof/classes',
      STUDENTS: '/prof/students',
    },

    // Routes ADMIN
    ADMIN: {
      DASHBOARD: '/admin',
    },
  } as const;