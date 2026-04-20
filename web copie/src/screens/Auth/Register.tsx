import React from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { useRegisterForm } from '@hooks/useRegisterForm';
import TextField from "@components/ui/common/TextField.component";
import { RoleSelector } from '@components/ui/auth/RoleSelector';
import { AuthErrorMessage } from '@components/ui/auth/AuthErrorMessage';
import { BackButton } from '@components/ui/common/BackButton';
import '@styles/Register.css';
import miloLogo from '/milo-logo.png';
import MainButtonComponent from '@components/ui/common/MainButtonComponent';
import { ClassSelector } from '@components/ClassSelector.component';

const Register: React.FC = () => {
  const {
    formData,
    errors,
    isLoading,
    generalError,
    handleInputChange,
    handleSubmit,
    navigate
  } = useRegisterForm();

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <div className="form-page-wrapper">
      <div className="decorative-circle-1"></div>
      <div className="decorative-circle-2"></div>
      <div className="form-page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="form-content">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <BackButton
                onClick={() => navigate('/login')}
                disabled={isLoading}
              />
              <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0, marginLeft: '1rem' }}>
                Inscription
              </h1>
            </div>
            <div className="logo-container">
              <img src={miloLogo} alt="Milo Logo" className="logo-milo" />
            </div>
            <div className="form-header">
              <h2 className="form-title">Créer votre compte</h2>
              <p className="form-subtitle">
                Rejoignez Milo et découvrez une nouvelle façon d'apprendre
              </p>
            </div>
            <div className="form">
              <AuthErrorMessage message={generalError} />

              <TextField
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nom"
                icon={<User className="w-5 h-5 text-gray-500" />}
                error={errors.last_name}
                disabled={isLoading}
              />

              <TextField
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Prénom"
                icon={<User className="w-5 h-5 text-gray-500" />}
                error={errors.first_name}
                disabled={isLoading}
              />

              <TextField
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Adresse email"
                icon={<Mail className="w-5 h-5 text-gray-500" />}
                error={errors.email}
                disabled={isLoading}
              />

              <TextField
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mot de passe"
                icon={<Lock className="w-5 h-5 text-gray-500" />}
                error={errors.password}
                disabled={isLoading}
              />

              <TextField
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Confirmation du mot de passe"
                icon={<Lock className="w-5 h-5 text-gray-500" />}
                error={errors.confirmPassword}
                disabled={isLoading}
              />

              <RoleSelector
                selectedRole={formData.role}
                onRoleSelect={(role: string) => handleInputChange('role', role)}
                error={errors.role}
                disabled={isLoading}
              />
              {formData.role === 'Élève' && (
                <div style={{ marginTop: '1rem' }}>
                  <ClassSelector
                    value={formData.classe}
                    onChange={(classe: string) => handleInputChange('classe', classe)}
                    error={errors.classe}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                <p>
                  En rejoignant Milo, vous confirmez avoir lu et accepté les{' '}
                  <a href="#" style={{ color: '#f97316', textDecoration: 'underline' }}>
                    conditions générales d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" style={{ color: '#f97316', textDecoration: 'underline' }}>
                    politique de confidentialité
                  </a>.
                </p>
              </div>
              <MainButtonComponent
                title={isLoading ? 'Inscription en cours...' : "S'inscrire"}
                onPress={handleSubmit}
                loading={isLoading}
              />

              {/* Back to Login */}
              <div className="signup-section">
                <p className="signup-text">
                  Déjà un compte ?{' '}
                  <button className="signup-link" onClick={() => navigate('/login')} disabled={isLoading}>
                    Se connecter
                  </button>
                </p>
              </div>
            </div>
          </div>
          <div className="footer">
            <p>© 2025 Milo. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;