import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@shared/store/auth/auth.store';
import { ROUTES } from '@shared/constants/routes';

export type ForgotPasswordStep = 'email' | 'code' | 'password';

export const CODE_LENGTH = 6;
export const CODE_VALIDITY_SECONDS = 15 * 60;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MIN_PASSWORD_LENGTH = 8;
/** Limite bcrypt côté serveur. */
const MAX_PASSWORD_BYTES = 72;

export const NEUTRAL_SENT_MESSAGE =
  'Si un compte existe pour cet email, un code vient d\'être envoyé.';
const RATE_LIMIT_MESSAGE = 'Trop de tentatives, réessaie dans une minute.';
const NETWORK_MESSAGE = 'Impossible de joindre le serveur, réessaie dans un instant.';
export const RESET_SUCCESS_MESSAGE =
  'Ton mot de passe a été modifié. Connecte-toi avec le nouveau.';

const getDetail = (error: unknown): string | null => {
  if (!isAxiosError(error)) return null;
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((d) => (typeof d === 'string' ? d : d?.msg))
      .filter(Boolean);
    if (messages.length) return messages.join(' · ');
  }
  return null;
};

const byteLength = (value: string) => new TextEncoder().encode(value).length;

export default function useForgotPassword() {
  const navigate = useNavigate();
  const forgetPassword = useAuthStore((state) => state.forgetPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmailState] = useState('');
  const [code, setCodeState] = useState('');
  const [newPassword, setNewPasswordState] = useState('');
  const [confirmPassword, setConfirmPasswordState] = useState('');

  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Compte à rebours de validité du code et délai avant renvoi
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (step === 'email') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [step]);

  const codeRemainingSeconds =
    codeExpiresAt === null ? null : Math.max(0, Math.ceil((codeExpiresAt - now) / 1000));
  const resendRemainingSeconds =
    resendAvailableAt === null ? 0 : Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  const isCodeExpired = codeRemainingSeconds === 0;
  const canResend = resendRemainingSeconds === 0 && !isLoading;

  const setEmail = (value: string) => {
    setEmailError('');
    setEmailState(value);
  };

  const setCode = (value: string) => {
    setCodeError('');
    setCodeState(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
  };

  const setNewPassword = (value: string) => {
    setPasswordError('');
    setNewPasswordState(value);
  };

  const setConfirmPassword = (value: string) => {
    setPasswordError('');
    setConfirmPasswordState(value);
  };

  const markCodeSent = useCallback(() => {
    const sentAt = Date.now();
    setNow(sentAt);
    setCodeExpiresAt(sentAt + CODE_VALIDITY_SECONDS * 1000);
    setResendAvailableAt(sentAt + RESEND_COOLDOWN_SECONDS * 1000);
    setCodeState('');
    setCodeError('');
    setInfoMessage(NEUTRAL_SENT_MESSAGE);
  }, []);

  /** Étape 1 : demande d'un code. Réponse neutre quoi qu'il arrive. */
  const requestCode = async (): Promise<boolean> => {
    setEmailError('');
    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError("L'email est requis");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Entre une adresse email valide');
      return false;
    }

    setIsLoading(true);
    try {
      await forgetPassword(trimmed);
      return true;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 429) {
        setEmailError(RATE_LIMIT_MESSAGE);
        return false;
      }
      if (isAxiosError(error) && !error.response) {
        setEmailError(NETWORK_MESSAGE);
        return false;
      }
      // Toute autre réponse : on ne révèle rien sur l'existence du compte
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEmail = async () => {
    const ok = await requestCode();
    if (!ok) return;
    markCodeSent();
    setStep('code');
  };

  /** Étape 2 : "Renvoyer un code" (invalide le précédent côté serveur). */
  const resendCode = async () => {
    if (!canResend) return;
    setCodeError('');
    const ok = await requestCode();
    if (!ok) {
      // L'erreur (429, réseau) est portée par emailError : on la remonte sur l'étape code
      setCodeError((current) => current || RATE_LIMIT_MESSAGE);
      return;
    }
    markCodeSent();
  };

  /** Étape 2 → 3 : validation locale du format du code. */
  const handleSubmitCode = () => {
    setCodeError('');
    if (code.length !== CODE_LENGTH) {
      setCodeError(`Le code fait ${CODE_LENGTH} chiffres.`);
      return;
    }
    if (isCodeExpired) {
      setCodeError('Ce code a expiré, demande-en un nouveau.');
      return;
    }
    setStep('password');
  };

  /** Étape 3 : nouveau mot de passe puis POST /password/reset. */
  const handleSubmitPassword = async () => {
    setPasswordError('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (byteLength(newPassword) > MAX_PASSWORD_BYTES) {
      setPasswordError('Le mot de passe est trop long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim(), code, newPassword);
      // Aucune connexion automatique : les anciens jetons sont révoqués
      navigate(ROUTES.LOGIN, { replace: true, state: { message: RESET_SUCCESS_MESSAGE } });
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400) {
        // Code faux, expiré, déjà utilisé ou brûlé : retour à l'étape du code
        setCodeState('');
        setCodeError(getDetail(error) ?? 'Code invalide ou expiré');
        setStep('code');
      } else if (status === 422) {
        setPasswordError(getDetail(error) ?? 'Vérifie le code et le mot de passe.');
      } else if (status === 429) {
        setPasswordError(RATE_LIMIT_MESSAGE);
      } else if (isAxiosError(error) && !error.response) {
        setPasswordError(NETWORK_MESSAGE);
      } else {
        setPasswordError(getDetail(error) ?? 'Une erreur est survenue, réessaie dans un instant.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToStep = (target: ForgotPasswordStep) => {
    setPasswordError('');
    setCodeError('');
    setStep(target);
  };

  const handleBackToLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  return {
    step,
    email,
    setEmail,
    emailError,
    code,
    setCode,
    codeError,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    infoMessage,
    isLoading,
    codeRemainingSeconds,
    isCodeExpired,
    resendRemainingSeconds,
    canResend,
    handleSubmitEmail,
    resendCode,
    handleSubmitCode,
    handleSubmitPassword,
    goToStep,
    handleBackToLogin,
  };
}
