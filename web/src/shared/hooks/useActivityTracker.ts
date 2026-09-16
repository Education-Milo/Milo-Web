import { useEffect, useRef } from "react";
import { postActivity } from "@shared/api/tracking.api";
import type { ActivityType } from "@shared/types/tracking";

interface ActivityTrackerOptions {
	activityType: ActivityType;
	subject?: string;
	lessonId?: number;
	/** Permet de ne rien mesurer tant que l'écran n'est pas réellement actif. */
	enabled?: boolean;
}

/**
 * Mesure le temps passé sur un écran et l'envoie à POST /tracking/activity
 * quand l'utilisateur le quitte (démontage) ou quand l'onglet passe en
 * arrière-plan (visibilitychange → hidden). Le chrono repart à zéro quand
 * l'onglet redevient visible pour ne pas compter deux fois la même période.
 */
export const useActivityTracker = ({
	activityType,
	subject,
	lessonId,
	enabled = true,
}: ActivityTrackerOptions) => {
	const startedAtRef = useRef<number | null>(null);
	const optionsRef = useRef({ activityType, subject, lessonId });
	optionsRef.current = { activityType, subject, lessonId };

	useEffect(() => {
		if (!enabled) return;

		const flush = () => {
			if (startedAtRef.current === null) return;
			const durationSeconds = Math.round(
				(Date.now() - startedAtRef.current) / 1000,
			);
			startedAtRef.current = null;
			const { activityType, subject, lessonId } = optionsRef.current;
			postActivity({
				activity_type: activityType,
				...(subject ? { subject } : {}),
				...(typeof lessonId === "number" && !Number.isNaN(lessonId)
					? { lesson_id: lessonId }
					: {}),
				duration_seconds: durationSeconds,
			});
		};

		const start = () => {
			startedAtRef.current = Date.now();
		};

		const onVisibilityChange = () => {
			if (document.hidden) flush();
			else start();
		};

		if (!document.hidden) start();
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			flush();
		};
	}, [enabled]);
};
