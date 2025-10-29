import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const user = useUserStore(state => state.user);

  // Si pas d'utilisateur, rediriger vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si le rôle de l'utilisateur est autorisé
  const userRole = user.role.toUpperCase();
  const hasAccess = allowedRoles.some(role => 
    role.toUpperCase() === userRole
  );

  if (!hasAccess) {
    // Rediriger vers l'écran d'accueil approprié selon le rôle
    switch (userRole) {
      case 'Parent':
        return <Navigate to="/dashboard" replace />;
      case 'Prof':
      case 'ADMIN':
      default:
        return <Navigate to="/home" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;

