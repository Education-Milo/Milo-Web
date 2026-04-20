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
    COURSE_MILO: '/course-milo/:lessonId',
    QCM: '/qcm/:lessonId',
    EXERCISE_RESULT: '/exercise-result',
    COURSES: '/courses',
    COURSE_DETAIL: '/courses/:subjectId',
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