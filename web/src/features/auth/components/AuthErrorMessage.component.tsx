import React from "react";

interface AuthErrorMessageProps {
	message: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
	message,
}) => {
	if (!message) return null;

	return (
		<div
			style={{
				padding: "0.75rem",
				backgroundColor: "var(--ko-bg)",
				border: "1px solid var(--ko-bg)",
				borderRadius: "0.5rem",
				marginBottom: "1rem",
			}}
		>
			<p style={{ color: "var(--ko)", fontSize: "0.875rem", margin: 0 }}>
				{message}
			</p>
		</div>
	);
};
