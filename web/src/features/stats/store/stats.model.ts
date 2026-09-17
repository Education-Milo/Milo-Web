export type StatsPeriodDays = 7 | 30 | 90;

export interface StatsTotals {
	time_seconds: number;
	active_days: number;
	lessons_read: number;
	qcm_completed: number;
	questions_asked: number;
	chat_messages: number;
	duels_played: number;
	duels_won: number;
	duels_perfect: number;
	courses_scanned: number;
	missions_completed: number;
}

export interface StatsQcm {
	attempts: number;
	questions_answered: number;
	avg_score_pct: number | null;
	perfect: number;
	best_streak: number;
}

export interface StatsBySubject {
	subject: string;
	time_seconds: number;
	lessons_read: number;
	qcm_attempts: number;
	avg_score_pct: number | null;
	last_activity: string | null;
}

export interface StatsByDay {
	date: string;
	time_seconds: number;
	activities: number;
	qcm_attempts: number;
	avg_score_pct: number | null;
}

/** GET /tracking/stats/me */
export interface StatsResponse {
	period: { days: number; from: string; to: string };
	streak: number;
	xp: number;
	coins: number;
	totals: StatsTotals;
	qcm: StatsQcm;
	by_subject: StatsBySubject[];
	strengths: string[];
	weaknesses: string[];
	by_day: StatsByDay[];
}

export type PerformanceKind = "qcm" | "exercise" | "duel";

/** Élément de GET /tracking/performance/me */
export interface PerformanceItem {
	id: string;
	kind: PerformanceKind;
	subject: string | null;
	lesson: string | null;
	lesson_id: number | null;
	score: number;
	max_score: number;
	best_streak: number;
	duration_seconds: number;
	created_at: string;
}

export type ActivityType =
	| "lesson_read"
	| "lesson_question"
	| "qcm_generated"
	| "qcm_completed"
	| "exercise_completed"
	| "duel_finished"
	| "course_scanned"
	| "report_card_scanned"
	| "free_chat"
	| "friend_accepted";

/** Élément de GET /tracking/activity/me */
export interface ActivityItem {
	id: string;
	activity_type: ActivityType | string;
	subject: string | null;
	lesson_id: number | null;
	duration_seconds: number;
	source: "server";
	details: Record<string, unknown>;
	created_at: string;
}

export interface PerformanceFilters {
	days?: number;
	subject?: string;
	kind?: PerformanceKind;
	limit?: number;
}
