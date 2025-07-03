import React, { useState } from 'react';
import { User, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/Register.css';
import miloLogo from '/milo-logo.png';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (!formData.role) {
      newErrors.role = 'Veuillez sélectionner un rôle';
    }
    
    return newErrors;
  };

  const handleSubmit = async () => {
    setGeneralError('');
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        // Préparer les données pour l'API
        const registerData = {
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        };

        console.log('Tentative d\'inscription:', registerData);
        
        // Appel à l'API
        const response = await authService.register(registerData);
        
        // Sauvegarder le token reçu
        authService.saveToken(response.access_token);
        
        console.log('Inscription réussie:', response);
        
        // Redirection vers la page d'accueil
        navigate('/home');
        
      } catch (error) {
        console.error('Erreur d\'inscription:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
        
        // Gérer les erreurs spécifiques
        if (errorMessage.toLowerCase().includes('email already registered') || 
            errorMessage.toLowerCase().includes('user already exists')) {
          setGeneralError('Cette adresse email est déjà utilisée');
        } else if (errorMessage.toLowerCase().includes('invalid email')) {
          setErrors(prev => ({ ...prev, email: 'Adresse email invalide' }));
        } else {
          setGeneralError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Gérer la touche Entrée
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="form-page-wrapper">
      <div className="decorative-circle-1"></div>
      <div className="decorative-circle-2"></div>
      
      <div className="form-page-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="form-content">
            {/* Header with back button */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '2rem' 
            }}>
              <button 
                onClick={handleBackToLogin}
                disabled={isLoading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: isLoading ? 'not-allowed' : 'pointer', 
                  marginRight: '1rem',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s',
                  opacity: isLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.target.style.backgroundColor = 'transparent';
                }}
              >
                <ArrowLeft size={24} style={{ color: '#374151' }} />
              </button>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#1f2937', 
                margin: 0 
              }}>
                Inscription
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
              <h2 className="form-title">Créer votre compte</h2>
              <p className="form-subtitle">
                Rejoignez Milo et découvrez une nouvelle façon d'apprendre
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

              {/* Nom Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${errors.nom ? 'error' : ''}`}
                    placeholder="Nom"
                    disabled={isLoading}
                  />
                </div>
                {errors.nom && (
                  <p className="error-message">{errors.nom}</p>
                )}
              </div>

              {/* Prénom Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${errors.prenom ? 'error' : ''}`}
                    placeholder="Prénom"
                    disabled={isLoading}
                  />
                </div>
                {errors.prenom && (
                  <p className="error-message">{errors.prenom}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${errors.email ? 'error' : ''}`}
                    placeholder="Adresse email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="error-message">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${errors.password ? 'error' : ''}`}
                    placeholder="Mot de passe"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="input-group">
                <div className="input-container">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirmation du mot de passe"
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="error-message">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Role Selection */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Sélectionnez votre rôle :
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.75rem' 
                }}>
                  {['Élève', 'Parent', 'Professeur'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      disabled={isLoading}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: `2px solid ${formData.role === role ? '#f97316' : '#e5e7eb'}`,
                        backgroundColor: formData.role === role ? '#fff7ed' : 'white',
                        color: formData.role === role ? '#ea580c' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        opacity: isLoading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (formData.role !== role && !isLoading) {
                          e.target.style.borderColor = '#d1d5db';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.role !== role && !isLoading) {
                          e.target.style.borderColor = '#e5e7eb';
                        }
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                {errors.role && (
                  <p className="error-message" style={{ marginTop: '0.5rem' }}>{errors.role}</p>
                )}
              </div>

              {/* Legal Text */}
              <div style={{ 
                marginTop: '1.5rem', 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
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

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="submit-button"
                disabled={isLoading}
                style={{ 
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isLoading && <Loader2 size={20} className="animate-spin" />}
                {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
              </button>

              {/* Back to Login */}
              <div className="signup-section">
                <p className="signup-text">
                  Déjà un compte ?{' '}
                  <button 
                    className="signup-link" 
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                  >
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