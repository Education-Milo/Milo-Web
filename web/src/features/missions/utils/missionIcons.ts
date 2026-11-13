import type { Emoji3DName } from "@features/landing/data/landing.data";
import type { DailyMission } from "@shared/types/missions";

/** Icône 3D (Fluent) par type d'événement suivi par la mission */
const ICONS_BY_EVENT: Record<string, Emoji3DName> = {
	qcm_completed: "bullseye",
	qcm_perfect: "glowing_star",
	qcm_questions: "hundred_points",
	lesson_generated: "books",
	lesson_read: "graduation_cap",
	lesson_question: "speech_balloon",
	duel_finished: "crossed_swords",
	duel_won: "trophy",
	ocr_import: "card_index_dividers",
	friend_accepted: "student",
	free_chat: "speech_balloon",
};

const ICONS_BY_DIFFICULTY: Record<DailyMission["difficulty"], Emoji3DName> = {
	easy: "bullseye",
	medium: "high_voltage",
	hard: "fire",
	bonus: "party_popper",
};

export const getMissionIcon = (mission: DailyMission): Emoji3DName =>
	ICONS_BY_EVENT[mission.event_type] ?? ICONS_BY_DIFFICULTY[mission.difficulty] ?? "bullseye";

/** Nombre de flammes (1 à 3) pour dire la difficulté sans étiquette */
export const DIFFICULTY_LEVEL: Record<DailyMission["difficulty"], number> = {
	easy: 1,
	medium: 2,
	hard: 3,
	bonus: 3,
};

export const DIFFICULTY_LABEL: Record<DailyMission["difficulty"], string> = {
	easy: "Facile",
	medium: "Moyenne",
	hard: "Difficile",
	bonus: "Bonus",
};

/** Récompense en texte court (panneau des missions de l'accueil) */
export const formatMissionReward = (mission: DailyMission) =>
	`+${mission.reward_xp} XP · +${mission.reward_coins} miloros`;
