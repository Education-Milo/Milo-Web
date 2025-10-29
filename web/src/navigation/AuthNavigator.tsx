import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeScreen from '@screens/HomePage';
import MiloScene from '@screens/MiloScene';
import ProfilePage from '@screens/ProfilePage';
import CoursesPage from '@screens/CoursesScreen';
import MissionsPage from '@screens/MissionsScreen';
import DuelsPage from '@screens/DuelsScreen';
import DashboardParent from '@screens/Parent/Dashboard';
import RoleBasedRedirect from '@components/RoleBasedRedirect';
import RoleProtectedRoute from '@components/RoleProtectedRoute';

const AuthNavigator: React.FC = () => {
  return (
    <Routes>
      {/* Route Dashboard - accessible uniquement aux parents */}
      <Route 
        path="/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={['Parent']}>
            <DashboardParent />
          </RoleProtectedRoute>
        } 
      />

      {/* Routes pour tous les utilisateurs authentifiés */}
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/milo" element={<MiloScene />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/missions" element={<MissionsPage />} />
      <Route path="/duels" element={<DuelsPage />} />

      {/* Redirection par défaut selon le rôle */}
      <Route path="/" element={<RoleBasedRedirect />} />
      
      {/* Redirection des routes publiques selon le rôle */}
      <Route path="/login" element={<RoleBasedRedirect />} />
      <Route path="/register" element={<RoleBasedRedirect />} />
      <Route path="/forgot-password" element={<RoleBasedRedirect />} />
      
      {/* Route catch-all */}
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  );
};

export default AuthNavigator;
