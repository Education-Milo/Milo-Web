import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from '@screens/Auth/Login.page';
import RegisterScreen from '@screens/Auth/Register.page';
import ForgotPasswordScreen from '@screens/Auth/ForgotPassword.page';
import VitrinePage from '@screens/Landing/Vitrine.page';
import ContactPage from '@screens/Landing/Contact.page';
import FAQPage from '@screens/Landing/FAQ.page';

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