import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth/auth.store';
import { useUserStore } from '@store/user/user.store';
import { ROUTES } from '@constants/routes';

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
  const logout = useAuthStore(state => state.logout);
  const { user, getMe } = useUserStore();
  const navigate = useNavigate();

  const [welcomeMessage, setWelcomeMessage] = useState('Bon retour, champion ! 🎉');
  const [missions, setMissions] = useState<Mission[]>([]);

  const completedMissionsCount = missions.filter(m => m.status === 'completed').length;

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

  useEffect(() => {
    if (!user) {
      getMe();
    }
  }, [user, getMe]);

  const handleMissionClick = (missionId: number) => {
    setMissions(prevMissions =>
      prevMissions.map(mission =>
        mission.id === missionId && mission.status === 'pending'
          ? { ...mission, status: 'completed', description: 'Mission accomplie avec brio !' }
          : mission
      )
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleMiloClick = () => {
    navigate(ROUTES.MILO);
  };

  return {
    welcomeMessage,
    missions,
    completedMissionsCount,
    user,
    handleMissionClick,
    handleLogout,
    handleMiloClick,
  };
};
