import { useCallback, useEffect, useState } from "react";

/// Ambiance jour / nuit de la salle de classe, selon l'heure de l'appareil.
/// 0 = jour, 1 = nuit ; entre les deux à l'aube et au crépuscule, pour que
/// la salle bascule en douceur plutôt que d'un coup.

/** Aube : la nuit se lève de 6 h 30 à 8 h */
const DAWN: [number, number] = [6.5, 8];
/** Crépuscule : la nuit tombe de 18 h 30 à 20 h */
const DUSK: [number, number] = [18.5, 20];
const REFRESH_MS = 60_000;

const smoothstep = (from: number, to: number, x: number) => {
	const t = Math.min(Math.max((x - from) / (to - from), 0), 1);
	return t * t * (3 - 2 * t);
};

export function nightMixAt(date: Date): number {
	const hour = date.getHours() + date.getMinutes() / 60;
	const daylight = smoothstep(DAWN[0], DAWN[1], hour) * (1 - smoothstep(DUSK[0], DUSK[1], hour));
	/// Arrondi : évite de re-rendre la scène pour des variations invisibles
	return Math.round((1 - daylight) * 100) / 100;
}

/** « auto » suit l'heure ; « day » / « night » forcent l'ambiance (tests) */
export type DayNightMode = "auto" | "day" | "night";

const NEXT_MODE: Record<DayNightMode, DayNightMode> = { auto: "night", night: "day", day: "auto" };

export function useDayNight() {
	const [mode, setMode] = useState<DayNightMode>("auto");
	const [autoMix, setAutoMix] = useState(() => nightMixAt(new Date()));

	useEffect(() => {
		const id = window.setInterval(() => setAutoMix(nightMixAt(new Date())), REFRESH_MS);
		return () => window.clearInterval(id);
	}, []);

	const nightTarget = mode === "auto" ? autoMix : mode === "night" ? 1 : 0;
	const cycleMode = useCallback(() => setMode((current) => NEXT_MODE[current]), []);

	return { mode, nightTarget, cycleMode };
}
