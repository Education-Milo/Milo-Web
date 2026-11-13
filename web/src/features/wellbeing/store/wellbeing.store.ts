import { create } from "zustand";
import { pickNudgeMessage, type NudgeKind, type NudgeMessage } from "@features/wellbeing/data/wellbeing.messages";

/* ============================================================
   RÉGLAGES
   ============================================================ */
export const WELLBEING_RULES = {
	/** Session d'affilée avant la première suggestion de pause */
	breakAfterMin: 45,
	/** Temps cumulé dans la journée avant le rappel « décroche » */
	dailyLimitMin: 90,
	/** Heure à partir de laquelle on rappelle d'aller dormir (et jusqu'à 6 h) */
	bedtimeHour: 21,
	bedtimeMinute: 30,
	/** Délai minimal entre deux rappels, quel qu'en soit le type */
	cooldownMin: 15,
	/** « Encore 5 minutes » */
	snoozeMin: 5,
	/** Une absence plus longue remet le compteur de session à zéro */
	sessionResetMin: 10,
} as const;

const STORAGE_KEY = "milo_wellbeing";

interface PersistedState {
	/** Jour (AAAA-MM-JJ) du compteur journalier */
	day: string;
	/** Secondes actives cumulées dans la journée */
	dailySeconds: number;
	/** Secondes actives de la session en cours */
	sessionSeconds: number;
	/** Horodatage de la dernière activité comptée (ms) */
	lastActiveAt: number;
	/** Pas de rappel automatique avant cet horodatage (ms) */
	quietUntil: number;
}

export const todayKey = (d = new Date()) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const emptyState = (): PersistedState => ({
	day: todayKey(),
	dailySeconds: 0,
	sessionSeconds: 0,
	lastActiveAt: Date.now(),
	quietUntil: 0,
});

const load = (): PersistedState => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyState();
		const parsed = JSON.parse(raw) as Partial<PersistedState>;
		const base = emptyState();
		const state = { ...base, ...parsed };
		if (state.day !== base.day) return { ...base, quietUntil: state.quietUntil ?? 0 };
		return state;
	} catch {
		return emptyState();
	}
};

const save = (state: PersistedState) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		/* navigation privée : le suivi reste en mémoire */
	}
};

export interface ActiveNudge extends NudgeMessage {
	kind: NudgeKind;
	/** Déclenché à la main depuis le panel admin */
	isTest: boolean;
}

interface WellbeingStore {
	tracking: PersistedState;
	nudge: ActiveNudge | null;
	/** Ajoute `seconds` de temps actif et affiche un rappel si un seuil est franchi. */
	tick: (seconds: number) => void;
	/** Affiche un rappel tout de suite (panel admin). */
	trigger: (kind: NudgeKind, isTest?: boolean) => void;
	dismiss: () => void;
	snooze: () => void;
	reset: () => void;
}

const isBedtime = (d = new Date()) => {
	const minutes = d.getHours() * 60 + d.getMinutes();
	return minutes >= WELLBEING_RULES.bedtimeHour * 60 + WELLBEING_RULES.bedtimeMinute || d.getHours() < 6;
};

const quietFor = (min: number) => Date.now() + min * 60_000;

export const useWellbeingStore = create<WellbeingStore>((set, get) => ({
	tracking: load(),
	nudge: null,

	tick: (seconds) => {
		const now = Date.now();
		let t = { ...get().tracking };
		if (t.day !== todayKey()) t = { ...emptyState(), quietUntil: t.quietUntil };
		// Longue absence : nouvelle session
		if (now - t.lastActiveAt > WELLBEING_RULES.sessionResetMin * 60_000) t.sessionSeconds = 0;
		t.dailySeconds += seconds;
		t.sessionSeconds += seconds;
		t.lastActiveAt = now;

		let kind: NudgeKind | null = null;
		if (!get().nudge && now >= t.quietUntil) {
			if (isBedtime()) kind = "bedtime";
			else if (t.dailySeconds >= WELLBEING_RULES.dailyLimitMin * 60) kind = "daily";
			else if (t.sessionSeconds >= WELLBEING_RULES.breakAfterMin * 60) kind = "break";
		}
		if (kind) t.quietUntil = quietFor(WELLBEING_RULES.cooldownMin);

		save(t);
		set({
			tracking: t,
			...(kind ? { nudge: { kind, isTest: false, ...pickNudgeMessage(kind) } } : {}),
		});
	},

	trigger: (kind, isTest = true) => set({ nudge: { kind, isTest, ...pickNudgeMessage(kind) } }),

	dismiss: () => {
		const { nudge, tracking } = get();
		// Après une vraie pause suggérée, la session repart de zéro
		const t = nudge && !nudge.isTest && nudge.kind === "break" ? { ...tracking, sessionSeconds: 0 } : tracking;
		save(t);
		set({ nudge: null, tracking: t });
	},

	snooze: () => {
		const t = { ...get().tracking, quietUntil: quietFor(WELLBEING_RULES.snoozeMin) };
		save(t);
		set({ nudge: null, tracking: t });
	},

	reset: () => {
		const t = emptyState();
		save(t);
		set({ tracking: t, nudge: null });
	},
}));
