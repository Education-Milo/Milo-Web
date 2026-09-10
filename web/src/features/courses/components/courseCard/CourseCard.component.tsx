import React from "react";
import { getSubjectVisuals } from "@shared/constants/courses";
import "./CourseCard.css";

interface CourseCardProps {
	subjectId: number;
	/** Nom réel du cours / de la matière, tel que renvoyé par l'API. */
	title: string;
	onClick: (id: number) => void;
	animationDelay: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
	subjectId,
	title,
	onClick,
	animationDelay,
}) => {
	const config = getSubjectVisuals(title);
	const isLocked = config.locked === true;

	return (
		<div
			className={`course-card ${config.colorTheme} ${isLocked ? "is-locked" : ""}`}
			onClick={() => {
				if (isLocked) return;
				onClick(subjectId);
			}}
			style={{ animationDelay }}
			aria-disabled={isLocked}
		>
			<div className="course-card-header">
				<span className="course-card-icon">{config.emoji}</span>
				<h3 className="course-card-title">{title}</h3>
			</div>
		</div>
	);
};

export default CourseCard;
