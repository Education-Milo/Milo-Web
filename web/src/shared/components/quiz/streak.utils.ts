/// Paliers qui déclenchent l'explosion plein écran
export const STREAK_MILESTONES = [3, 5, 7, 10, 15, 20, 25, 30];

export const isStreakMilestone = (streak: number) => STREAK_MILESTONES.includes(streak);

/// 0 : pas de série · 1 : 2 d'affilée · 2 : 3-4 · 3 : 5 et plus (en feu)
export const streakTier = (streak: number) =>
	streak >= 5 ? 3 : streak >= 3 ? 2 : streak >= 2 ? 1 : 0;
