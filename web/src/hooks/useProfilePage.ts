import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth/auth.store';
import { useUserStore } from '../store/user/user.store';
import { ROUTES } from '@constants/routes';

// Interface pour les informations utilisateur du profil
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  level: string;
  bio: string;
  profilePicture: string | null;
}

export const useProfilePage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { user, getMe } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Référence pour l'input file
  const fileInputRef = useRef<HTMLInputElement>(null);


  // État pour les informations du profil - maintenant basé sur les données utilisateur
  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.prenom || '',
    lastName: user?.nom || '',
    email: user?.email || '',
    dateOfBirth: '2005-03-15', // Pas encore disponible dans le modèle User
    level: user?.level?.toString() || '1',
    bio: 'Passionné d\'apprentissage et toujours prêt à relever de nouveaux défis !', // Pas encore disponible dans le modèle User
    profilePicture: null // Pas encore disponible dans le modèle User
  });

  // État temporaire pour l'édition
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

  // Charger les données utilisateur au montage du composant
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

  // Mettre à jour le profil quand les données utilisateur changent
  useEffect(() => {
    if (user) {
      const updatedProfile: UserProfile = {
        firstName: user.prenom || '',
        lastName: user.nom || '',
        email: user.email || '',
        dateOfBirth: '2005-03-15', // Pas encore disponible dans le modèle User
        level: user.level?.toString() || '1',
        bio: 'Passionné d\'apprentissage et toujours prêt à relever de nouveaux défis !', // Pas encore disponible dans le modèle User
        profilePicture: null // Pas encore disponible dans le modèle User
      };
      setProfile(updatedProfile);
      setTempProfile(updatedProfile);
    }
  }, [user]);

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  // Fonction pour gérer le changement des champs
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour gérer l'upload de photo
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempProfile(prev => ({
          ...prev,
          profilePicture: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour sauvegarder les modifications
  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
    // TODO: Implémenter la sauvegarde via l'API
    console.log('Sauvegarde du profil:', tempProfile);
  };

  // Fonction pour annuler les modifications
  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  // Fonction pour déclencher l'upload de photo
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // Fonction pour activer le mode édition
  const startEditing = () => {
    setIsEditing(true);
  };

  return {
    // États
    isEditing,
    profile,
    tempProfile,
    user,
    
    // Références
    fileInputRef,
    
    // Fonctions de gestion
    handleLogout,
    handleInputChange,
    handlePhotoUpload,
    handleSave,
    handleCancel,
    triggerPhotoUpload,
    startEditing,
    
    // Fonctions utilitaires
    setIsEditing
  };
};
