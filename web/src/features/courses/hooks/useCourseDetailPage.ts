import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import { useCourseStore } from "@features/courses/store/course.store";

export const useCourseDetailScreen = () => {
	const navigate = useNavigate();
	const { subjectId } = useParams<{ subjectId: string }>();
	const { coursesWithChapters, load_course_detail, loading, error } =
		useCourseStore();
	const user = useUserStore((state) => state.user);

	useEffect(() => {
		if (!subjectId) {
			navigate(ROUTES.COURSES);
			return;
		}

		load_course_detail(Number(subjectId));
	}, [subjectId, navigate]);

	const handleGoBack = () => {
		navigate(ROUTES.COURSES);
	};

	return {
		user,
		coursesWithChapters,
		loading,
		error,
		handleGoBack,
	};
};
