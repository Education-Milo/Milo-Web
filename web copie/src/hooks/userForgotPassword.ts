import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type UseForgotPasswordReturn = {
  email: string;
  setEmail: (value: string) => void;
  emailError: string;
  isSubmitted: boolean;
  handleSubmit: () => void;
  handleBackToLogin: () => void;
  resend: () => void;
};

export default function useForgotPassword(): UseForgotPasswordReturn {
  const [email, setEmailState] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const setEmail = (value: string) => {
    setEmailError('');
    setEmailState(value);
  };

  const handleSubmit = () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError("L'email est requis");
      return;
    }

    if (!email.includes('@')) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }
    setIsSubmitted(true);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const resend = () => {
    setIsSubmitted(false);
  };

  return {
    email,
    setEmail,
    emailError,
    isSubmitted,
    handleSubmit,
    handleBackToLogin,
    resend,
  };
}


