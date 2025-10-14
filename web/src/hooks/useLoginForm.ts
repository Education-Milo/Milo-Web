import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import type { LoginFormData, FormErrors } from '../types/auth.types';

export const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
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
        console.log('📤 Tentative de connexion');
        await login(formData.email.trim(), formData.password);

        console.log('✅ Connexion réussie');
        // Redirection vers la page d'origine ou vers /home
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      } catch (error: any) {
        console.error('❌ Erreur de connexion:', error);
        // Gérer les différents types d'erreurs
        const errorMessage = error?.response?.data?.detail ||
                            error?.message ||
                            'Une erreur est survenue';
        if (typeof errorMessage === 'string') {
          if (errorMessage.toLowerCase().includes('incorrect username or password')) {
            setGeneralError('Email ou mot de passe incorrect');
          } else if (errorMessage.toLowerCase().includes('user not found')) {
            setGeneralError('Aucun compte trouvé avec cet email');
          } else {
            setGeneralError(errorMessage);
          }
        } else {
          setGeneralError('Une erreur est survenue lors de la connexion');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  return {
    formData,
    errors,
    isLoading,
    generalError,
    handleInputChange,
    handleSubmit,
    handleForgotPassword,
    handleSignUp,
    navigate
  };
};
