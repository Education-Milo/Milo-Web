import React, { lazy, Suspense } from 'react';
import LoadingScreen from '@shared/components/LoadingScreen.component';
import { Routes, Route, Navigate } from 'react-router-dom';
const LoginScreen = lazy(() => import('@features/auth/pages/Login.page'));
const RoleSelectScreen = lazy(() => import('@features/auth/pages/RoleSelect.page'));
const RegisterScreen = lazy(() => import('@features/auth/pages/Register.page'));
const ForgotPasswordScreen = lazy(() => import('@features/auth/pages/ForgotPassword.page'));
const VitrinePage = lazy(() => import('@features/landing/pages/Vitrine.page'));
const ContactPage = lazy(() => import('@features/landing/pages/Contact.page'));
const FAQPage = lazy(() => import('@features/landing/pages/FAQ.page'));
const ProfilePickerPage = lazy(() => import('@features/account/pages/ProfilePicker.page'));
import { ROUTES } from '@shared/constants/routes';

const PublicNavigator: React.FC = () => {
  return (
    // Chaque page est chargée à la demande (découpage du bundle par route)
    <Suspense fallback={<LoadingScreen label="Chargement…" />}>
    <Routes>
      <Route path="/" element={<VitrinePage />} />

      <Route path="/login" element={<LoginScreen />} />
      {/* « Qui est-ce ? » : jeton de compte en main, profil à choisir */}
      <Route path={ROUTES.PROFILE_SELECT} element={<ProfilePickerPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/register" element={<RoleSelectScreen />} />
      <Route path="/register/:role" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default PublicNavigator;