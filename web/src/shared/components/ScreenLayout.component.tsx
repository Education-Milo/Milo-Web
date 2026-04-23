import React from "react";
import Sidebar from "@shared/components/Sidebar.component";
import { useUserStore } from "@shared/store/user/user.store";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@shared/constants/routes";

interface PageLayoutProps {
	children: React.ReactNode;
	streakDays?: number;
	notificationCount?: number;
}

const PageLayout: React.FC<PageLayoutProps> = ({
	children,
	streakDays = 0,
	notificationCount = 0,
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
				streakDays={streakDays}
				notificationCount={notificationCount}
			/>
			<main className="main-container">{children}</main>
		</>
	);
};

export default PageLayout;