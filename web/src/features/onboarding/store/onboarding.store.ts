import { create } from "zustand";
import { TOUR_STEPS } from "@features/onboarding/data/onboarding.data";
import { useUserStore } from "@shared/store/user/user.store";

/**
 * Déroulé de l'onboarding :
 *  - « classroom » : l'élève est en classe (/bienvenue), Milo explique ;
 *  - « tour »      : visite guidée en 5 étapes dans le site ;
 *  - « finale »    : célébration de fin de visite.
 *
 * Un compte tout juste créé est marqué « à faire » (pending) : à sa première
 * arrivée sur l'accueil, il est envoyé en classe. Une fois terminé ou passé,
 * l'onboarding est noté comme vu pour ce profil, sur cet appareil.
 * Le panel admin le relance en mode test : rien n'est enregistré.
 */
export type OnboardingPhase = "off" | "classroom" | "tour" | "finale";

const PENDING_KEY = "milo_onboarding_pending";
const DONE_KEY = (userId: string) => `milo_onboarding_done:${userId}`;

const read = (key: string) => {
	try {
		return localStorage.getItem(key) === "1";
	} catch {
		return false;
	}
};

const write = (key: string, value: boolean) => {
	try {
		if (value) localStorage.setItem(key, "1");
		else localStorage.removeItem(key);
	} catch {
		/* stockage indisponible (navigation privée) : tant pis */
	}
};

interface OnboardingStore {
	phase: OnboardingPhase;
	/** Étape de la visite (index dans TOUR_STEPS) */
	step: number;
	/** Lancé depuis le panel admin : rien n'est enregistré à la fin */
	isTest: boolean;
	/** Profil concerné, pour noter l'onboarding comme vu */
	userId: string | null;

	/** Entre en classe pour l'introduction. */
	startClassroom: (opts?: { isTest?: boolean; userId?: string | null }) => void;
	/** Démarre la visite guidée (après la classe, ou seule depuis l'admin). */
	startTour: (opts?: { isTest?: boolean; step?: number; userId?: string | null }) => void;
	next: () => void;
	previous: () => void;
	goTo: (step: number) => void;
	/** Fin de la célébration. */
	finish: () => void;
	/** « Plus tard » / « Passer » : l'onboarding est considéré comme vu. */
	skip: () => void;

	/** Inscription : à jouer à la prochaine arrivée sur l'accueil. */
	markPending: () => void;
	isPending: () => boolean;
	isDone: (userId: string | null | undefined) => boolean;
	/** Admin : rejouer l'onboarding comme un nouveau compte. */
	resetFor: (userId: string | null | undefined) => void;
	markDoneFor: (userId: string | null | undefined) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => {
	/** Termine l'onboarding (fin ou abandon) et l'enregistre hors mode test. */
	const close = () => {
		const { isTest } = get();
		const userId = get().userId ?? useUserStore.getState().user?.id ?? null;
		if (!isTest) {
			write(PENDING_KEY, false);
			if (userId) write(DONE_KEY(userId), true);
		}
		set({ phase: "off", step: 0, isTest: false });
	};

	return {
		phase: "off",
		step: 0,
		isTest: false,
		userId: null,

		startClassroom: ({ isTest, userId } = {}) =>
			set((s) => ({
				phase: "classroom",
				step: 0,
				isTest: isTest ?? s.isTest,
				userId: userId !== undefined ? userId : s.userId,
			})),

		startTour: ({ isTest, step = 0, userId } = {}) =>
			set((s) => ({
				phase: "tour",
				step: Math.min(Math.max(step, 0), TOUR_STEPS.length - 1),
				isTest: isTest ?? s.isTest,
				userId: userId !== undefined ? userId : s.userId,
			})),

		next: () => {
			const { step } = get();
			if (step >= TOUR_STEPS.length - 1) set({ phase: "finale" });
			else set({ step: step + 1 });
		},

		previous: () => set((s) => ({ step: Math.max(0, s.step - 1) })),

		goTo: (step) => set({ step: Math.min(Math.max(step, 0), TOUR_STEPS.length - 1) }),

		finish: close,
		skip: close,

		markPending: () => write(PENDING_KEY, true),
		isPending: () => read(PENDING_KEY),
		isDone: (userId) => (userId ? read(DONE_KEY(userId)) : false),

		resetFor: (userId) => {
			if (userId) write(DONE_KEY(userId), false);
			write(PENDING_KEY, true);
		},

		markDoneFor: (userId) => {
			if (userId) write(DONE_KEY(userId), true);
			write(PENDING_KEY, false);
		},
	};
});
