// src/types/missions.ts

// Type pour les missions quotidiennes
export interface DailyMission {
  id: string;
  icon: string;
  title: string;
  progressCurrent: number;
  progressTotal: number;
  rewardPoints: number;
}

// Type pour le défi mensuel
export interface MonthlyChallenge {
  title: string;
  daysLeft: number;
  questsCurrent: number;
  questsTotal: number;
}

// Type pour les badges mensuels
export interface MonthlyBadge {
  id: string;
  month: string;
  monthIndex: number;
  year: number;
  imageUrl: string | null;
  status: 'earned' | 'missed' | 'in-progress' | 'locked';
}