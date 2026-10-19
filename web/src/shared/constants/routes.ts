// src/constants/routes.ts

export const ROUTES = {
	LOGIN: "/login",
	REGISTER: "/register",
	FORGOT_PASSWORD: "/forgot-password",
	/** « Qui est-ce ? » juste après la connexion (jeton de compte) */
	PROFILE_SELECT: "/profiles",
	/** Gérer les profils (ajout, PIN, suppression) depuis un profil ouvert */
	PROFILE_MANAGE: "/profiles/manage",

	ROOT: "/",

	PROFILE: "/profile",
	UNAUTHORIZED: "/unauthorized",

	HOME: "/home",
	MILO: "/milo",
	QCM_GENERATED: "/qcm",
	GENERATED_EXERCISE: "/exercice-genere",
	COURSE_MILO: "/course-milo/:lessonId",
	COURSE_MILO_OPEN_QUESTION: "/course-milo/:lessonId/question-ouverte",
	QCM: "/qcm/:lessonId",
	EXERCISE_RESULT: "/exercise-result",
	COURSES: "/courses",
	COURSE_DETAIL: "/courses/:subjectId",
	MISSIONS: "/missions",
	STATS: "/stats",
	DUELS: "/duels",
	OCR: "/ocr",

	PARENT: {
		DASHBOARD: "/parent/dashboard",
		CHILDREN: "/parent/children",
		PROGRESS: "/parent/progress",
		CONTROLS: "/parent/controls",
	},

	PROF: {
		DASHBOARD: "/prof/dashboard",
		CLASSES: "/prof/classes",
		STUDENTS: "/prof/students",
	},

	ADMIN: {
		DASHBOARD: "/admin",
		SUPPORT: "/admin/support",
		AUDIT: "/admin/journal",
		COSMETICS: "/admin/cosmetiques",
		DEMO: "/admin/demo",
		MODERATION: "/admin/moderation",
		PROGRAMMES: "/admin/programmes",
	},
} as const;
