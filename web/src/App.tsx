import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import AuthNavigator from "@navigation/AuthNavigator";
import PublicNavigator from "@navigation/PublicNavigator";
import LoadingScreen from "@components/LoadingScreen.component";

const App: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<Router>{isAuthenticated ? <AuthNavigator /> : <PublicNavigator />}</Router>
	);
};

export default App;
