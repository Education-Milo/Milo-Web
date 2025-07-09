import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import ForgotPassword from './pages/ForgotPassword';
import MiloScene from './pages/MiloScene';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import TestQCM from './pages/TestQCM';
import TestFillIn from './pages/TestFillIn';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route par défaut - redirection vers login ou home selon l'état de connexion */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Routes publiques (accessible seulement si non connecté) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />

        {/* Routes protégées (accessible seulement si connecté) */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/milo" 
          element={
            <ProtectedRoute>
              <MiloScene />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/qcm"
          element={
            <ProtectedRoute>
              <TestQCM />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/fill-in"
          element={
            <ProtectedRoute>
              <TestFillIn />
            </ProtectedRoute>
          }
        />

        {/* Route pour gérer les URLs non trouvées */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;