// components/PublicRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../store/authService';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/home' 
}) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    // Si l'utilisateur est connecté, le rediriger vers la page d'accueil
    // ou vers la page d'où il venait s'il y en a une
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;