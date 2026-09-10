import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import { useCourseStore } from "@features/courses/store/course.store";

export const useCourseDetailScreen = () => {
	const navigate = useNavigate();
	const { subjectId } = useParams<{ subjectId: string }>();
	const { subjects, coursesWithChapters, get_subject, load_course_detail, loading, error } =
		useCourseStore();
	const user = useUserStore((state) => state.user);

	useEffect(() => {
		if (!subjectId) {
			navigate(ROUTES.COURSES);
			return;
		}

		// Le mapping visuel (SUBJECTS_CONFIG) est indexé par nom de matière :
		// on a besoin de la liste des matières pour retrouver le nom
		// correspondant au subjectId de l'URL (ex: après un rechargement de page).
		if (subjects.length === 0) {
			get_subject();
		}

		load_course_detail(Number(subjectId));
	}, [subjectId, navigate]);

	const subject = subjects.find((s) => s.id === Number(subjectId));

	const handleGoBack = () => {
		navigate(ROUTES.COURSES);
	};

	return {
		user,
		subject,
		coursesWithChapters,
		loading,
		error,
		handleGoBack,
	};
};
