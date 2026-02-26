import React from 'react';
import ScreenLayout from '@components/ui/common/ScreenLayout.component';
import ChapterAccordion from '@components/ChapterAccordion/ChapterAccordion';
import { useCourseDetailScreen } from '@hooks/useCourseDetailScreen';
import { ArrowLeft } from 'lucide-react';
import '@styles/CourseDetailScreen.css';
import miloFoxImage from '/miloBook.webp';

const CourseDetailScreen: React.FC = () => {
  const {
    courseData,
    isLoading,
    handleGoBack
  } = useCourseDetailScreen();

  if (isLoading || !courseData) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <ScreenLayout>
        <div className="course-detail-layout">
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
          <div className="course-main-column">
            <div className="course-program-header-card">
              <img src={miloFoxImage} alt="Milo le renard" className="milo-fox-mascot" />
              <h1 className="course-program-title">Programme de {courseData.title}</h1>
            </div>
            <div className="course-detail-content">
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
      </ScreenLayout>
    </>
  );
};

export default CourseDetailScreen;