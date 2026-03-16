import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from '@screens/Auth/Login';
import RegisterScreen from '@screens/Auth/Register';
import ForgotPasswordScreen from '@screens/Auth/ForgotPassword';
import VitrinePage from '@screens/VitrinePage';
import ContactPage from '@screens/ContactPage';
import FAQPage from '@screens/FAQPage';

const PublicNavigator: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VitrinePage />} />

      <Route path="/login" element={<LoginScreen />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} /> 
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default PublicNavigator;