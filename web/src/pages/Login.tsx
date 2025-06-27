import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import miloLogo from '/milo-logo.png';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    // Validation
    let hasError = false;
    
    if (!email) {
      setEmailError("L'email est requis");
      hasError = true;
    }
    
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      hasError = true;
    }
    
    if (!hasError) {
      // Simulation de connexion réussie
      console.log('Login attempt:', { email, password });
      // Redirection vers la page d'accueil
      navigate('/home');
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
                    className={`input ${emailError ? 'error' : ''}`}
                    placeholder="Votre adresse email"
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
                    className={`input password-input ${passwordError ? 'error' : ''}`}
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
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
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="submit-button"
              >
                Se connecter
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
                  <button className="signup-link" onClick={handleSignUp}>
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