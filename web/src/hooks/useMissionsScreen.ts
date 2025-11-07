import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@store/user/user.store';
import { useAuthStore } from '@store/auth/auth.store';
import type { DailyMission, MonthlyChallenge, MonthlyBadge } from '@types/missions';

// Types pour nos données de mission (DailyMission & MonthlyChallenge restent les mêmes)

// Données statiques (à remplacer par un appel API)
const mockDailyMissions: DailyMission[] = [
  { id: '1', icon: '⚡', title: 'Gagne 30 XP', progressCurrent: 10, progressTotal: 30, rewardPoints: 20 },
  { id: '2', icon: '🎯', title: 'Termine 2 leçons parfaites', progressCurrent: 1, progressTotal: 2, rewardPoints: 15 },
  { id: '3', icon: '⏰', title: 'Apprends pendant 15 minutes', progressCurrent: 5, progressTotal: 15, rewardPoints: 10 },
];

const mockMonthlyChallenge: MonthlyChallenge = {
  title: 'L\'aventure de Novembre',
  daysLeft: 26,
  questsCurrent: 4,
  questsTotal: 35,
};

// NOUVEAU : Données pour les badges (inspirées de votre screenshot)
const mockBadgeData: MonthlyBadge[] = [
  // 2025 (Supposons que nous sommes en Novembre 2025)
  { id: '25-01', month: 'Janvier', monthIndex: 0, year: 2025, imageUrl: 'badges/badge1.png', status: 'earned' },
  { id: '25-02', month: 'Février', monthIndex: 1, year: 2025, imageUrl: 'badges/badge2.png', status: 'missed' },
  { id: '25-03', month: 'Mars', monthIndex: 2, year: 2025, imageUrl: 'badges/badge4.png', status: 'missed' },
  { id: '25-04', month: 'Avril', monthIndex: 3, year: 2025, imageUrl: 'badges/badge3.png', status: 'earned' },
  { id: '25-05', month: 'Mai', monthIndex: 4, year: 2025, imageUrl: 'badges/badge1.png', status: 'earned' },
  { id: '25-06', month: 'Juin', monthIndex: 5, year: 2025, imageUrl: 'badges/badge3.png', status: 'missed' },
  { id: '25-07', month: 'Juillet', monthIndex: 6, year: 2025, imageUrl: 'badges/badge4.png', status: 'earned' },
  { id: '25-08', month: 'Août', monthIndex: 7, year: 2025, imageUrl: 'badges/badge2.png', status: 'missed' },
  { id: '25-09', month: 'Septembre', monthIndex: 8, year: 2025, imageUrl: 'badges/badge5.png', status: 'earned' },
  { id: '25-10', month: 'Octobre', monthIndex: 9, year: 2025, imageUrl: 'badges/badge6.png', status: 'earned' },
  { id: '25-11', month: 'Novembre', monthIndex: 10, year: 2025, imageUrl: 'badges/badge6.png', status: 'in-progress' },
  { id: '25-12', month: 'Décembre', monthIndex: 11, year: 2025, imageUrl: null, status: 'locked' },
];


export const useMissionsScreen = () => {
  const navigate = useNavigate();
  
  const user = useUserStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const handleNavigation = (page: string) => {
    switch (page) {
      case 'Accueil': navigate('/home'); break;
      case 'Cours': navigate('/courses'); break;
      case 'Missions': navigate('/missions'); break;
      case 'Duels': navigate('/duels'); break;
      default: navigate('/home'); break;
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login', { replace: true });
  };

  // NOUVEAU : Logique pour grouper et trier les badges
  const badgesByYear = mockBadgeData.reduce((acc, badge) => {
    const year = badge.year.toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(badge);
    return acc;
  }, {} as Record<string, MonthlyBadge[]>);

  // Trie les années (ex: 2025 avant 2024)
  const sortedYears = Object.keys(badgesByYear).sort((a, b) => Number(b) - Number(a));

  // Trie les badges dans chaque année (Janvier avant Février)
  for (const year of sortedYears) {
    badgesByYear[year].sort((a, b) => a.monthIndex - b.monthIndex);
  }

  return {
    user,
    handleNavigation,
    handleLogout,
    dailyMissions: mockDailyMissions,
    monthlyChallenge: mockMonthlyChallenge,
    badgesByYear, // Renvoie les badges groupés
    sortedYears,  // Renvoie les clés d'année triées
  };
};