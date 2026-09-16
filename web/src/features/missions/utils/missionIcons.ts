import type { DailyMission } from "@shared/types/missions";

const ICONS_BY_EVENT: Record<string, string> = {
	qcm_completed: "🎯",
	qcm_perfect: "🌟",
	qcm_questions: "✅",
	lesson_generated: "📚",
	lesson_read: "📖",
	lesson_question: "❓",
	duel_finished: "⚔️",
	duel_won: "🏆",
	ocr_import: "📄",
	friend_accepted: "🤝",
	free_chat: "💬",
};

const ICONS_BY_DIFFICULTY: Record<DailyMission["difficulty"], string> = {
	easy: "🎯",
	medium: "⚡",
	hard: "🔥",
	bonus: "🎁",
};

export const getMissionIcon = (mission: DailyMission) =>
	ICONS_BY_EVENT[mission.event_type] ??
	ICONS_BY_DIFFICULTY[mission.difficulty] ??
	"🎯";

export const formatMissionReward = (mission: DailyMission) =>
	`+${mission.reward_xp} XP · +${mission.reward_coins} coins`;
