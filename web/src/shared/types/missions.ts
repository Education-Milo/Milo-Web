export type MissionDifficulty = "easy" | "medium" | "hard" | "bonus";

/** Mission quotidienne telle que renvoyée par GET /missions/today. */
export interface DailyMission {
  id: number;
  key: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  event_type: string;
  target: number;
  progress: number;
  is_completed: boolean;
  completed_at: string | null;
  reward_xp: number;
  reward_coins: number;
  is_bonus: boolean;
  is_reroll: boolean;
}

export interface DailyMissionsResponse {
  date: string;
  /** Secondes restantes avant le tirage des missions du lendemain. */
  reset_in_seconds: number;
  reroll_available: boolean;
  /** Missions normales terminées (hors bonus). */
  completed: number;
  /** Nombre de missions normales (hors bonus). */
  total: number;
  missions: DailyMission[];
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
