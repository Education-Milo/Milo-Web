import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import AuthNavigator from '@navigation/AuthNavigator';
import PublicNavigator from '@navigation/PublicNavigator';
import LoadingScreen from '@components/LoadingScreen';
// import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      // <ThemeProvider>
        <LoadingScreen />
      // </ThemeProvider>
    );
  }

  return (
    // <ThemeProvider>
      <Router>
        {isAuthenticated ? <AuthNavigator /> : <PublicNavigator />}
      </Router>
    // </ThemeProvider>
  );
};

export default App;