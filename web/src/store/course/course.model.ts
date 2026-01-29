export interface Subject {
    id: string;
    name: string;
    icon: string;
    borderColor: string;
    iconBackground: string;
  }

export interface Chapter {
    id: string;
    title: string;
    lessons: any[];
  }

export interface CourseState {
    subjects: Subject[];
    currentProgram: { courseTitle: string; chapters: Chapter[] } | null;
    loading: boolean;
    error: string | null;
}

export interface CourseActions {
    fetchSubjects: (level: string) => Promise<void>;
    fetchProgram: (subjectId: string) => Promise<void>;
    generateExercise: (lessonId: string, difficulty: string) => Promise<any>;
}

export type CourseStore = CourseState & CourseActions;