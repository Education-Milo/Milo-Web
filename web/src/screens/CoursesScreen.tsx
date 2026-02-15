import React from 'react';
import Sidebar from '@components/Sidebar';
import TopBar from '@components/TopBar';
import CourseCard from '@components/CourseCard/CourseCard';
import { useCoursesScreen } from '@hooks/useCoursesScreen';
import '@styles/CoursesScreen.css';

const CoursesScreen: React.FC = () => {
  // Appelle le hook pour obtenir toute la logique et les données
  const {
    user,
    currentClass,
    setCurrentClass,
    courses,
    handleCourseClick,
    handleNavigation,
    handleLogout
  } = useCoursesScreen();

  return (
    <>
      <Sidebar 
        activeNav="Cours"
        onNavigation={handleNavigation}
        onLogout={handleLogout}
        userProfile={{
          firstName: user?.prenom || '', // Utilise l'utilisateur du hook
          lastName: user?.nom || '',
          level: user?.level?.toString() || '1',
          profilePicture: null
        }}
      />

      <main className="main-container">
        <TopBar
          energyPoints={user?.points || 0} // Utilise l'utilisateur du hook
          streakDays={user?.streak || 0}
        />

        <div className="courses-content-area">

          <section className="courses-welcome-card">
            <div className="courses-welcome-milo-image-container">
              <img src="/buttonGo.webp" alt="Milo greetings" className="milo-greeting-image" />
            </div>
            <div className="courses-welcome-text">
              <h1 className="welcome-card-title">
                Bonjour {user?.prenom || 'Test'} !
              </h1>
              <p className="welcome-card-subtitle">
                Prêt à explorer de nouvelles matières ? Choisis un cours pour commencer.
              </p>
            </div>
          </section>

          <div className="courses-title-container">
            <h2 className="courses-grid-title">Matières générales</h2>
            
            <select 
              className="class-level-dropdown"
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
            >
              <option value="6eme">6ème</option>
              <option value="5eme">5ème</option>
              <option value="4eme">4ème</option>
              <option value="3eme">3ème</option>
            </select>
          </div>

          <div className="courses-grid">
            {courses.map((course, index) => (
              <CourseCard 
                key={course.id} 
                course={course}
                onClick={handleCourseClick}
                // Calcule le délai pour l'animation en cascade
                animationDelay={`${0.3 + index * 0.05}s`}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default CoursesScreen;