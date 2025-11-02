// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import { useUserStore } from '@store/user/user.store';

type UserRole = 'Élève' | 'Prof' | 'Parent' | 'ADMIN';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/unauthorized'
}) => {
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useUserStore(state => state.user);
  const loading = useUserStore(state => state.loading);
  const location = useLocation();

  // Si pas connecté, rediriger vers login
  if (!accessToken) {
    console.log('❌ No token, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading || (accessToken && !user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 3️⃣ Si les rôles ne matchent pas une fois le user chargé
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role as UserRole)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;