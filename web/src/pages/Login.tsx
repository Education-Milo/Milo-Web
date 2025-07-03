import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/Login.css';
import miloLogo from '/milo-logo.png';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    
    // Validation locale
    let hasError = false;
    
    if (!email) {
      setEmailError("L'email est requis");
      hasError = true;
    }
    
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      hasError = true;
    }
    
    if (hasError) return;

    setIsLoading(true);

    try {
      // Appel à l'API avec l'email comme username
      const response = await authService.login({
        username: email,
        password: password
      });

      // Sauvegarder le token
      authService.saveToken(response.access_token);
      
      console.log('Connexion réussie:', response);
      
      // Redirection vers la page d'origine ou vers /home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Gérer les différents types d'erreurs
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      
      if (errorMessage.toLowerCase().includes('incorrect username or password')) {
        setGeneralError('Email ou mot de passe incorrect');
      } else if (errorMessage.toLowerCase().includes('user not found')) {
        setGeneralError('Aucun compte trouvé avec cet email');
      } else {
        setGeneralError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la touche Entrée
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Section - Branding */}
        <div className="left-section">
          <div className="decorative-circle-1"></div>
          <div className="decorative-circle-2"></div>
          
          <div className="branding-content">
            <div className="logo-container">
              <img 
                src={miloLogo} 
                alt="Milo Logo" 
                className="logo-milo"
              />
            </div>
            <h1 className="brand-title">
              Bienvenue sur Milo
            </h1>
            <p className="brand-subtitle">
              Connectez-vous pour accéder à votre espace personnel et découvrir toutes les fonctionnalités de notre plateforme.
            </p>
          </div>

          <div className="footer">
            <p>© 2025 Milo. Tous droits réservés.</p>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="right-section">
          <div className="form-wrapper">
            <div className="form-header">
              <h2 className="form-title">Se connecter</h2>
              <p className="form-subtitle">
                Entrez vos identifiants pour accéder à votre compte
              </p>
            </div>
            
            <div className="form">
              {/* Message d'erreur général */}
              {generalError && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
                    {generalError}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${emailError ? 'error' : ''}`}
                    placeholder="Votre adresse email"
                    disabled={isLoading}
                  />
                </div>
                {emailError && (
                  <p className="error-message">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input password-input ${passwordError ? 'error' : ''}`}
                    placeholder="Votre mot de passe"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="error-message">{passwordError}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="forgot-password">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="submit-button"
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isLoading && <Loader2 size={20} className="animate-spin" />}
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </button>

              {/* Divider */}
              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">ou</span>
                <div className="divider-line"></div>
              </div>

              {/* Sign Up Link */}
              <div className="signup-section">
                <p className="signup-text">
                  Pas de compte ?{' '}
                  <button 
                    className="signup-link" 
                    onClick={handleSignUp}
                    disabled={isLoading}
                  >
                    Inscrivez-vous
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;