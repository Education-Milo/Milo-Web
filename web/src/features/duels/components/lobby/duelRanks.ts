/**
 * Rangs de duel (10 paliers), calculés côté front à partir du nombre de
 * victoires : le back ne renvoie pas encore de classement ni de ligue.
 * Chaque rang a son badge (public/duels/rangs) et sa couleur d'accent.
 */
export interface DuelRank {
	id: string;
	name: string;
	/** Victoires nécessaires pour l'atteindre */
	from: number;
	/** Couleur principale du rang (fonds, barres) */
	color: string;
	/** Teinte foncée pour la tranche en relief et le texte */
	edge: string;
}

export const DUEL_RANKS: DuelRank[] = [
	{ id: "bois", name: "Bois", from: 0, color: "#A86B3C", edge: "#6E4223" },
	{ id: "fer", name: "Fer", from: 3, color: "#7D8494", edge: "#4B5160" },
	{ id: "bronze", name: "Bronze", from: 7, color: "#C9773E", edge: "#8A4A1E" },
	{ id: "argent", name: "Argent", from: 12, color: "#9FB0C8", edge: "#5E6F88" },
	{ id: "or", name: "Or", from: 18, color: "#F2B321", edge: "#B07A00" },
	{ id: "saphir", name: "Cristal", from: 25, color: "#3FA9F5", edge: "#1A6FB0" },
	{ id: "emeraude", name: "Émeraude", from: 35, color: "#2FB463", edge: "#167A3D" },
	{ id: "diamant", name: "Diamant", from: 50, color: "#5B7CFA", edge: "#2F47B8" },
	{ id: "amethyste", name: "Améthyste", from: 70, color: "#9B5DE5", edge: "#5E2E9E" },
	{ id: "legende", name: "Légende", from: 100, color: "#F4A62A", edge: "#2F47B8" },
];

export const rankImage = (rank: DuelRank) => `/duels/rangs/${rank.id}.webp`;

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
