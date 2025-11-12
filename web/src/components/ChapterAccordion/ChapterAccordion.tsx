import React, { useState } from 'react';
import type { Chapter } from '@constants/chapterData';
import { ChevronDown, CheckCircle, Lock, PlayCircle } from 'lucide-react';
import './ChapterAccordion.css';

interface ChapterAccordionProps {
  chapter: Chapter;
  emoji: string;
  defaultOpen?: boolean; // Pour ouvrir le chapitre en cours par défaut
}

const ChapterAccordion: React.FC<ChapterAccordionProps> = ({ chapter, emoji, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getLessonIcon = (status: 'completed' | 'in-progress' | 'locked') => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="icon-completed" />;
      case 'in-progress':
        return <PlayCircle size={18} className="icon-in-progress" />;
      case 'locked':
      default:
        return <Lock size={18} className="icon-locked" />;
    }
  };

  return (
    <div className={`chapter-accordion ${isOpen ? 'open' : ''}`}>
      <button className="chapter-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="chapter-header-left">
          <span className="chapter-emoji">{emoji}</span>
          <div className="chapter-header-title">
            <span className="chapter-number">Chapitre {chapter.chapterNumber}</span>
            <h3 className="chapter-title">{chapter.title}</h3>
          </div>
        </div>
        <ChevronDown size={24} className="chapter-chevron" />
      </button>

      <div className="chapter-content">
        <ul className="lessons-list">
          {chapter.lessons.map((lesson) => (
            <li key={lesson.id} className={`lesson-item ${lesson.status}`}>
              <div className="lesson-icon">
                {getLessonIcon(lesson.status)}
              </div>
              <span className="lesson-title">{lesson.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChapterAccordion;