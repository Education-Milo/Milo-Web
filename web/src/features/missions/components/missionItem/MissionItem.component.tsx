import React from "react";
import { Check } from "lucide-react";
import type { DailyMission } from "@shared/types/missions";
import "./MissionItem.css";

interface MissionItemProps {
	mission: DailyMission;
	animationDelay: string;
	onClick?: () => void;
	actionLabel?: string;
}

const MissionItem: React.FC<MissionItemProps> = ({
	mission,
	animationDelay,
	onClick,
	actionLabel,
}) => {
	const progressPercent = Math.min(
		(mission.progressCurrent / mission.progressTotal) * 100,
		100,
	);
	const isCompleted = mission.progressCurrent >= mission.progressTotal;
	const content = (
		<>
			<div className="ms-mission-icon">
				{isCompleted ? <Check size={22} strokeWidth={3} /> : mission.icon}
			</div>
			<div className="ms-mission-info">
				<h4>{mission.title}</h4>
				<div className="ms-progress-container">
					<div className="ms-progress-bar">
						<div
							className="ms-progress-fill"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
					<span>
						{Math.min(mission.progressCurrent, mission.progressTotal)}/
						{mission.progressTotal}
					</span>
				</div>
			</div>
			<div className="ms-mission-reward">
				<span>{isCompleted ? "Terminé" : `+${mission.rewardPoints} pts`}</span>
				{actionLabel && !isCompleted && (
					<span className="ms-mission-action">{actionLabel}</span>
				)}
			</div>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className={`ms-mission-item ms-mission-item-button ${isCompleted ? "completed" : ""}`}
				style={{ animationDelay }}
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div
			className={`ms-mission-item ${isCompleted ? "completed" : ""}`}
			style={{ animationDelay }}
		>
			{content}
		</div>
	);
};

export default MissionItem;
