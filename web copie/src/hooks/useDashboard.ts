import { useState, useEffect } from 'react';
import { useUserStore } from '@store/user/user.store';

export const useDashboard = () => {
  const user = useUserStore(state => state.user);

  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<number | null>(null);

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
    handleSelectChild,
    handleViewDetails
  };
};

