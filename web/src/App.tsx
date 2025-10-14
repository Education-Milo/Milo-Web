import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import AuthNavigator from '@navigation/AuthNavigator';
import PublicNavigator from '@navigation/PublicNavigator';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthenticated = !!accessToken;

  return (
    <ThemeProvider>
      <Router>
        {isAuthenticated ? <AuthNavigator /> : <PublicNavigator />}
      </Router>
    </ThemeProvider>
  );
};

export default App;