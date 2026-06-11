import { create } from "zustand";
import APIAxios, { APIRoutes } from "@api/axios.api";
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
			return questions;
		} catch (error) {
			set({ error: "Failed to fetch QCM", loading: false });
			throw error;
		}
	},

	set_qcm: (questions: QcmQuestion[]) => {
		set({
			questions: Array.isArray(questions) ? questions : [],
			loading: false,
			error: null,
		});
	},

	reset: () => {
		set({ questions: [], loading: false, error: null });
	},
}));
