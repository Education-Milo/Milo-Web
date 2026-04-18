import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";

const RedirectScreen: React.FC = () => {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (!user) navigate(ROUTES.LOGIN, { replace: true });
		}, 3000);
		if (user) {
			switch (user.role) {
				case "Enfant":
					navigate(ROUTES.HOME, { replace: true });
					break;
				case "Parent":
					navigate(ROUTES.PARENT.DASHBOARD, { replace: true });
					break;
				case "Prof":
					navigate(ROUTES.PROF.DASHBOARD, { replace: true });
					break;
				case "Admin":
					navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
					break;
				default:
					navigate(ROUTES.UNAUTHORIZED, { replace: true });
					break;
			}
		}
		return () => clearTimeout(timeout);
	}, [user, navigate]);

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
					border: "4px solid #f3f4f6",
					borderTop: "4px solid #f97316",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
				}}
			></div>
			<p
				style={{
					color: "#6b7280",
					fontSize: "0.875rem",
					margin: 0,
				}}
			>
				Redirection en cours...
			</p>
			<style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	);
};

export default RedirectScreen;
