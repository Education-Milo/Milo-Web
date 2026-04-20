import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, HelpCircle } from 'lucide-react';
import { ROUTES } from '@constants/routes';
import type { LessonWithStatus } from '@store/course/course.model';
import './LessonModal.component.css';

interface LessonModalProps {
  lesson: LessonWithStatus | null;
  onClose: () => void;
}

const LessonModal: React.FC<LessonModalProps> = ({ lesson, onClose }) => {
  const navigate = useNavigate();

  if (!lesson) return null;

  const handleQCM = () => {
    onClose();
    navigate(ROUTES.QCM.replace(':lessonId', String(lesson.id)));
  };

  const handleCoursMilo = () => {
    onClose();
    navigate(ROUTES.COURSE_MILO.replace(':lessonId', String(lesson.id)));
  };

  return (
    <div className="lesson-modal-overlay" onClick={onClose}>
      <div className="lesson-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lesson-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="lesson-modal-header">
          <p className="lesson-modal-label">Leçon</p>
          <h2 className="lesson-modal-title">{lesson.title}</h2>
        </div>

        <p className="lesson-modal-subtitle">Comment veux-tu travailler cette leçon ?</p>

        <div className="lesson-modal-choices">
          <button className="lesson-modal-card qcm" onClick={handleQCM}>
            <div className="lesson-modal-card-icon">
              <HelpCircle size={28} />
            </div>
            <div className="lesson-modal-card-text">
              <span className="lesson-modal-card-title">QCM</span>
              <span className="lesson-modal-card-desc">Teste tes connaissances</span>
            </div>
            <div className="lesson-modal-card-arrow">→</div>
          </button>

          <button className="lesson-modal-card milo" onClick={handleCoursMilo}>
            <div className="lesson-modal-card-icon">
              <BookOpen size={28} />
            </div>
            <div className="lesson-modal-card-text">
              <span className="lesson-modal-card-title">Cours avec Milo</span>
              <span className="lesson-modal-card-desc">Apprends avec ton guide</span>
            </div>
            <div className="lesson-modal-card-arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonModal;