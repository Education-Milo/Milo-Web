import { useEffect } from "react";
import { canPlay } from "@shared/constants/roles";
import { ROUTES } from "@shared/constants/routes";
import { useUserStore } from "@shared/store/user/user.store";
import { useDailyMissions } from "@features/missions/store/missions.queries";
import { pushBuddy, type BuddyKind } from "@features/milo-buddy/store/buddy.store";

/// Ce qui fait réagir Milo : la première visite du jour (ou le retour après
/// une absence), une mission terminée, la journée bouclée, la série qui grandit.
///
/// Les états déjà fêtés sont retenus par profil (plusieurs enfants peuvent
/// partager un appareil). La toute première fois, on note l'état actuel sans
/// rien fêter : Milo ne célèbre que ce qui se passe ensuite.

const ABSENCE_DAYS = 2;

const store = {
	get<T>(key: string): T | null {
		try {
			const raw = window.localStorage.getItem(key);
			return raw === null ? null : (JSON.parse(raw) as T);
		} catch {
			return null;
		}
	},
	set(key: string, value: unknown) {
		try {
			window.localStorage.setItem(key, JSON.stringify(value));
		} catch {
			/// Sans stockage, Milo réagit simplement un peu plus souvent
		}
	},
};

/** Date locale du jour, « 2026-11-15 » */
const today = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const daysBetween = (from: string, to: string) =>
	Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86_400_000);

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export function useBuddyTriggers() {
	const user = useUserStore((state) => state.user);
	const { data: missions } = useDailyMissions();
	const userId = user?.id;
	const player = canPlay(user?.role);
	const name = user?.first_name?.trim();
	const streak = user?.streak ?? 0;

	/* ---------- Première visite du jour, retour après une absence ---------- */
	useEffect(() => {
		if (!userId || !player) return;
		const key = `milo.buddy.${userId}.lastDay`;
		const last = store.get<string>(key);
		const day = today();
		if (last === day) return;
		store.set(key, day);
		const away = last ? daysBetween(last, day) : 0;
		if (away >= ABSENCE_DAYS) {
			pushBuddy({
				kind: "back",
				clip: "Hello",
				text: `Te revoilà${name ? `, ${name}` : ""} ! Ça faisait ${away} jours, tes missions t'attendent.`,
				to: ROUTES.MISSIONS,
			});
		} else {
			pushBuddy({
				kind: "welcome",
				clip: "Hello",
				text: `Salut${name ? ` ${name}` : ""} ! Prêt pour une nouvelle journée ? Tes missions du jour t'attendent.`,
				to: ROUTES.MISSIONS,
			});
		}
	}, [userId, player, name]);

	/* ---------- Missions terminées depuis la dernière fois ---------- */
	useEffect(() => {
		if (!userId || !player || !missions) return;
		const key = `milo.buddy.${userId}.missions`;
		const seen = store.get<{ date: string; ids: number[] }>(key);
		const done = missions.missions.filter((m) => m.is_completed);
		store.set(key, { date: missions.date, ids: done.map((m) => m.id) });
		/// (première fois : on note sans fêter)
		if (!seen) return;
		const already = seen.date === missions.date ? seen.ids : [];
		const fresh = done.filter((m) => !already.includes(m.id));
		if (fresh.length === 0) return;
		const xp = fresh.reduce((sum, m) => sum + m.reward_xp, 0);
		const reward = xp > 0 ? ` +${xp} XP` : "";
		const dayDone = missions.total > 0 && missions.completed >= missions.total && fresh.some((m) => !m.is_bonus);
		if (dayDone) {
			pushBuddy({
				kind: "all-missions",
				clip: "Arrival",
				text: `Journée parfaite${name ? `, ${name}` : ""} ! Tes ${missions.total} missions sont bouclées 🎉${reward}`,
				to: ROUTES.MISSIONS,
				big: true,
			});
		} else {
			pushBuddy({
				kind: "mission",
				clip: "Success",
				text:
					fresh.length === 1
						? `Mission « ${fresh[0].title} » bouclée !${reward}`
						: `${plural(fresh.length, "mission")} bouclées d'un coup !${reward}`,
				to: ROUTES.MISSIONS,
			});
		}
	}, [userId, player, missions, name]);

	/* ---------- La série grandit ---------- */
	useEffect(() => {
		if (!userId || !player) return;
		const key = `milo.buddy.${userId}.streak`;
		const previous = store.get<number>(key);
		store.set(key, streak);
		if (previous === null || streak <= previous || streak < 2) return;
		pushBuddy({
			kind: "streak",
			clip: "67",
			text: `${streak} jours d'affilée 🔥 Continue comme ça !`,
		});
	}, [userId, player, streak]);
}

/// Démo (développement seulement) : `miloBuddy("mission")` dans la console
/// pour voir chaque réaction sans attendre qu'elle arrive vraiment
export const BUDDY_DEMO: Record<BuddyKind, Parameters<typeof pushBuddy>[0]> = {
	welcome: {
		kind: "welcome",
		clip: "Hello",
		text: "Salut ! Prêt pour une nouvelle journée ? Tes missions du jour t'attendent.",
		to: ROUTES.MISSIONS,
	},
	back: { kind: "back", clip: "Hello", text: "Te revoilà ! Ça faisait 3 jours, tes missions t'attendent.", to: ROUTES.MISSIONS },
	mission: {
		kind: "mission",
		clip: "Success",
		text: "Mission « Pose 3 questions à Milo » bouclée ! +20 XP",
		to: ROUTES.MISSIONS,
	},
	"all-missions": {
		kind: "all-missions",
		clip: "Arrival",
		text: "Journée parfaite ! Tes 3 missions sont bouclées 🎉 +90 XP",
		to: ROUTES.MISSIONS,
		big: true,
	},
	streak: { kind: "streak", clip: "67", text: "5 jours d'affilée 🔥 Continue comme ça !" },
};
