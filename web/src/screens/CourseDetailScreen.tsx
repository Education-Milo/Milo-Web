import React from 'react';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import ChapterAccordion from '@components/ChapterAccordion/ChapterAccordion';
import { useCourseDetailScreen } from '@hooks/useCourseDetailScreen';
import { ArrowLeft } from 'lucide-react';
import '@styles/CourseDetailScreen.css';
import miloFoxImage from '/miloBook.webp';

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
//   const currentChapter = courseData.chapters.find(c => 
//     c.lessons.some(l => l.status === 'in-progress')
//   );

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

            <button className="course-sidebar-back-button" onClick={handleGoBack}>
              <ArrowLeft size={24} className="course-title-icon" />
              <h3>Mes matières</h3>
            </button>

            <ul className="course-nav-list">
              <li className="course-nav-item active">Programme</li>
              <li className="course-nav-item">QCM</li>
              <li className="course-nav-item">Quizz</li>
            </ul>
          </nav>
        
        {/* --- Encart orange pour le titre du programme --- */}
          <div className="course-main-column">

            {/* Encart orange */}
            <div className="course-program-header-card">
              <img src={miloFoxImage} alt="Milo le renard" className="milo-fox-mascot" />
              <h1 className="course-program-title">Programme de {courseData.title}</h1>
            </div>

          {/* 2. Contenu principal (Chapitres à droite) */}
          <div className="course-detail-content">
            {/* <div className="course-content-header">
              <span className="course-content-emoji">{courseData.emoji}</span>
              <h1 className="course-content-title">Programme de {courseData.title}</h1>
            </div> */}

            <div className="chapter-list">
              {courseData.chapters.map((chapter) => (
                <ChapterAccordion 
                  key={chapter.id} 
                  chapter={chapter}
                  emoji={chapter.emoji}
                  defaultOpen={true}
                />
              ))}
            </div>
          </div>

        </div>
        </div>
      </main>
    </>
  );
};

export default CourseDetailScreen;