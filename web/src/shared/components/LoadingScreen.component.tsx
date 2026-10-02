import React from "react";

const LoadingScreen: React.FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh",
				flexDirection: "column",
				gap: "1rem",
				backgroundColor: "var(--bg-primary, #ffffff)",
			}}
		>
			<div
				style={{
					width: "40px",
					height: "40px",
					border: "4px solid var(--milo-creme)",
					borderTop: "4px solid var(--milo-orange)",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
				}}
			></div>
			<p
				style={{
					color: "var(--text-2)",
					fontSize: "0.875rem",
					margin: 0,
				}}
			>
				Vérification de l'authentification...
			</p>
			<style>{`\n        @keyframes spin {\n          0% { transform: rotate(0deg); }\n          100% { transform: rotate(360deg); }\n        }\n      `}</style>
		</div>
	);
};

export default LoadingScreen;
