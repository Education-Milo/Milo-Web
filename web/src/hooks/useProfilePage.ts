import { useState, useEffect } from 'react';
import { useUserStore } from '@store/user/user.store';
import type { UserProfile } from '@/store/user/user.model';

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

  const handleSave = async () => {
    if (!tempProfile.first_name.trim() || !tempProfile.last_name.trim()) {
      alert("Le nom et le prénom ne peuvent pas être vides.");
      return;
    }
    try {
      await updateUser({
        first_name: tempProfile.first_name,
        last_name: tempProfile.last_name,
        classe: tempProfile.classe,
      });
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
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  return {
    isEditing,
    profile,
    tempProfile,
    user,
    handleInputChange,
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
