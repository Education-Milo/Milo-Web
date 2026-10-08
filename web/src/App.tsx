import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import AuthNavigator from "@navigation/AuthNavigator";
import PublicNavigator from "@navigation/PublicNavigator";
import LoadingScreen from "@shared/components/LoadingScreen.component";
import ScrollToTop from "@shared/components/ScrollToTop.component";
import BetaJourneyPage from "@features/feedback/pages/BetaJourney.page";
import MentionsPage from "@features/legal/pages/Mentions.page";
import PrivacyPage from "@features/legal/pages/Privacy.page";
import CookiesPage from "@features/legal/pages/Cookies.page";
import TermsPage from "@features/legal/pages/Terms.page";
import SalesPage from "@features/legal/pages/Sales.page";
import AiCharterPage from "@features/legal/pages/AiCharter.page";
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
			</QueryClientProvider>
		</Router>
	);
};

export default App;
