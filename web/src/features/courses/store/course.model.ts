import type { ClassType } from "@shared/store/user/user.model";

export interface Subject {
    id: number;
    title: string;
    level: ClassType;
    cycle: string;
  }

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  context_info: string;
}

export interface Lesson {
  id: number;
  chapter_id: number;
  title: string;
  learning_objectives: string;
  boundaries: string;
  success_criteria: string;
}

export interface Courses {
  id: number;
  title: string;
  description: string;
  subject_id: number;
}
export interface LessonWithStatus extends Lesson {
  status: 'completed' | 'in-progress' | 'locked';
}

export interface ChapterWithLessons extends Chapter {
  lessons: LessonWithStatus[];
}

export interface CourseWithChapters extends Courses {
  chapters: ChapterWithLessons[];
}

export interface CourseState {
    subjects: Subject[];
    coursesWithChapters: CourseWithChapters[];
    loading: boolean;
    error: string | null;
}

export interface CourseActions {
    get_subject: () => Promise<Subject[]>;
    get_courses: (subjectId: number) => Promise<Courses[]>;
    get_chapters: (courseId: number) => Promise<Chapter[]>;
    get_lessons: (chapterId: number) => Promise<Lesson[]>;
    load_course_detail: (subjectId: number) => Promise<void>;
}

export type CourseStore = CourseState & CourseActions;