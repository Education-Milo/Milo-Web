import React from "react";
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
			<div className="mission-item-icon">{isCompleted ? "✓" : mission.icon}</div>
			<div className="mission-item-info">
				<h4>{mission.title}</h4>
				<div className="mission-progress-container">
					<div className="mission-progress-bar">
						<div
							className="mission-progress-fill"
							style={{ width: `${progressPercent}%` }}
						></div>
					</div>
					<span>
						{Math.min(mission.progressCurrent, mission.progressTotal)}/
						{mission.progressTotal}
					</span>
				</div>
			</div>
			<div className="mission-item-reward">
				<span>{isCompleted ? "Terminé" : `+${mission.rewardPoints} pts`}</span>
				{actionLabel && !isCompleted && (
					<span className="mission-item-action">{actionLabel}</span>
				)}
			</div>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className={`mission-item mission-item-button ${isCompleted ? "completed" : ""}`}
				style={{ animationDelay }}
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div
			className={`mission-item ${isCompleted ? "completed" : ""}`}
			style={{ animationDelay }}
		>
			{content}
		</div>
	);
};

export default MissionItem;
