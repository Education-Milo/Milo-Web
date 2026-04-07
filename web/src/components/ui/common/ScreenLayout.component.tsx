import React from "react";
import Sidebar from "@components/Sidebar.component";
import TopBar from "@components/TopBar.component";
import { useUserStore } from "@shared/store/user/user.store";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@shared/constants/routes";

interface PageLayoutProps {
	children: React.ReactNode;
	energyPoints?: number;
	streakDays?: number;
}

const PageLayout: React.FC<PageLayoutProps> = ({
	children,
	energyPoints = 0,
	streakDays = 0,
}) => {
	const { user } = useUserStore();
	const logout = useAuthStore((state) => state.logout);
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate(ROUTES.LOGIN, { replace: true });
	};

	return (
		<>
			<Sidebar
				onLogout={handleLogout}
				userProfile={{
					email: user?.email || "",
					first_name: user?.first_name || "",
					last_name: user?.last_name || "",
					classe: user?.classe,
					role: user?.role,
				}}
			/>
			<main className="main-container">
				<TopBar energyPoints={energyPoints} streakDays={streakDays} />
				{children}
			</main>
		</>
	);
};

export default PageLayout;
