import type { ActivityItem, PerformanceKind } from "@features/stats/store/stats.model";

/** 7260 → "2 h 01", 540 → "9 min", 0 → "0 min" */
export const formatDuration = (seconds: number): string => {
	const total = Math.max(0, Math.round(seconds));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")}`;
	if (minutes > 0) return `${minutes} min`;
	return total > 0 ? "< 1 min" : "0 min";
};

/** Minutes entières, pour les axes. */
export const toMinutes = (seconds: number) => Math.round(seconds / 60);

/** Les dates de l'API sont en UTC sans suffixe : on l'ajoute avant de parser. */
export const parseApiDate = (value: string): Date => {
	const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
	return new Date(hasZone ? value : `${value}Z`);
};

const relativeFormatter = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

/** "il y a 2 h", "hier", "il y a 3 j" */
export const formatRelativeDate = (value: string, now: Date = new Date()): string => {
	const date = parseApiDate(value);
	if (Number.isNaN(date.getTime())) return "";
	const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
	const abs = Math.abs(diffSeconds);
	if (abs < 60) return "à l'instant";
	if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
	if (abs < 86400) return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
	if (abs < 86400 * 30) return relativeFormatter.format(Math.round(diffSeconds / 86400), "day");
	return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/** "2026-09-17" → "17 sept." */
export const formatDayLabel = (isoDay: string): string => {
	const [year, month, day] = isoDay.split("-").map(Number);
	const date = new Date(year, (month ?? 1) - 1, day ?? 1);
	return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/** "2026-09-17" → "mercredi 17 septembre" */
export const formatDayLong = (isoDay: string): string => {
	const [year, month, day] = isoDay.split("-").map(Number);
	const date = new Date(year, (month ?? 1) - 1, day ?? 1);
	return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

export const formatPercent = (value: number | null | undefined): string =>
	typeof value === "number" ? `${Math.round(value)} %` : "—";

export const KIND_LABELS: Record<PerformanceKind, string> = {
	qcm: "QCM",
	exercise: "Exercice",
	duel: "Duel",
};

export const ACTIVITY_LABELS: Record<string, string> = {
	lesson_read: "Cours lu",
	lesson_question: "Question posée",
	qcm_generated: "QCM généré",
	qcm_completed: "QCM terminé",
	exercise_completed: "Exercice terminé",
	duel_finished: "Duel",
	course_scanned: "Cours importé",
	report_card_scanned: "Bulletin importé",
	free_chat: "Discussion avec Milo",
	friend_accepted: "Nouvel ami",
};

const asNumber = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;
const asString = (value: unknown): string | null =>
	typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * Libellé lisible d'une activité, construit depuis `details`.
 * Ex. "Duel gagné 4/5 contre un ami", "QCM Fractions 5/5".
 */
export const describeActivity = (activity: ActivityItem): string => {
	const d = activity.details ?? {};
	const score = asNumber(d.score);
	const maxScore = asNumber(d.max_score);
	const scoreLabel =
		score !== null && maxScore !== null ? `${score}/${maxScore}` : score !== null ? `${score}` : "";
	const lesson = asString(d.lesson);
	const subject = asString(d.subject) ?? activity.subject;
	const topic = lesson ?? subject;

	switch (activity.activity_type) {
		case "qcm_completed": {
			const perfect = d.perfect === true ? " · sans-faute" : "";
			return `QCM${topic ? ` ${topic}` : ""}${scoreLabel ? ` ${scoreLabel}` : ""}${perfect}`;
		}
		case "exercise_completed":
			return `Exercice${topic ? ` ${topic}` : ""}${scoreLabel ? ` ${scoreLabel}` : ""}`;
		case "duel_finished": {
			const outcome = d.draw === true ? "Duel nul" : d.won === true ? "Duel gagné" : "Duel perdu";
			const opponent = d.is_friend === true ? " contre un ami" : "";
			const perfect = d.perfect === true ? " · sans-faute" : "";
			return `${outcome}${scoreLabel ? ` ${scoreLabel}` : ""}${opponent}${perfect}`;
		}
		case "lesson_read":
			return `Cours lu${topic ? ` : ${topic}` : ""}`;
		case "lesson_question":
			return `Question posée${topic ? ` sur ${topic}` : ""}`;
		case "qcm_generated":
			return `QCM généré${topic ? ` : ${topic}` : ""}`;
		case "course_scanned": {
			const kind = asString(d.kind);
			return kind ? `Document importé (${kind})` : "Cours importé";
		}
		case "report_card_scanned":
			return "Bulletin importé";
		case "free_chat":
			return "Discussion libre avec Milo";
		case "friend_accepted":
			return "Nouvel ami accepté";
		default:
			return ACTIVITY_LABELS[activity.activity_type] ?? activity.activity_type;
	}
};

/** Arrondit un maximum d'axe à une valeur "propre" (5, 10, 20, 30, 60, 90, 120 min...). */
export const niceMax = (value: number): number => {
	if (value <= 0) return 10;
	// Pas dont la moitié reste entière, pour une graduation médiane propre
	const steps = [10, 20, 30, 40, 60, 90, 120, 180, 240, 360, 480, 600, 720, 960, 1440];
	const found = steps.find((step) => step >= value);
	if (found) return found;
	const magnitude = 10 ** Math.floor(Math.log10(value));
	return Math.ceil(value / magnitude) * magnitude;
};
