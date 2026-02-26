import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';
import { useAuthStore } from '@store/auth/auth.store';

export const useDashboard = () => {
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

  // Enfants fictifs pour la démo (à remplacer par un appel API réel)
  const children = [
    {
      id: 1,
      name: 'Emma',
      level: 5,
      points: 1250,
      streak: 7,
      progress: 75,
      avatar: '👧'
    },
    {
      id: 2,
      name: 'Lucas',
      level: 3,
      points: 850,
      streak: 3,
      progress: 45,
      avatar: '👦'
    }
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
      greeting = 'Bonjour';
    } else if (hour < 18) {
      greeting = 'Bon après-midi';
    } else {
      greeting = 'Bonsoir';
    }
    
    if (user?.first_name) {
      setWelcomeMessage(`${greeting}, ${user.first_name}`);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleSelectChild = (childId: number) => {
    setSelectedChild(childId === selectedChild ? null : childId);
  };

  const handleViewDetails = (childId: number) => {
    // Navigation vers la page de détails de l'enfant
    console.log('Voir détails pour enfant:', childId);
    // navigate(`/child/${childId}`);
  };

  return {
    welcomeMessage,
    user,
    children,
    selectedChild,
    handleLogout,
    handleSelectChild,
    handleViewDetails
  };
};

