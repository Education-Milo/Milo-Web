import { create } from "zustand";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useUserStore } from "@shared/store/user/user.store";
import type {
	ExerciseStore,
	QcmQuestion,
} from "@features/exercices/store/exercise.model";

export const useExerciseStore = create<ExerciseStore>((set) => ({
	questions: [],
	loading: false,
	error: null,

	post_qcm: async (lessonId: number): Promise<QcmQuestion[]> => {
		try {
			set({ loading: true, error: null, questions: [] });
			const response = await APIAxios.post(APIRoutes.POST_QCM_Lesson, null, {
				params: { lesson_id: lessonId },
			});
			console.log("QCM Response:", response.data);
			const questions: QcmQuestion[] = response.data.qcm;
			set({ questions, loading: false });
			// Rafraîchit /users/me pour mettre à jour la streak sans rechargement
			useUserStore.getState().getMe(true).catch(() => {});
			return questions;
		} catch (error) {
			set({ error: "Failed to fetch QCM", loading: false });
			throw error;
		}
	},

	reset: () => {
		set({ questions: [], loading: false, error: null });
	},
}));
