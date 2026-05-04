import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "@shared/hooks/useAuth";
import AuthNavigator from "@navigation/AuthNavigator";
import PublicNavigator from "@navigation/PublicNavigator";
import LoadingScreen from "@shared/components/LoadingScreen.component";
import ScrollToTop from "@shared/components/ScrollToTop.component";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const App: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();
	const queryClient = new QueryClient();


	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<Router>
			<QueryClientProvider client={queryClient}>
				<ScrollToTop />
				{isAuthenticated ? <AuthNavigator /> : <PublicNavigator />}
			</QueryClientProvider>
		</Router>
	);
};

export default App;
