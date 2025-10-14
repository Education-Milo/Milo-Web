import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import { useUserStore } from '@store/user/user.store';

// Type pour définir la structure d'une mission
export interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  status: 'completed' | 'pending';
}

export const useHomePage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const { user, getMe } = useUserStore();
  
  // État pour le message d'accueil dynamique
  const [welcomeMessage, setWelcomeMessage] = useState('Bon retour, champion ! 🎉');
  
  // État pour l'élément de navigation actif
  const [activeNav, setActiveNav] = useState('Accueil');

  // État pour la liste des missions
  const [missions, setMissions] = useState<Mission[]>([
    { id: 1, title: 'Révision quotidienne', description: 'Mission accomplie avec brio !', category: 'GÉNÉRAL', points: 50, status: 'completed' },
    { id: 2, title: 'Vocabulaire anglais', description: 'Apprendre 10 nouveaux mots', category: 'ANGLAIS', points: 30, status: 'pending' },
    { id: 3, title: 'Exercices de mathématiques', description: 'Résoudre 5 problèmes de géométrie', category: 'MATHÉMATIQUES', points: 40, status: 'pending' },
  ]);

  // Calcul du nombre de missions complétées
  const completedMissionsCount = missions.filter(m => m.status === 'completed').length;

  // Effet pour mettre à jour le message d'accueil au chargement
  useEffect(() => {
    const hour = new Date().getHours();
    const firstName = user?.prenom || 'Champion';
    
    if (hour < 12) {
      setWelcomeMessage(`Bonjour, ${firstName} ! 🌅`);
    } else if (hour < 17) {
      setWelcomeMessage(`Bon après-midi, ${firstName} ! ☀️`);
    } else {
      setWelcomeMessage(`Bonsoir, ${firstName} ! 🌙`);
    }
  }, [user]);

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

  // Fonction pour gérer le clic sur une mission
  const handleMissionClick = (missionId: number) => {
    setMissions(prevMissions =>
      prevMissions.map(mission =>
        mission.id === missionId && mission.status === 'pending'
          ? { ...mission, status: 'completed', description: 'Mission accomplie avec brio !' }
          : mission
      )
    );
  };

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
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Fonction pour rediriger vers la page Milo
  const handleMiloClick = () => {
    navigate('/milo');
  };

  return {
    // États
    welcomeMessage,
    activeNav,
    missions,
    completedMissionsCount,
    user,
    
    // Fonctions de gestion
    handleMissionClick,
    handleNavigation,
    handleLogout,
    handleMiloClick,
    
    // Fonctions utilitaires
    setMissions
  };
};
