import React from "react";
import { Lock } from "lucide-react";
import type { MonthlyBadge } from "@shared/types/missions";
import "./BadgeItem.css";

interface BadgeItemProps {
	badge: MonthlyBadge;
	animationDelay: string;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, animationDelay }) => {
	return (
		<div className={`ms-badge-item ${badge.status}`} style={{ animationDelay }}>
			<div className="ms-badge-circle">
				{badge.status === "locked" ? (
					<Lock size={22} className="ms-badge-lock-icon" />
				) : (
					<img
						src={badge.imageUrl || "/badges/badge-default-missed.png"}
						alt={badge.month}
					/>
				)}
			</div>
			<span className="ms-badge-month-label">{badge.month}</span>
		</div>
	);
};

export default BadgeItem;
