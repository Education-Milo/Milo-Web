import { useEffect, useState } from "react";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type { DuelStatsData } from "@shared/types/duels";

/**
 * Bilan des duels (victoires/nuls/défaites + face-à-face par adversaire),
 * depuis GET /duels/stats. Complète /tracking/stats/me, qui ne donne que
 * les duels joués/gagnés en agrégat (pas la répartition nuls/défaites,
 * ni le détail par adversaire) sur la période choisie.
 */
export const useDuelStats = () => {
	const [duelStats, setDuelStats] = useState<DuelStatsData | null>(null);
	const [loadingDuels, setLoadingDuels] = useState(true);

	useEffect(() => {
		let cancelled = false;
		APIAxios.get<DuelStatsData>(APIRoutes.GET_DuelStats)
			.then((r) => {
				if (!cancelled) setDuelStats(r.data);
			})
			.catch(() => {
				if (!cancelled) setDuelStats(null);
			})
			.finally(() => {
				if (!cancelled) setLoadingDuels(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const rivals = [...(duelStats?.per_opponent ?? [])]
		.sort((a, b) => b.wins + b.draws + b.losses - (a.wins + a.draws + a.losses))
		.slice(0, 4);

	return { duelStats, rivals, loadingDuels };
};
