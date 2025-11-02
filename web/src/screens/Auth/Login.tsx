import React from 'react';
import { Mail, Lock } from 'lucide-react';
import { useLoginForm } from '@hooks/useLoginForm';
import TextFieldComponent from '@components/ui/common/TextField.component';
import '@styles/Login.css';
import miloLogo from '/milo-logo.png';
import MainButtonComponent from '@components/ui/common/MainButtonComponent';
// import ThemeToggle from '@components/ui/common/ThemeToggle';

const Login: React.FC = () => {
  const {
    formData,
    errors,
    isLoading,
    generalError,
    handleInputChange,
    handleSubmit,
    handleForgotPassword,
    handleSignUp
  } = useLoginForm();

  // Gérer la touche Entrée
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
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
              <TextFieldComponent
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Votre adresse email"
                icon={<Mail className="w-5 h-5 text-gray-500" />}
                error={errors.email}
                disabled={isLoading}
              />

              {/* Password Field */}
              <TextFieldComponent
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Votre mot de passe"
                icon={<Lock className="w-5 h-5 text-gray-500" />}
                error={errors.password}
                disabled={isLoading}
              />

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

              {/* Nouveau bouton avec MainButtonComponent */}
              <MainButtonComponent
                title={isLoading ? 'Connexion en cours...' : 'Se connecter'}
                onPress={handleSubmit}
                loading={isLoading}
              />

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