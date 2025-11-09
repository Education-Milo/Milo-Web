import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';
import { useAuthStore } from '@store/auth/auth.store';
import courseChapterData from '@constants/chapterData';
import type { CourseDetails } from '@constants/chapterData';

export const useCourseDetailScreen = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>(); // Récupère 'francais' de l'URL

  // Logique pour Sidebar/TopBar (copiée de useCoursesScreen)
  const user = useUserStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Récupère les données du cours en fonction de l'ID de l'URL
  useEffect(() => {
    if (courseId && courseChapterData[courseId]) {
      setCourseData(courseChapterData[courseId]);
    } else {
      // Gérer le cas où l'ID n'existe pas (ex: rediriger)
      navigate('/courses'); 
    }
    setIsLoading(false);
  }, [courseId, navigate]);

  // Logique de navigation (Sidebar + bouton "retour")
  const handleNavigation = (page: string) => {
    switch (page) {
      case 'Accueil': navigate('/home'); break;
      case 'Cours': navigate('/courses'); break;
      case 'Missions': navigate('/missions'); break;
      case 'Duels': navigate('/duels'); break;
      default: navigate('/home'); break;
    }
  };

  const handleGoBack = () => {
    navigate('/courses'); // Retourne à la page de liste des cours
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login', { replace: true });
  };

  return {
    user,
    courseData,
    isLoading,
    handleNavigation,
    handleLogout,
    handleGoBack
  };
};