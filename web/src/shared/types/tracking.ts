import type { DailyMission } from "@shared/types/missions";

export type PerformanceKind = "qcm" | "exercise";

export interface PerformancePayload {
  kind: PerformanceKind;
  /** Si le QCM vient d'une leçon : le back résout matière et titre. */
  lesson_id?: number;
  /** Sinon, au moins la matière si connue. */
  subject?: string;
  score: number;
  max_score: number;
  /** Plus longue série de bonnes réponses d'affilée dans cette tentative. */
  best_streak: number;
  duration_seconds: number;
  /** UUID généré côté front au lancement : rend l'appel idempotent. */
  attempt_id: string;
}

export interface PerformanceResponse {
  performance_id: string;
  activity_id: string;
  duplicate: boolean;
  missions_completed: DailyMission[];
  streak: number;
}

export type ActivityType =
  | "lesson_read"
  | "study_session"
  | "free_chat"
  | "lesson_question";

export interface ActivityPayload {
  activity_type: ActivityType;
  subject?: string;
  lesson_id?: number;
  duration_seconds: number;
}
