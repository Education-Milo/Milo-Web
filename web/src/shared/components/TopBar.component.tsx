import React from "react";

interface TopBarProps {
	energyPoints?: number;
	streakDays?: number;
	onNotificationClick?: () => void;
	onSettingsClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
	energyPoints = 450,
	streakDays = 3,
	onNotificationClick,
	onSettingsClick,
}) => {
	return (
		<header className="top-bar">
			<div className="top-bar-spacer" />
			<div className="top-bar-actions">
				<div className="stats-badges">
					<div className="stat-badge yellow">
						<span>⚡</span>
						<span>{energyPoints}</span>
					</div>
					<div className="stat-badge orange">
						<span>🔥</span>
						<span>{streakDays}</span>
					</div>
				</div>

				<button className="action-button" onClick={onNotificationClick}>
					🔔
				</button>
				<button className="action-button" onClick={onSettingsClick}>
					⚙️
				</button>
			</div>
		</header>
	);
};

export default TopBar;
