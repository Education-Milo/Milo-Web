import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import type { RegisterFormData, FormErrors } from '../types/auth.types';
import { ROUTES } from '@constants/routes';
import type { UserRole, ClassType } from '@store/user/user.model';

export const useRegisterForm = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    last_name: '',
    first_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    classe: '',
  });

  const ROLE_MAPPING: Record<string, UserRole> = {
    'Élève': 'Enfant',
    'Parent': 'Parent',
    'Professeur': 'Prof'
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();
  const register = useAuthStore(state => state.register);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
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

    // Correction des clés: last_name et first_name pour matcher avec Register.tsx
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
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

    if (formData.role === 'Élève' && !formData.classe.trim()) {
      newErrors.classe = 'La classe est requise pour le rôle Élève';
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
        // Au lieu de muter formData (ce qui peut créer des bugs dans React),
        // on crée des variables juste pour l'envoi au serveur.
        const roleToSend = ROLE_MAPPING[formData.role] || 'Enfant';
        
        // ASTUCE: Si c'est un parent, on n'envoie pas de classe au serveur (undefined)
        // pour éviter que le backend ne bloque l'inscription avec une classe vide ("").
        const classeToSend = formData.role === 'Élève' ? (formData.classe as ClassType) : undefined;

        await register(
          formData.email.trim(),
          formData.password,
          formData.last_name.trim(),
          formData.first_name.trim(),
          roleToSend,
          classeToSend
        );
        
        // Une fois inscrit, on redirige (tu pourras changer la route si tu crées une page spécifique parent)
        if (roleToSend === 'Parent') {
          navigate('/parent/dashboard');
        } else if (roleToSend === 'Prof') {
          navigate('/prof/dashboard'); // Si tu l'actives plus tard
        } else {
          navigate('/home'); // Pour les enfants
        }

      } catch (error: any) {
        console.error('❌ Erreur d\'inscription:', error);

        const errorMessage = error?.response?.data?.detail ||
                            error?.message ||
                            'Une erreur est survenue';
                            
        if (typeof errorMessage === 'string') {
          if (errorMessage.toLowerCase().includes('email already registered') ||
              errorMessage.toLowerCase().includes('user already exists') ||
              errorMessage.toLowerCase().includes('already registered')) {
            setGeneralError('Cette adresse email est déjà utilisée');
          } else if (errorMessage.toLowerCase().includes('invalid email')) {
            setErrors(prev => ({ ...prev, email: 'Adresse email invalide' }));
          } else {
            setGeneralError(errorMessage);
          }
        } else if (Array.isArray(errorMessage)) {
          const validationErrors: FormErrors = {};
          errorMessage.forEach((err: any) => {
            const field = err.loc[err.loc.length - 1];
            validationErrors[field] = err.msg;
          });
          setErrors(validationErrors);
          
          // Si une erreur cachée bloque le formulaire, on l'affiche en global
          setGeneralError('Le serveur a refusé certaines données. Vérifiez vos informations.');
        } else {
          setGeneralError('Une erreur est survenue lors de l\'inscription');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    formData,
    errors,
    isLoading,
    generalError,
    handleInputChange,
    handleSubmit,
    navigate
  };
};