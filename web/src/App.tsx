import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import AuthNavigator from "@navigation/AuthNavigator";
import PublicNavigator from "@navigation/PublicNavigator";
import LoadingScreen from "@shared/components/LoadingScreen.component";
import ScrollToTop from "@shared/components/ScrollToTop.component";
import BetaJourneyPage from "@features/feedback/pages/BetaJourney.page";
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
					<Route path="*" element={isAuthenticated ? <AuthNavigator /> : <PublicNavigator />} />
				</Routes>
			</QueryClientProvider>
		</Router>
	);
};

export default App;
