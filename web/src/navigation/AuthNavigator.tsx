import React, { lazy, Suspense, useEffect } from "react";
import LoadingScreen from "@shared/components/LoadingScreen.component";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { rememberPath } from "@shared/lib/exitPath";
import ProtectedRoute from "@shared/components/ProtectedRoute.component";
const RedirectScreen = lazy(() => import("@features/auth/pages/Redirect.page"));
import { DuelProvider } from "@features/duels/context/DuelContext";
import ChallengeNotification from "@features/duels/components/ChallengeNotification";
import ToastContainer from "@shared/components/Toast.component";
import DemoBanner from "@shared/components/DemoBanner.component";
import WellbeingNudge from "@features/wellbeing/components/WellbeingNudge.component";
import OnboardingTour from "@features/onboarding/components/OnboardingTour.component";

// Pages communes
const HomeScreen = lazy(() => import("@features/home/pages/Home.page"));
const ProfilePage = lazy(() => import("@features/profile/pages/Profile.page"));
const UnauthorizedPage = lazy(() => import("@features/auth/pages/Unauthorized.page"));

// Pages User (Enfant/Élève)
const MiloScene = lazy(() => import("@features/milo-scene/pages/MiloScene"));
const CoursesPage = lazy(() => import("@features/courses/pages/Courses.page"));
const CourseDetailScreen = lazy(() => import("@features/courses/pages/CourseDetail.page"));
const MissionsPage = lazy(() => import("@features/missions/pages/Missions.page"));
const DuelsPage = lazy(() => import("@features/duels/pages/Duels.page"));
const ExerciseResultScreen = lazy(() => import("@features/exercices/pages/ExerciseResult.page"));
const ExerciseScreen = lazy(() => import("@features/exercices/pages/Exercise.page"));
const MyMiloPage = lazy(() => import("@features/my-milo/pages/MyMilo.page"));
const BoutiquePage = lazy(() => import("@features/milo-shop/pages/MiloShop.page"));
const FriendsPage = lazy(() => import("@features/friends/pages/Friends.page"));
const AdminPage = lazy(() => import("@features/admin/pages/Admin.page"));
const OcrPage = lazy(() => import("@features/ocr/pages/OcrPage"));
const GeneratedExercisePage = lazy(() => import("@features/ocr/pages/GeneratedExercisePage"));
const OnboardingClassroomPage = lazy(() => import("@features/onboarding/pages/OnboardingClassroom.page"));
const ProfilePickerPage = lazy(() => import("@features/account/pages/ProfilePicker.page"));
import { ROUTES } from "@shared/constants/routes";
import { PLAYER_ROLES } from "@shared/constants/roles";

// Pages Parent
const ParentDashboard = lazy(() => import("@features/parent/pages/Dashboard.page"));
const SubscriptionPage = lazy(() => import("@features/parent/pages/Subscription.page"));
const ParentChildrenPage = lazy(() => import("@features/parent/pages/Children.page"));
const ParentReportsPage = lazy(() => import("@features/parent/pages/Reports.page"));

// // Pages Prof
// import ProfDashboard from '@screens/Prof/Dashboard';
// import ClassManagement from '@screens/Prof/ClassManagement';
// import StudentProgress from '@screens/Prof/StudentProgress';

// // Pages Admin
// import AdminDashboard from '@screens/Admin/Dashboard';

const AuthNavigator: React.FC = () => {
	// Page d'où l'on entre en classe : « Quitter » y ramène (cf. exitPath.ts)
	const location = useLocation();
	useEffect(() => {
		rememberPath(location.pathname, location.search);
	}, [location.pathname, location.search]);

	// Échelle de texte agrandie pour l'application (voir brand.css, html.milo-app)
	useEffect(() => {
		document.documentElement.classList.add("milo-app");
		return () => document.documentElement.classList.remove("milo-app");
	}, []);

	return (
		<DuelProvider>
			<ChallengeNotification />
			<ToastContainer />
			<DemoBanner />
			<WellbeingNudge />
			<OnboardingTour />
			{/* Pages chargées à la demande : Three.js et les scènes 3D ne sont
			    téléchargés que sur les pages qui en ont besoin */}
			<Suspense fallback={<LoadingScreen label="Chargement…" />}>
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

				{/* Gérer les profils du compte (changer de profil passe par « Qui est-ce ? ») */}
				<Route
					path={ROUTES.PROFILE_MANAGE}
					element={
						<ProtectedRoute>
							<ProfilePickerPage />
						</ProtectedRoute>
					}
				/>

				{/* ==================== ROUTES USER (Élève, et admins qui jouent aussi) ==================== */}

				<Route
					path="/milo"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<MiloScene />
						</ProtectedRoute>
					}
				/>

				{/* Onboarding : Milo accueille le nouvel élève en classe */}
				<Route
					path={ROUTES.ONBOARDING}
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<OnboardingClassroomPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/home"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<HomeScreen />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.COURSES}
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<CoursesPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/courses/:subjectId"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<CourseDetailScreen />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/course-milo/:lessonId"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<MiloScene />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/course-milo/:lessonId/question-ouverte"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<MiloScene />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.OCR}
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<OcrPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.GENERATED_EXERCISE}
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<GeneratedExercisePage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/missions"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<MissionsPage />
						</ProtectedRoute>
					}
				/>

				{/* Les statistiques sont intégrées au profil : anciens liens redirigés */}
				<Route path={ROUTES.STATS} element={<Navigate to={ROUTES.PROFILE} replace />} />

				<Route
					path="/duels"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<DuelsPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.QCM_GENERATED}
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<ExerciseScreen />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/qcm/:lessonId"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<ExerciseScreen />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/exercise-result"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<ExerciseResultScreen />
						</ProtectedRoute>
					}
				/>
				<Route
					path={ROUTES.PERSONALIZATION}
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<MyMiloPage />
						</ProtectedRoute>
					}
				/>
				{/* Ancienne adresse de la page, gardée pour les favoris */}
				<Route path="/mon-milo" element={<Navigate to={ROUTES.PERSONALIZATION} replace />} />
				<Route
					path="/boutique"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<BoutiquePage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/friends"
					element={
						<ProtectedRoute allowedRoles={PLAYER_ROLES}>
							<FriendsPage />
						</ProtectedRoute>
					}
				/>

				{/* ==================== ROUTES PARENT ==================== */}
				<Route
					path={ROUTES.PARENT.DASHBOARD}
					element={
						<ProtectedRoute allowedRoles={["Parent"]}>
							<ParentDashboard />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.PARENT.CHILDREN}
					element={
						<ProtectedRoute allowedRoles={["Parent"]}>
							<ParentChildrenPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.PARENT.REPORTS}
					element={
						<ProtectedRoute allowedRoles={["Parent"]}>
							<ParentReportsPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path={ROUTES.PARENT.SUBSCRIPTION}
					element={
						<ProtectedRoute allowedRoles={["Parent"]}>
							<SubscriptionPage />
						</ProtectedRoute>
					}
				/>

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
				<Route
					path={`${ROUTES.ADMIN.DASHBOARD}/*`}
					element={
						<ProtectedRoute allowedRoles={["Admin"]}>
							<AdminPage />
						</ProtectedRoute>
					}
				/>

				{/* ==================== ROUTES SPÉCIALES ==================== */}
				{/* Page non autorisé */}
				<Route path="/unauthorized" element={<UnauthorizedPage />} />

				{/* Redirection des routes publiques */}
				<Route path="/login" element={<Navigate to="/" replace />} />
				{/* Profil tout juste choisi : la redirection l'envoie sur l'accueil de son rôle */}
				<Route path={ROUTES.PROFILE_SELECT} element={<Navigate to="/" replace />} />
				<Route path="/register" element={<Navigate to="/" replace />} />
				<Route path="/forgot-password" element={<Navigate to="/" replace />} />

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			</Suspense>
		</DuelProvider>
	);
};

export default AuthNavigator;
