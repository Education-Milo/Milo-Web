import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/store/auth/auth.store';

type UseForgotPasswordReturn = {
  email: string;
  setEmail: (value: string) => void;
  emailError: string;
  isLoading: boolean;
  isSubmitted: boolean;
  handleSubmit: () => Promise<void>;
  handleBackToLogin: () => void;
  resend: () => Promise<void>;
};

export default function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmailState] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const forgetPassword = useAuthStore((state) => state.forgetPassword);

  const setEmail = (value: string) => {
    setEmailError('');
    setEmailState(value);
  };

  const getErrorMessage = (error: any) => {
    const detail = error?.response?.data?.detail;

    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;

    return "Impossible d'envoyer l'email de réinitialisation pour le moment";
  };

  const handleSubmit = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError("L'email est requis");
      return;
    }

    if (!email.includes('@')) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setIsLoading(true);
      await forgetPassword(email.trim());
      setIsSubmitted(true);
    } catch (error) {
      setEmailError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const resend = async () => {
    await handleSubmit();
  };

  return {
    email,
    setEmail,
    emailError,
    isLoading,
    isSubmitted,
    handleSubmit,
    handleBackToLogin,
    resend,
  };
}

