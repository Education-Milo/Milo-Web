import { useEffect, useMemo, useState } from 'react';
import { useUserStore } from '@shared/store/user/user.store';
import type { UserProfile } from '@shared/store/user/user.model';

export interface PasswordFormData {
  new_password: string;
  confirm_password: string;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const EMPTY_PASSWORD_FORM: PasswordFormData = {
  new_password: '',
  confirm_password: '',
};

const MIN_PASSWORD_LENGTH = 8;

const INTEREST_SUGGESTIONS = [
  'Jeux Vidéo',
  'Football',
  'Mangas',
  'Histoire',
  'Musique',
  'Sciences',
];

export const useProfilePage = () => {
  const {
    user,
    getMe,
    updateUser,
    addUserInterest,
    deleteUserInterest,
    loading,
  } = useUserStore();

  const [newInterest, setNewInterest] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    classe: user?.classe,
    username: user?.username || '',
  });
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [passwordData, setPasswordData] =
    useState<PasswordFormData>(EMPTY_PASSWORD_FORM);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        await getMe();
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };
    if (!user) {
      loadUserData();
    } else {
      const updatedProfile: UserProfile = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        classe: user.classe || '',
        username: user.username || '',
      };
      setProfile(updatedProfile);
      setTempProfile(updatedProfile);
    }
  }, [user, getMe]);

  // Le badge "Enregistré" se referme tout seul.
  useEffect(() => {
    if (saveState !== 'saved') return;
    const timeout = setTimeout(() => setSaveState('idle'), 2600);
    return () => clearTimeout(timeout);
  }, [saveState]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormError(null);
    setSaveState('idle');
    setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setFormError(null);
    setSaveState('idle');
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // L'utilisateur veut-il changer son mot de passe ?
  // (au moins un des deux champs rempli)
  const wantsPasswordChange =
    passwordData.new_password.length > 0 ||
    passwordData.confirm_password.length > 0;

  /** Validation live affichée sous les champs (plus d'alert bloquante). */
  const passwordChecks = useMemo(
    () => ({
      active: wantsPasswordChange,
      length: passwordData.new_password.length >= MIN_PASSWORD_LENGTH,
      match:
        passwordData.new_password.length > 0 &&
        passwordData.new_password === passwordData.confirm_password,
    }),
    [passwordData, wantsPasswordChange],
  );

  /** Y a-t-il quelque chose à enregistrer ? Pilote la barre flottante. */
  const isDirty = useMemo(
    () =>
      tempProfile.first_name !== profile.first_name ||
      tempProfile.last_name !== profile.last_name ||
      tempProfile.classe !== profile.classe ||
      wantsPasswordChange,
    [tempProfile, profile, wantsPasswordChange],
  );

  /** Retourne un message d'erreur, ou null si le formulaire est valide. */
  const validateForm = (): string | null => {
    if (!tempProfile.first_name.trim() || !tempProfile.last_name.trim()) {
      return 'Le nom et le prénom ne peuvent pas être vides.';
    }
    if (wantsPasswordChange) {
      if (!passwordChecks.length) {
        return `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
      }
      if (!passwordChecks.match) {
        return 'La confirmation ne correspond pas au nouveau mot de passe.';
      }
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      setSaveState('error');
      return;
    }

    setFormError(null);
    setSaveState('saving');

    try {
      await updateUser({
        first_name: tempProfile.first_name,
        last_name: tempProfile.last_name,
        classe: tempProfile.classe,
        // Même route que le reste du profil : la clé `password` n'est
        // incluse que si l'utilisateur a saisi un nouveau mot de passe,
        // pour ne pas écraser l'existant avec une chaîne vide.
        ...(wantsPasswordChange && { password: passwordData.new_password }),
      });
      setPasswordData(EMPTY_PASSWORD_FORM);
      setSaveState('saved');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde :', error);
      setFormError("La sauvegarde a échoué. Réessaie dans un instant.");
      setSaveState('error');
    }
  };

  /** Annule les modifications en cours et revient à l'état serveur. */
  const handleReset = () => {
    setTempProfile(profile);
    setPasswordData(EMPTY_PASSWORD_FORM);
    setFormError(null);
    setSaveState('idle');
  };

  const handleAdd = async (interestName?: string) => {
    const nameToProcess = interestName || newInterest;
    if (!nameToProcess.trim()) return;

    try {
      await addUserInterest(nameToProcess);
      if (!interestName) {
        setNewInterest('');
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  const interests = user?.Interests ?? [];

  /** On ne propose que ce que l'utilisateur n'a pas déjà. */
  const suggestions = useMemo(() => {
    const owned = interests.map(i => i.name.trim().toLowerCase());
    return INTEREST_SUGGESTIONS.filter(s => !owned.includes(s.toLowerCase()));
  }, [interests]);

  return {
    profile,
    tempProfile,
    passwordData,
    passwordChecks,
    user,
    interests,
    suggestions,
    newInterest,
    setNewInterest,
    handleInputChange,
    handlePasswordChange,
    handleSave,
    handleReset,
    handleAdd,
    handleDelete: deleteUserInterest,
    isDirty,
    saveState,
    formError,
    isLoading: loading,
  };
};