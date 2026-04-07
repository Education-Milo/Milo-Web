import React from "react";
import { SUBJECTS_CONFIG } from "@shared/constants/courses";
import "./CourseCard.css";

interface CourseCardProps {
	subjectId: number;
	onClick: (id: number) => void;
	animationDelay: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
	subjectId,
	onClick,
	animationDelay,
}) => {
	const config = SUBJECTS_CONFIG[subjectId];

	if (!config) return null;

	return (
		<div
			className={`course-card ${config.colorTheme}`}
			onClick={() => onClick(subjectId)}
			style={{ animationDelay }}
		>
			<div className="course-card-header">
				<span className="course-card-icon">{config.emoji}</span>
				<h3 className="course-card-title">{config.title}</h3>
			</div>
		</div>
	);
};

export default CourseCard;
