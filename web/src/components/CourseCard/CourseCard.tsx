import React from 'react';
import type { Course } from '@constants/courses';
import './CourseCard.css';

interface CourseCardProps {
  course: Course;
  onClick: (id: string) => void;
  // Ajoute un délai d'animation pour l'effet de cascade
  animationDelay: string; 
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, animationDelay }) => {
  return (
    <div 
      className={`course-card ${course.colorTheme}`} 
      onClick={() => onClick(course.id)}
      style={{ animationDelay }} // Applique le délai
    >
      <div className="course-card-header">
        <span className="course-card-icon">{course.emoji}</span>
        <h3 className="course-card-title">{course.title}</h3>
      </div>
      <p className="course-card-description">{course.description}</p>
      
      {/* Ce conteneur est caché par CSS, mais on le garde pour la sémantique */}
      <div className="course-progress-container">
        <div className="course-progress-bar">
          <div 
            className="course-progress-fill" 
            style={{ width: `${course.progress}%` }}
          ></div>
        </div>
        <span className="course-progress-label">{course.progress}% complété</span>
      </div>
    </div>
  );
};

export default CourseCard;