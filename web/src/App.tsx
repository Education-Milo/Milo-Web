import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import AuthNavigator from "@navigation/AuthNavigator";
import PublicNavigator from "@navigation/PublicNavigator";
import LoadingScreen from "@shared/components/LoadingScreen.component";
import ScrollToTop from "@shared/components/ScrollToTop.component";
import RouteAnnouncer from "@shared/components/RouteAnnouncer.component";
const BetaJourneyPage = lazy(() => import("@features/feedback/pages/BetaJourney.page"));
const MentionsPage = lazy(() => import("@features/legal/pages/Mentions.page"));
const PrivacyPage = lazy(() => import("@features/legal/pages/Privacy.page"));
const CookiesPage = lazy(() => import("@features/legal/pages/Cookies.page"));
const TermsPage = lazy(() => import("@features/legal/pages/Terms.page"));
const SalesPage = lazy(() => import("@features/legal/pages/Sales.page"));
const AiCharterPage = lazy(() => import("@features/legal/pages/AiCharter.page"));
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from "@shared/lib/queryClient";

const App: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<Router>
			<QueryClientProvider client={queryClient}>
				<ScrollToTop />
				<RouteAnnouncer />
				<Suspense fallback={<LoadingScreen label="Chargement…" />}>
				<Routes>
					{/* Retours bêta : ouverts à tous, connecté ou non */}
					<Route path="/feedback/parcours-beta" element={<BetaJourneyPage />} />
					{/* Pages légales : ouvertes à tous, connecté ou non (liens du footer et de l'app) */}
					<Route path="/mentions" element={<MentionsPage />} />
					<Route path="/confidentialite" element={<PrivacyPage />} />
					<Route path="/cookies" element={<CookiesPage />} />
					<Route path="/cgu" element={<TermsPage />} />
					<Route path="/cgv" element={<SalesPage />} />
					<Route path="/charte" element={<AiCharterPage />} />
					<Route path="*" element={isAuthenticated ? <AuthNavigator /> : <PublicNavigator />} />
				</Routes>
				</Suspense>
			</QueryClientProvider>
		</Router>
	);
};

export default App;
