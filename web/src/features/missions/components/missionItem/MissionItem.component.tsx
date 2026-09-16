import React from "react";
import { Check, RefreshCcw } from "lucide-react";
import type { DailyMission } from "@shared/types/missions";
import {
	formatMissionReward,
	getMissionIcon,
} from "@features/missions/utils/missionIcons";
import "./MissionItem.css";

interface MissionItemProps {
	mission: DailyMission;
	animationDelay: string;
	onClick?: () => void;
	actionLabel?: string;
	/** Affiche le bouton "Changer" (reroll) tant que la mission n'est pas terminée. */
	onReroll?: () => void;
	isRerolling?: boolean;
}

const MissionItem: React.FC<MissionItemProps> = ({
	mission,
	animationDelay,
	onClick,
	actionLabel,
	onReroll,
	isRerolling = false,
}) => {
	const progressPercent =
		mission.target > 0
			? Math.min((mission.progress / mission.target) * 100, 100)
			: 0;
	const isCompleted = mission.is_completed;
	const isClickable = Boolean(onClick) && !isCompleted;

	return (
		<div
			className={`ms-mission-item ${isCompleted ? "completed" : ""} ${mission.is_bonus ? "bonus" : ""} ${isClickable ? "ms-mission-item-button" : ""}`}
			style={{ animationDelay }}
			role={isClickable ? "button" : undefined}
			tabIndex={isClickable ? 0 : undefined}
			onClick={isClickable ? onClick : undefined}
			onKeyDown={
				isClickable
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onClick?.();
							}
						}
					: undefined
			}
		>
			<div className="ms-mission-icon">
				{isCompleted ? <Check size={22} strokeWidth={3} /> : getMissionIcon(mission)}
			</div>
			<div className="ms-mission-info">
				<h4>{mission.title}</h4>
				{mission.description && (
					<p className="ms-mission-desc">{mission.description}</p>
				)}
				<div className="ms-progress-container">
					<div className="ms-progress-bar">
						<div
							className="ms-progress-fill"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
					<span>
						{Math.min(mission.progress, mission.target)}/{mission.target}
					</span>
				</div>
			</div>
			<div className="ms-mission-side">
				<div className="ms-mission-reward">
					<span>{isCompleted ? "Terminé" : formatMissionReward(mission)}</span>
					{actionLabel && !isCompleted && (
						<span className="ms-mission-action">{actionLabel}</span>
					)}
				</div>
				{onReroll && !isCompleted && (
					<button
						type="button"
						className="ms-mission-reroll"
						onClick={(e) => {
							e.stopPropagation();
							onReroll();
						}}
						disabled={isRerolling}
						title="Changer cette mission"
					>
						<RefreshCcw size={14} className={isRerolling ? "spinning" : ""} />
						<span>Changer</span>
					</button>
				)}
			</div>
		</div>
	);
};

export default MissionItem;
