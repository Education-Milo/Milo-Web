import React from 'react';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import ChapterAccordion from '@components/ChapterAccordion/ChapterAccordion';
import { useCourseDetailScreen } from '@hooks/useCourseDetailScreen';
import { ArrowLeft } from 'lucide-react';
import '@styles/CourseDetailScreen.css'; // Nouveau CSS

const CourseDetailScreen: React.FC = () => {
  const {
    user,
    courseData,
    isLoading,
    handleNavigation,
    handleLogout,
    handleGoBack
  } = useCourseDetailScreen();

  if (isLoading || !courseData) {
    // Vous pouvez remplacer ceci par votre composant LoadingScreen
    return <div>Chargement...</div>;
  }

  // Trouve le chapitre "en cours" pour l'ouvrir par défaut
  const currentChapter = courseData.chapters.find(c => 
    c.lessons.some(l => l.status === 'in-progress')
  );

  return (
    <>
      <Sidebar 
        activeNav="Cours"
        onNavigation={handleNavigation}
        onLogout={handleLogout}
        userProfile={{
          firstName: user?.prenom || '',
          lastName: user?.nom || '',
          level: user?.level?.toString() || '1',
          profilePicture: null
        }}
      />

      <main className="main-container">
        <TopBar
          energyPoints={user?.points || 0}
          streakDays={user?.streak || 0}
        />

        {/* Layout inspiré de SchoolMouv (00:02) */}
        <div className="course-detail-layout">
          
          {/* 1. Sidebar de navigation du cours (à gauche) */}
          <nav className="course-detail-sidebar">
            <button className="back-button" onClick={handleGoBack}>
              <ArrowLeft size={18} />
              <span>Tous les cours</span>
            </button>
            <div className="course-detail-sidebar-title">
              <span className="course-emoji">{courseData.emoji}</span>
              <h3>{courseData.title}</h3>
            </div>
            <ul className="course-nav-list">
              <li className="course-nav-item active">Programme</li>
              <li className="course-nav-item">Encyclopédie</li>
              <li className="course-nav-item">Kit Brevet</li>
            </ul>
          </nav>

          {/* 2. Contenu principal (Chapitres à droite) */}
          <div className="course-detail-content">
            <h1 className="course-content-title">Programme de {courseData.title}</h1>
            <div className="chapter-list">
              {courseData.chapters.map((chapter) => (
                <ChapterAccordion 
                  key={chapter.id} 
                  chapter={chapter}
                  defaultOpen={chapter.id === currentChapter?.id}
                />
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default CourseDetailScreen;