import { useEffect, useState } from "react";

const TICK_MS = 60 * 1000;

/**
 * Compte à rebours avant le reset des missions, à partir de
 * `reset_in_seconds` renvoyé par l'API et de l'heure de la réponse
 * (`dataUpdatedAt` de la query). Se met à jour chaque minute.
 */
export const useMissionsReset = (
	resetInSeconds: number | undefined,
	dataUpdatedAt: number,
) => {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), TICK_MS);
		return () => clearInterval(interval);
	}, []);

	if (resetInSeconds === undefined || !dataUpdatedAt) {
		return { remainingSeconds: null, label: null };
	}

	const elapsed = Math.floor((now - dataUpdatedAt) / 1000);
	const remainingSeconds = Math.max(resetInSeconds - elapsed, 0);

	return { remainingSeconds, label: formatResetLabel(remainingSeconds) };
};

export const formatResetLabel = (remainingSeconds: number) => {
	const hours = Math.floor(remainingSeconds / 3600);
	const minutes = Math.floor((remainingSeconds % 3600) / 60);
	if (hours >= 1) return `Reset dans ${hours}h`;
	if (minutes >= 1) return `Reset dans ${minutes} min`;
	return "Reset imminent";
};
