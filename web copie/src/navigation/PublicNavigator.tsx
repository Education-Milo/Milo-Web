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
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default PublicNavigator;
