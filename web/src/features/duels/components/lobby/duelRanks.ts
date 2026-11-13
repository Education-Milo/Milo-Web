import type { Emoji3DName } from "@features/landing/data/landing.data";

/**
 * Rangs de duel, calculés côté front à partir du nombre de victoires
 * (le back ne renvoie pas encore de classement ni de ligue).
 */
export interface DuelRank {
	name: string;
	icon: Emoji3DName;
	/** Victoires nécessaires pour l'atteindre */
	from: number;
}

export const DUEL_RANKS: DuelRank[] = [
	{ name: "Écuyer", icon: "shield", from: 0 },
	{ name: "Chevalier", icon: "crossed_swords", from: 5 },
	{ name: "Champion", icon: "sports_medal", from: 15 },
	{ name: "Légende", icon: "trophy", from: 30 },
];

export const rankFor = (wins: number) => {
	let index = 0;
	DUEL_RANKS.forEach((rank, i) => {
		if (wins >= rank.from) index = i;
	});
	const current = DUEL_RANKS[index];
	const next = DUEL_RANKS[index + 1] ?? null;
	const progress = next ? (wins - current.from) / (next.from - current.from) : 1;
	return { index, current, next, progress, winsToNext: next ? next.from - wins : 0 };
};
