// src/components/ProtectedRoute.component.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useUserStore } from "@shared/store/user/user.store";
import LoadingScreen from "./LoadingScreen.component";

type UserRole = "Enfant" | "Prof" | "Parent" | "Admin";

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: UserRole[];
	redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	allowedRoles,
	redirectTo = "/unauthorized",
}) => {
	const accessToken = useAuthStore((state) => state.accessToken);
	const user = useUserStore((state) => state.user);
	const loading = useUserStore((state) => state.loading);
	const location = useLocation();

	if (!accessToken) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (loading || (accessToken && !user)) {
		return <LoadingScreen />;
	}

	if (allowedRoles && allowedRoles.length > 0 && user) {
		if (!allowedRoles.includes(user.role as UserRole)) {
			return <Navigate to={redirectTo} replace />;
		}
	}

	return <>{children}</>;
};

export default ProtectedRoute;
