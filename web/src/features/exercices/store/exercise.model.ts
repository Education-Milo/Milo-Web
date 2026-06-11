export interface QcmQuestion {
    question: string;
    options: string[];
    correct_answer: string;
}

export interface QcmApiResponse {
    qcm: QcmQuestion[];
}

export interface ExerciseState {
    questions: QcmQuestion[];
    loading: boolean;
    error: string | null;
}

export interface ExerciseActions {
    post_qcm: (lessonId: number) => Promise<QcmQuestion[]>;
    set_qcm: (questions: QcmQuestion[]) => void;
    reset: () => void;
}

export type ExerciseStore = ExerciseState & ExerciseActions;
