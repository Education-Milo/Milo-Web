import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@components/ProtectedRoute';
import RedirectScreen from '@screens/RedirectScreen';

// Pages communes
import HomeScreen from '@screens/HomePage';
import ProfilePage from '@screens/ProfilePage';
import UnauthorizedPage from '@screens/UnauthorizedScreen';

// Pages User (Enfant/Élève)
import MiloScene from '@screens/MiloScene';
import CoursesPage from '@screens/CoursesScreen';
import CourseDetailScreen from '@screens/CourseDetailScreen';
import MissionsPage from '@screens/MissionsScreen';
import DuelsPage from '@screens/DuelsScreen';

// Pages Parent
import ParentDashboard from '@screens/Parent/Dashboard';
// import ChildrenManagement from '@screens/Parent/ChildrenManagement';
// import ProgressTracking from '@screens/Parent/ProgressTracking';
// import ParentalControls from '@screens/Parent/ParentalControls';

// // Pages Prof
// import ProfDashboard from '@screens/Prof/Dashboard';
// import ClassManagement from '@screens/Prof/ClassManagement';
// import StudentProgress from '@screens/Prof/StudentProgress';

// // Pages Admin
// import AdminDashboard from '@screens/Admin/Dashboard';

const AuthNavigator: React.FC = () => {
  return (
    <Routes>

      {/* ==================== PAGE DE REDIRECTION ==================== */}

      <Route path="/" element={
        <ProtectedRoute>
          <RedirectScreen />
        </ProtectedRoute>
      } />

      {/* ==================== ROUTES COMMUNES ==================== */}

      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* ==================== ROUTES USER (Élève) ==================== */}

      <Route path="/milo" element={
        <ProtectedRoute allowedRoles={['Enfant']}>
          <MiloScene />
        </ProtectedRoute>
      } />

      <Route path="/home" element={
        <ProtectedRoute allowedRoles={['Enfant']}>
          <HomeScreen />
        </ProtectedRoute>
      } />

      <Route path="/courses" element={
        <ProtectedRoute allowedRoles={['Enfant']}>
          <CoursesPage />
        </ProtectedRoute>
      } />

      <Route path="/courses/:courseId" element={
        <ProtectedRoute allowedRoles={['Enfant']}>
          <CourseDetailScreen />
        </ProtectedRoute>
      } />

      <Route path="/missions" element={
        <ProtectedRoute allowedRoles={['Enfant']}>
          <MissionsPage />
        </ProtectedRoute>
      } />

      <Route path="/duels" element={
        <ProtectedRoute allowedRoles={['Enfant']}>
          <DuelsPage />
        </ProtectedRoute>
      } />

      {/* ==================== ROUTES PARENT ==================== */}
      <Route path="/parent/dashboard" element={
        <ProtectedRoute allowedRoles={['Parent']}>
          <ParentDashboard />
        </ProtectedRoute>
      } />
      {/*
      <Route path="/parent/children" element={
        <ProtectedRoute allowedRoles={['Parent']}>
          <ChildrenManagement />
        </ProtectedRoute>
      } />

      <Route path="/parent/progress" element={
        <ProtectedRoute allowedRoles={['Parent']}>
          <ProgressTracking />
        </ProtectedRoute>
      } />

      <Route path="/parent/controls" element={
        <ProtectedRoute allowedRoles={['Parent']}>
          <ParentalControls />
        </ProtectedRoute>
      } />

      {/* ==================== ROUTES PROF ==================== */}
      {/* <Route path="/prof/dashboard" element={
        <ProtectedRoute allowedRoles={['Prof']}>
          <ProfDashboard />
        </ProtectedRoute>
      } />

      <Route path="/prof/classes" element={
        <ProtectedRoute allowedRoles={['Prof']}>
          <ClassManagement />
        </ProtectedRoute>
      } />

      <Route path="/prof/students" element={
        <ProtectedRoute allowedRoles={['Prof']}>
          <StudentProgress />
        </ProtectedRoute>
      } /> */}

      {/* ==================== ROUTES ADMIN ==================== */}

      {/* <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } /> */}

      {/* ==================== ROUTES SPÉCIALES ==================== */}
      {/* Page non autorisé */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Redirection des routes publiques */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />

      {/* Route catch-all pour 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AuthNavigator;