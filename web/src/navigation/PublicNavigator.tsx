import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from '@features/auth/pages/Login.page';
import RegisterScreen from '@features/auth/pages/Register.page';
import ForgotPasswordScreen from '@features/auth/pages/ForgotPassword.page';
import VitrinePage from '@features/landing/pages/Vitrine.page';
import ContactPage from '@features/landing/pages/Contact.page';
import FAQPage from '@features/landing/pages/FAQ.page';

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