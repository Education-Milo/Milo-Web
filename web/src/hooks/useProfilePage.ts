import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import { useUserStore } from '@store/user/user.store';
import { ROUTES } from '@constants/routes';
import type { UserProfile } from '@/store/user/user.model';

export const useProfilePage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, getMe } = useUserStore();
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    classe: user?.classe,
  });
  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>(profile);

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
    }
  }, [user, getMe]);

  useEffect(() => {
    if (user) {
      const updatedProfile: UserProfile = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || '',
        classe: user.classe || '',
      };
      setProfile(updatedProfile);
      setTempProfile(updatedProfile);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  return {
    isEditing,
    profile,
    tempProfile,
    user,
    fileInputRef,
    handleLogout,
    handleInputChange,
    handleSave,
    handleCancel,
    triggerPhotoUpload,
    startEditing,
    setIsEditing
  };
};
