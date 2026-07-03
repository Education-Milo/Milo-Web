import { create } from "zustand";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type {
	Chapter,
	ChapterWithLessons,
	Courses,
	CourseStore,
	CourseWithChapters,
	Lesson,
	LessonWithStatus,
} from "@/features/courses/store/course.model";

export const useCourseStore = create<CourseStore>((set) => ({
	subjects: [],
	coursesWithChapters: [],
	loading: false,
	error: null,

	get_subject: async () => {
		try {
			set({ loading: true, error: null });
			const response = await APIAxios.get(APIRoutes.GET_Subjects);
			set({ subjects: response.data, loading: false });
			return response.data;
		} catch (error) {
			set({ error: "Failed to fetch subjects", loading: false });
			throw error;
		}
	},

	get_courses: async (subjectId: number) => {
		try {
			set({ loading: true, error: null });
			const response = await APIAxios.get(APIRoutes.GET_Courses, {
				params: { subject_id: subjectId },
			});
			set({ loading: false });
			return response.data;
		} catch (error) {
			set({ error: "Failed to fetch courses", loading: false });
			throw error;
		}
	},

	get_chapters: async (courseId: number) => {
		try {
			set({ loading: true, error: null });
			const response = await APIAxios.get(APIRoutes.GET_Chapters, {
				params: { course_id: courseId },
			});
			set({ loading: false });
			return response.data;
		} catch (error) {
			set({ error: "Failed to fetch chapters", loading: false });
			throw error;
		}
	},

	get_lessons: async (chapterId: number) => {
		try {
			set({ loading: true, error: null });
			const response = await APIAxios.get(APIRoutes.GET_Lessons, {
				params: { chapter_id: chapterId },
			});
			set({ loading: false });
			return response.data;
		} catch (error) {
			set({ error: "Failed to fetch lessons", loading: false });
			throw error;
		}
	},

	load_course_detail: async (subjectId: number) => {
		try {
			set({ loading: true, error: null, coursesWithChapters: [] });
			const coursesRes = await APIAxios.get(APIRoutes.GET_Courses, {
				params: { subject_id: subjectId },
			});
			const courses: Courses[] = coursesRes.data;
			const isMathSubject = subjectId === 1;
			const coursesWithChapters: CourseWithChapters[] = await Promise.all(
				courses.map(async (course) => {
					const chaptersRes = await APIAxios.get(APIRoutes.GET_Chapters, {
						params: { course_id: course.id },
					});
					const chapters: Chapter[] = chaptersRes.data;

					const chaptersWithLessons: ChapterWithLessons[] = await Promise.all(
						chapters.map(async (chapter) => {
							const lessonsRes = await APIAxios.get(APIRoutes.GET_Lessons, {
								params: { chapter_id: chapter.id },
							});
							const lessons: Lesson[] = lessonsRes.data;
							const lessonsWithStatus: LessonWithStatus[] = lessons.map(
								(lesson, index) => ({
									...lesson,
									status: isMathSubject
										? "in-progress"
										: index === 0
											? "in-progress"
											: "locked",
								}),
							);

							return { ...chapter, lessons: lessonsWithStatus };
						}),
					);

					return { ...course, chapters: chaptersWithLessons };
				}),
			);

			set({ coursesWithChapters, loading: false });
		} catch (error) {
			set({ error: "Failed to load course detail", loading: false });
			throw error;
		}
	},
}));
