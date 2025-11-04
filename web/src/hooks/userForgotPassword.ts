import { ROUTES } from '@constants/routes';
import { useAuthStore } from '@store/auth/auth.store';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type UseForgotPasswordReturn = {
  email: string;
  setEmail: (value: string) => void;
  emailError: string;
  isSubmitted: boolean;
  handleSubmit: () => void;
  handleBackToLogin: () => void;
  resend: () => void;
  canResend: boolean;
  resendCountdown: number;
  isLoading: boolean;
};

export default function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmailState] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const forgotPassword = useAuthStore(state => state.forgetPassword);
  const navigate = useNavigate();

  const setEmail = (value: string) => {
    setEmailError('');
    setEmailState(value);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const handleSubmit = () => {
    setEmailError('');
    setIsLoading(true);

    if (!email.trim()) {
      setEmailError("L'email est requis");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      setEmailError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  const startCooldown = () => {
    setCanResend(false);
    setResendCountdown(60); // 60 secondes
  };

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendCountdown, canResend]);

  const resend = () => {
    if (!canResend) return;
    forgotPassword(email);
    startCooldown();
  };

  return {
    email,
    setEmail,
    emailError,
    isSubmitted,
    handleSubmit,
    handleBackToLogin,
    resend,
    canResend,
    resendCountdown,
    isLoading
  };
}


