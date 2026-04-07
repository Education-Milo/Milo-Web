import React, { useState } from "react";
import type {
	ChapterWithLessons,
	LessonWithStatus,
} from "@store/course/course.model";
import { ChevronDown, CheckCircle, Lock, PlayCircle } from "lucide-react";
import LessonModal from "@components/LessonModal/LessonModal.component";
import "./ChapterAccordion.css";

interface ChapterAccordionProps {
	chapter: ChapterWithLessons;
	emoji: string;
	defaultOpen?: boolean;
}

const ChapterAccordion: React.FC<ChapterAccordionProps> = ({
	chapter,
	emoji,
	defaultOpen = false,
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [selectedLesson, setSelectedLesson] = useState<LessonWithStatus | null>(
		null,
	);

	const getLessonIcon = (status: "completed" | "in-progress" | "locked") => {
		switch (status) {
			case "completed":
				return <CheckCircle size={18} className="icon-completed" />;
			case "in-progress":
				return <PlayCircle size={18} className="icon-in-progress" />;
			case "locked":
			default:
				return <Lock size={18} className="icon-locked" />;
		}
	};

	const handleLessonClick = (lesson: LessonWithStatus) => {
		if (lesson.status === "locked") return;
		setSelectedLesson(lesson);
	};

	return (
		<>
			<div className={`chapter-accordion ${isOpen ? "open" : ""}`}>
				<button className="chapter-header" onClick={() => setIsOpen(!isOpen)}>
					<div className="chapter-header-left">
						<span className="chapter-emoji">{emoji}</span>
						<div className="chapter-header-title">
							<h3 className="chapter-title">{chapter.title}</h3>
							<span className="chapter-lesson-count">
								{chapter.lessons.length} leçon
								{chapter.lessons.length > 1 ? "s" : ""}
							</span>
						</div>
					</div>
					<ChevronDown size={24} className="chapter-chevron" />
				</button>

				<div className="chapter-content">
					<ul className="lessons-list">
						{chapter.lessons.map((lesson) => (
							<li
								key={lesson.id}
								className={`lesson-item ${lesson.status} ${lesson.status !== "locked" ? "clickable" : ""}`}
								onClick={() => handleLessonClick(lesson)}
							>
								<div className="lesson-icon">
									{getLessonIcon(lesson.status)}
								</div>
								<span className="lesson-title">{lesson.title}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			<LessonModal
				lesson={selectedLesson}
				onClose={() => setSelectedLesson(null)}
			/>
		</>
	);
};

export default ChapterAccordion;
