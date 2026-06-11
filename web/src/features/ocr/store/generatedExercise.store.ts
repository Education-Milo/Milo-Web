import { create } from "zustand";
import type { GeneratedExercise } from "../types/ocr.types";

interface GeneratedExerciseStore {
	generatedExercise: GeneratedExercise | null;
	setGeneratedExercise: (exercise: GeneratedExercise) => void;
	clearGeneratedExercise: () => void;
}

export const useGeneratedExerciseStore = create<GeneratedExerciseStore>((set) => ({
	generatedExercise: null,
	setGeneratedExercise: (exercise) => set({ generatedExercise: exercise }),
	clearGeneratedExercise: () => set({ generatedExercise: null }),
}));
