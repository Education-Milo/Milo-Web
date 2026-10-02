import React from "react";
import { CheckCircle2 } from "lucide-react";

interface AuthSuccessMessageProps {
	message: string;
}

export const AuthSuccessMessage: React.FC<AuthSuccessMessageProps> = ({ message }) => {
	if (!message) return null;

	return (
		<div
			role="status"
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.6rem",
				padding: "0.75rem",
				backgroundColor: "var(--ok-bg)",
				border: "1px solid var(--ok-bg)",
				borderRadius: "0.5rem",
				marginBottom: "1rem",
				color: "var(--ok)",
			}}
		>
			<CheckCircle2 size={18} />
			<p style={{ fontSize: "0.875rem", margin: 0, fontWeight: 600 }}>{message}</p>
		</div>
	);
};
