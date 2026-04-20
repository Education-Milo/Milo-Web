import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@shared/components/ProtectedRoute.component";
import RedirectScreen from "@features/auth/pages/Redirect.page";

// Pages communes
import HomeScreen from "@features/home/pages/Home.page";
import ProfilePage from "@features/profile/pages/Profile.page";
import UnauthorizedPage from "@features/auth/pages/Unauthorized.page";

// Pages User (Enfant/Élève)
import MiloScene from "@features/milo-scene/pages/MiloScene";
import CoursesPage from "@features/courses/pages/Courses.page";
import CourseDetailScreen from "@features/courses/pages/CourseDetail.page";
import MissionsPage from "@features/missions/pages/Missions.page";
import DuelsPage from "@features/duels/pages/Duels.page";
import ExerciseResultScreen from "@features/exercices/pages/ExerciseResult.page";
import ExerciseScreen from "@features/exercices/pages/Exercise.page";
import MyMiloPage from "@features/my-milo/pages/MyMilo.page";
import BoutiquePage from "@features/milo-shop/pages/MiloShop.page";

// Pages Parent
import ParentDashboard from "@features/parent/pages/Dashboard.page";
import SubscriptionPage from "@features/parent/pages/Subscription.page";
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

			<Route
				path="/"
				element={
					<ProtectedRoute>
						<RedirectScreen />
					</ProtectedRoute>
				}
			/>

			{/* ==================== ROUTES COMMUNES ==================== */}

			<Route
				path="/profile"
				element={
					<ProtectedRoute>
						<ProfilePage />
					</ProtectedRoute>
				}
			/>

			{/* ==================== ROUTES USER (Élève) ==================== */}

			<Route
				path="/milo"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<MiloScene />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/home"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<HomeScreen />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/courses"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<CoursesPage />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/courses/:subjectId"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<CourseDetailScreen />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/missions"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<MissionsPage />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/duels"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<DuelsPage />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/qcm/:lessonId"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<ExerciseScreen />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/exercise-result"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<ExerciseResultScreen />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/mon-milo"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<MyMiloPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/boutique"
				element={
					<ProtectedRoute allowedRoles={["Enfant"]}>
						<BoutiquePage />
					</ProtectedRoute>
				}
			/>

			{/* ==================== ROUTES PARENT ==================== */}
			<Route
				path="/parent/dashboard"
				element={
					<ProtectedRoute allowedRoles={["Parent"]}>
						<ParentDashboard />
					</ProtectedRoute>
				}
			/>

			<Route
				path="/parent/subscription"
				element={
					<ProtectedRoute allowedRoles={["Parent"]}>
						<SubscriptionPage />
					</ProtectedRoute>
				}
			/>

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

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

export default AuthNavigator;
