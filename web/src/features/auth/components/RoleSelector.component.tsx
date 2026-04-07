import React from "react";
interface RoleSelectorProps {
	selectedRole: string;
	onRoleSelect: (role: string) => void;
	error?: string;
	disabled?: boolean;
}

const ROLES = [
	{ id: "Élève", label: "Élève", active: true },
	{ id: "Parent", label: "Parent", active: true },
	{ id: "Professeur", label: "Professeur", active: false },
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
	selectedRole,
	onRoleSelect,
	error,
	disabled,
}) => {
	return (
		<div style={{ marginTop: "1.5rem" }}>
			<h3
				style={{
					fontSize: "1rem",
					fontWeight: "600",
					color: "#1f2937",
					marginBottom: "1rem",
					textAlign: "center",
				}}
			>
				Sélectionnez votre rôle :
			</h3>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "0.75rem",
				}}
			>
				{ROLES.map((role) => {
					const isSelected = selectedRole === role.id;
					const isLocked = !role.active;
					return (
						<button
							key={role.id}
							type="button"
							onClick={() => !isLocked && onRoleSelect(role.id)}
							disabled={disabled || isLocked}
							style={{
								padding: "0.75rem",
								borderRadius: "0.75rem",
								border: `2px solid ${isSelected ? "#f97316" : "#e5e7eb"}`,
								backgroundColor: isSelected
									? "#fff7ed"
									: isLocked
										? "#f9fafb"
										: "white",
								color: isSelected
									? "#ea580c"
									: isLocked
										? "#9ca3af"
										: "#374151",
								fontSize: "0.875rem",
								fontWeight: "500",
								cursor: disabled || isLocked ? "not-allowed" : "pointer",
								transition: "all 0.2s ease-in-out",
								opacity: disabled ? 0.7 : 1,
								position: "relative",
							}}
							onMouseEnter={(e) => {
								if (!isSelected && !disabled && !isLocked) {
									(e.currentTarget as HTMLButtonElement).style.borderColor =
										"#d1d5db";
								}
							}}
							onMouseLeave={(e) => {
								if (!isSelected && !disabled && !isLocked) {
									(e.currentTarget as HTMLButtonElement).style.borderColor =
										"#e5e7eb";
								}
							}}
						>
							{role.label}
							{isLocked && (
								<span
									style={{
										display: "block",
										fontSize: "0.6rem",
										fontWeight: "400",
										color: "#9ca3af",
									}}
								>
									Bientôt
								</span>
							)}
						</button>
					);
				})}
			</div>
			{error && (
				<p
					className="error-message"
					style={{ marginTop: "0.5rem", textAlign: "center", color: "#ef4444" }}
				>
					{error}
				</p>
			)}
		</div>
	);
};
