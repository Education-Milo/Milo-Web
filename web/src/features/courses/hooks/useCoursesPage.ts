import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { useCourseStore } from "@features/courses/store/course.store";
import { ROUTES } from "@shared/constants/routes";

export const useCoursesScreen = () => {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const { subjects, get_subject, loading, error } = useCourseStore();
	const [currentClass, setCurrentClass] = useState(user?.classe);

	useEffect(() => {
		get_subject();
	}, []);

	const filteredSubjects = subjects.filter((s) => s.level === currentClass);

	const handleCourseClick = (subjectId: number) => {
		navigate(ROUTES.COURSE_DETAIL.replace(":subjectId", String(subjectId)));
	};

	return {
		user,
		currentClass,
		setCurrentClass,
		subjects: filteredSubjects,
		error,
		loading,
		handleCourseClick,
	};
};
