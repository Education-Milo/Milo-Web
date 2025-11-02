import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from '@screens/Auth/Login';
import RegisterScreen from '@screens/Auth/Register';
import ForgotPasswordScreen from '@screens/Auth/ForgotPassword';

const PublicNavigator: React.FC = () => {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      {/* Redirection par défaut pour les utilisateurs non authentifiés */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Redirection des routes protégées vers login si non connecté */}
      <Route path="/home" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Navigate to="/login" replace />} />
      <Route path="/profile" element={<Navigate to="/login" replace />} />
      <Route path="/courses" element={<Navigate to="/login" replace />} />
      <Route path="/missions" element={<Navigate to="/login" replace />} />
      <Route path="/duels" element={<Navigate to="/login" replace />} />
      <Route path="/milo" element={<Navigate to="/login" replace />} />
      {/* Route catch-all pour toutes les autres routes non définies */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default PublicNavigator;
