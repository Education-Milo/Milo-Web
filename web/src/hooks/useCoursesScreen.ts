import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';
import { useAuthStore } from '@store/auth/auth.store';
import { coursesData } from '@constants/courses';

export const useCoursesScreen = () => {
  const navigate = useNavigate();
  
  // On va chercher les données et fonctions directement dans les stores
  const user = useUserStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  // Logique d'état du composant
  const [currentClass, setCurrentClass] = useState('5eme');

  // Données
  const courses = coursesData;

  // Gestionnaires d'événements
  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  // Logique de navigation de la Sidebar
  const handleNavigation = (page: string) => {
    switch (page) {
      case 'Accueil':
        navigate('/home');
        break;
      case 'Cours':
        navigate('/courses');
        break;
      case 'Missions':
        navigate('/missions');
        break;
      case 'Duels':
        navigate('/duels');
        break;
      default:
        navigate('/home');
        break;
    }
  };

  // Logique de déconnexion
  const handleLogout = () => {
    if (logout) {
      logout();
    }
    navigate('/login', { replace: true });
  };

  // Expose tout ce dont le composant d'affichage a besoin
  return {
    user,
    currentClass,
    setCurrentClass,
    courses,
    handleCourseClick,
    handleNavigation,
    handleLogout
  };
};