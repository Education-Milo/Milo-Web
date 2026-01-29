import { create } from 'zustand';
import APIAxios, { APIRoutes } from '@api/axios.api';
import type { CourseStore } from './course.model';

export const useCourseStore = create<CourseStore>((set) => ({
    subjects: [],
    currentProgram: null,
    loading: false,
    error: null,

    fetchSubjects: async () => {
      set({ loading: true, error: null });
      try {
        const response = await APIAxios.get(APIRoutes.GET_Subjects);
        set({ subjects: response.data, loading: false });
      } catch (error) {
        console.error('Erreur chargement matières:', error);
        set({ loading: false, error: "Impossible de charger les matières" });
      }
    },

    fetchProgram: async (subjectId: string) => {
      set({ loading: true, error: null, currentProgram: null });
      try {
        const response = await APIAxios.get(APIRoutes.GET_Program, {
          params: { subjectId }
        });
        set({ currentProgram: response.data, loading: false });
      } catch (error) {
        console.error('Erreur chargement programme:', error);
        set({ loading: false, error: "Impossible de charger le programme" });
      }
    },

    generateExercise: async (userId: string, lessonId: string) => {
      try {
        const response = await APIAxios.post(APIRoutes.POST_GenerateExercise, {
          userId,
          lessonId
        });
        return response.data; // Données de l'exercice généré
      } catch (error) {
        console.error('Erreur génération exercice IA:', error);
        throw error;
      }
    }

  }));