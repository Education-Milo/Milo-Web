import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';
import { coursesData } from '@constants/courses';

export const useCoursesScreen = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const [currentClass, setCurrentClass] = useState('5eme');
  const courses = coursesData;
  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  return {
    user,
    currentClass,
    setCurrentClass,
    courses,
    handleCourseClick,
  };
};