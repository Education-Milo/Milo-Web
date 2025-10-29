import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';

const RoleBasedRedirect: React.FC = () => {
  const user = useUserStore(state => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  console.log('🔄 Redirection basée sur le rôle de l\'utilisateur:', user.role);

  // Rediriger selon le rôle de l'utilisateur
  switch (user.role.toUpperCase()) {
    case 'PARENT':
      return <Navigate to="/dashboard" replace />;
    case 'Prof':
      return <Navigate to="/home" replace />;
    case 'ADMIN':
      return <Navigate to="/home" replace />;
    case 'User':
    default:
      return <Navigate to="/home" replace />;
  }
};

export default RoleBasedRedirect;

