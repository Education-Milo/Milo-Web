import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../store/authService';
import { useUserStore } from '../store/user/user.store';

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
  const { user, getMe } = useUserStore();
  
  // État pour l'élément de navigation actif
  const [activeNav, setActiveNav] = useState('Profil');
  
  // État pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  
  // Référence pour l'input file
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Données en dur commentées - à remplacer par les vraies données utilisateur
  // const [profile, setProfile] = useState<UserProfile>({
  //   firstName: 'Titouan',
  //   lastName: 'Dupont',
  //   email: 'titouan.dupont@email.com',
  //   dateOfBirth: '2005-03-15',
  //   level: 'Expert',
  //   bio: 'Passionné d\'apprentissage et toujours prêt à relever de nouveaux défis !',
  //   profilePicture: null
  // });

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

  // Fonction pour gérer la navigation
  const handleNavigation = (page: string) => {
    setActiveNav(page);
    // Navigation vers les différentes pages
    switch (page) {
      case 'Accueil':
        navigate('/home');
        break;
      case 'Cours':
        navigate('/courses'); // À créer si nécessaire
        break;
      case 'Missions':
        navigate('/missions'); // À créer si nécessaire
        break;
      case 'Duels':
        navigate('/duels'); // À créer si nécessaire
        break;
      case 'Profil':
        navigate('/profile');
        break;
      default:
        navigate('/home');
    }
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
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
    activeNav,
    isEditing,
    profile,
    tempProfile,
    user,
    
    // Références
    fileInputRef,
    
    // Fonctions de gestion
    handleNavigation,
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
