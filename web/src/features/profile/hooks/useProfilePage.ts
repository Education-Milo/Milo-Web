import { useState, useEffect } from 'react';
import { useUserStore } from '@shared/store/user/user.store';
import type { UserProfile } from '@shared/store/user/user.model';

export interface PasswordFormData {
  new_password: string;
  confirm_password: string;
}

const EMPTY_PASSWORD_FORM: PasswordFormData = {
  new_password: '',
  confirm_password: '',
};

const MIN_PASSWORD_LENGTH = 8;

export const useProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, getMe, updateUser, addUserInterest, deleteUserInterest, loading } = useUserStore();
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

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // L'utilisateur veut-il changer son mot de passe ?
  // (au moins un des deux champs rempli)
  const wantsPasswordChange =
    passwordData.new_password.length > 0 ||
    passwordData.confirm_password.length > 0;

  /** Retourne un message d'erreur, ou null si la section mot de passe est valide. */
  const validatePasswordForm = (): string | null => {
    const { new_password, confirm_password } = passwordData;

    if (new_password.length < MIN_PASSWORD_LENGTH) {
      return `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    }
    if (new_password !== confirm_password) {
      return 'La confirmation ne correspond pas au nouveau mot de passe.';
    }
    return null;
  };

  const handleSave = async () => {
    if (!tempProfile.first_name.trim() || !tempProfile.last_name.trim()) {
      alert("Le nom et le prénom ne peuvent pas être vides.");
      return;
    }

    // Validation du mot de passe AVANT tout envoi :
    // si la section est remplie mais invalide, on bloque tout.
    if (wantsPasswordChange) {
      const passwordError = validatePasswordForm();
      if (passwordError) {
        alert(passwordError);
        return;
      }
    }

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
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
    }
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

  const handleCancel = () => {
    setTempProfile(profile);
    setPasswordData(EMPTY_PASSWORD_FORM);
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  return {
    isEditing,
    profile,
    tempProfile,
    passwordData,
    user,
    handleInputChange,
    handlePasswordChange,
    handleSave,
    handleCancel,
    startEditing,
    setIsEditing,
    newInterest,
    setNewInterest,
    handleAdd,
    handleDelete: deleteUserInterest,
    isLoading: loading,
  };
};