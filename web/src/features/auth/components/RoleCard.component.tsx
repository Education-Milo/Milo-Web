import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import type { RoleDefinition } from "@features/auth/constants/roles.constants";

interface RoleCardProps {
	role: RoleDefinition;
	onSelect: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, onSelect }) => {
	const Icon = role.icon;

	return (
		<motion.button
			type="button"
			className={`role-card ${!role.active ? "role-card-locked" : ""}`}
			onClick={role.active ? onSelect : undefined}
			disabled={!role.active}
			whileHover={role.active ? { scale: 1.05, y: -6 } : undefined}
			whileTap={role.active ? { scale: 0.98 } : undefined}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
		>
			<div className="role-card-icon">
				<Icon size={28} />
			</div>
			<h3 className="role-card-title">{role.title}</h3>
			<span className="role-card-tagline">
				{!role.active && <Lock size={12} />}
				{role.tagline}
			</span>
			<p className="role-card-description">{role.description}</p>
			{role.active && (
				<span className="role-card-cta">
					Choisir <ArrowRight size={16} />
				</span>
			)}
		</motion.button>
	);
};
