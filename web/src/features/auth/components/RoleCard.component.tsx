import React from "react";
import { ArrowRight, Lock } from "lucide-react";
import type { RoleDefinition } from "@features/auth/constants/roles.constants";

interface RoleCardProps {
	role: RoleDefinition;
	onSelect: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onSelect }) => {
	const Icon = role.icon;

	return (
		<button
			type="button"
			className={`role-card ${!role.active ? "role-card-locked" : ""}`}
			onClick={role.active ? onSelect : undefined}
			disabled={!role.active}
		>
			<Icon className="role-card-icon" size={26} strokeWidth={2} />
			<h3 className="role-card-title">{role.title}</h3>
			<span className="role-card-tagline">
				{!role.active && <Lock size={11} />}
				{role.tagline}
			</span>
			<p className="role-card-description">{role.description}</p>
			{role.active && (
				<ArrowRight className="role-card-arrow" size={18} aria-hidden="true" />
			)}
		</button>
	);
};
