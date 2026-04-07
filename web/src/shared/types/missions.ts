export interface DailyMission {
  id: string;
  icon: string;
  title: string;
  progressCurrent: number;
  progressTotal: number;
  rewardPoints: number;
}

export interface MonthlyChallenge {
  title: string;
  daysLeft: number;
  questsCurrent: number;
  questsTotal: number;
}

export interface MonthlyBadge {
  id: string;
  month: string;
  monthIndex: number;
  year: number;
  imageUrl: string | null;
  status: 'earned' | 'missed' | 'in-progress' | 'locked';
}