import React from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import '@styles/ForgotPassword.css';
import miloLogo from '/milo-logo.png'; // Adjust the path according to your project structure
import TextFieldComponent from '@components/ui/common/TextField.component';
import MainButtonComponent from '@components/ui/common/MainButtonComponent';
import useForgotPassword from '@hooks/userForgotPassword';

const ForgotPassword: React.FC = () => {
  const {
    email,
    setEmail,
    emailError,
    isSubmitted,
    handleSubmit,
    handleBackToLogin,
    resend,
  } = useForgotPassword();

  if (isSubmitted) {
    return (
      <div className="form-page-wrapper">
        <div className="decorative-circle-1"></div>
        <div className="decorative-circle-2"></div>
        <div className="form-page-container">
          <div className="form-content">
            {/* Logo */}
            <div className="logo-container">
              <img
                src={miloLogo}
                alt="Milo Logo"
                className="logo-milo"
              />
            </div>
            {/* Success Message */}
            <div className="form-header">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#dcfce7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={32} style={{ color: '#16a34a' }} />
                </div>
              </div>
              <h2 className="form-title">Email envoyé !</h2>
              <p className="form-subtitle">
                Nous avons envoyé un lien de réinitialisation de mot de passe à{' '}
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{email}</span>.
              </p>
            </div>
            <div className="form">
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <button
                onClick={handleBackToLogin}
                className="submit-button"
              >
                Retour à la connexion
              </button>
              <div className="signup-section">
                <button
                  onClick={resend}
                  className="signup-link"
                  style={{ fontSize: '0.875rem' }}
                >
                  Renvoyer l'email
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="footer">
          <p>© 2025 Milo. Tous droits réservés.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-wrapper">
      <div className="decorative-circle-1"></div>
      <div className="decorative-circle-2"></div>
      
      <div className="form-page-container">
        <div className="form-content">
          {/* Header with back button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            {/* <button 
              onClick={handleBackToLogin}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                marginRight: '1rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <ArrowLeft size={24} style={{ color: '#374151' }} />
            </button> */}
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Mot de passe oublié
            </h1>
          </div>

          {/* Logo */}
          <div className="logo-container">
            <img
              src={miloLogo}
              alt="Milo Logo"
              className="logo-milo"
            />
          </div>
          {/* Form Header */}
          <div className="form-header">
            <h2 className="form-title">Réinitialiser votre mot de passe</h2>
            <p className="form-subtitle">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
          <div className="form">
            {/* Email Field */}
            <div className="input-group">
              <div className="input-container">
                {/* <div className="input-icon">
                  <Mail size={20} />
                </div> */}
                {/* <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input ${emailError ? 'error' : ''}`}
                  placeholder="Votre adresse email"
                /> */}
                <TextFieldComponent
                  type="email"
                  placeholder='Votre adresse email'
                  value={email}
                  icon={<Mail className="w-5 h-5 text-gray-500" />}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {emailError && (
                <p className="error-message">{emailError}</p>
              )}
            </div>

            {/* Submit Button */}
            {/* <button
              onClick={handleSubmit}
              className="submit-button"
            >
              Envoyer le lien de réinitialisation
            </button> */}
            <MainButtonComponent
              title="Envoyer le lien de connexion"
              onPress={handleSubmit}
            />

            {/* Back to Login */}
            <div className="signup-section">
              <button
                onClick={handleBackToLogin}
                className="signup-link"
              >
                ← Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <p>© 2025 Milo. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default ForgotPassword;