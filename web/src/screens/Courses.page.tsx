import CourseCard from '@components/CourseCard/CourseCard';
import { useCoursesScreen } from '@hooks/useCoursesScreen';
import '@styles/CoursesScreen.css';
import ScreenLayout from '@components/ui/common/ScreenLayout.component';
import type { ClassType } from '@store/user/user.model';

const CoursesScreen: React.FC = () => {
  const {
    user,
    currentClass,
    setCurrentClass,
    subjects,
    loading,
    error,
    handleCourseClick,
  } = useCoursesScreen();

  return (
    <>
      <ScreenLayout>
        <div className="courses-content-area">

          <section className="courses-welcome-card">
            <div className="courses-welcome-milo-image-container">
              <img src="/buttonGo.webp" alt="Milo greetings" className="milo-greeting-image" />
            </div>
            <div className="courses-welcome-text">
              <h1 className="welcome-card-title">
                Bonjour {user?.first_name || ''} !
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
              onChange={(e) => setCurrentClass(e.target.value as ClassType)}
            >
              <option value="6eme">6ème</option>
              <option value="5eme">5ème</option>
              <option value="4eme">4ème</option>
              <option value="3eme">3ème</option>
            </select>
          </div>

          <div className="courses-grid">
            {loading && <p>Chargement...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && subjects.map((subject, index) => {
              return (
                <CourseCard
                  key={subject.id}
                  subjectId={subject.id}
                  onClick={handleCourseClick}
                  animationDelay={`${0.3 + index * 0.05}s`}
                />
              );
            })}
          </div>
        </div>
        </ScreenLayout>
      </>
  );
};

export default CoursesScreen;