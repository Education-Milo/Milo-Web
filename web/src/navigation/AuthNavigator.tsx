import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from '@screens/HomePage';
import MiloScene from '@screens/MiloScene';
import ProfilePage from '@screens/ProfilePage';
import CoursesPage from '@screens/CoursesScreen';
import MissionsPage from '@screens/MissionsScreen';
import DuelsPage from '@screens/DuelsScreen';

const AuthNavigator: React.FC = () => {
  return (
    <Routes>
      {/* Routes authentifiées */}
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/milo" element={<MiloScene />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/missions" element={<MissionsPage />} />
      <Route path="/duels" element={<DuelsPage />} />
      {/* Redirection par défaut pour les utilisateurs authentifiés */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      {/* Redirection des routes publiques vers home si déjà connecté */}
      <Route path="/login" element={<Navigate to="/home" replace />} />
      <Route path="/register" element={<Navigate to="/home" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AuthNavigator;
