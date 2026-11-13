import { useEffect, useMemo, useState } from 'react';
import { useUserStore } from '@shared/store/user/user.store';
import type { UserProfile } from '@shared/store/user/user.model';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export const useProfilePage = () => {
  const {
    user,
    getMe,
    updateUser,
    loading,
  } = useUserStore();

  const [profile, setProfile] = useState<UserProfile>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    classe: user?.classe,
    username: user?.username || '',
  });
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
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

  /** Y a-t-il quelque chose à enregistrer ? Pilote la barre flottante. */
  const isDirty = useMemo(
    () =>
      tempProfile.first_name !== profile.first_name ||
      tempProfile.last_name !== profile.last_name ||
      tempProfile.classe !== profile.classe,
    [tempProfile, profile],
  );

  /** Retourne un message d'erreur, ou null si le formulaire est valide. */
  const validateForm = (): string | null => {
    if (!tempProfile.first_name.trim() || !tempProfile.last_name.trim()) {
      return 'Le nom et le prénom ne peuvent pas être vides.';
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
      // Email et mot de passe sont ceux du compte : PUT /users/{id} les
      // ignore, ils passent par /account/email et /account/password.
      await updateUser({
        first_name: tempProfile.first_name,
        last_name: tempProfile.last_name,
        classe: tempProfile.classe,
      });
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
    setFormError(null);
    setSaveState('idle');
  };

  return {
    profile,
    tempProfile,
    user,
    handleInputChange,
    handleSave,
    handleReset,
    isDirty,
    saveState,
    formError,
    isLoading: loading,
  };
};