import React from "react";
import AiRequestsChart from "@features/admin/components/AiRequestsChart";
import { fmt } from "@features/admin/components/DashboardParts";
import type { AiUsage } from "@features/admin/store/moderation.model";

/** Légende (deux totaux) et barres empilées des requêtes IA. */
const AiUsageChart: React.FC<{ usage: AiUsage }> = ({ usage }) => {
	const hasBlocked = usage.by_outcome.blocked > 0;
	return (
		<>
			<div className="ad-chart-legend">
				<span>
					<i className="ad-chart-key ad-chart-key--generated" /> Générées (facturées) ·{" "}
					<strong>{fmt(usage.by_outcome.generated)}</strong>
				</span>
				<span>
					<i className="ad-chart-key ad-chart-key--rest" />{" "}
					{hasBlocked ? "Cache ou bloquées (non facturées)" : "Servies par le cache"} ·{" "}
					<strong>{fmt(Math.max(0, usage.total - usage.by_outcome.generated))}</strong>
				</span>
			</div>
			<AiRequestsChart
				daily={usage.daily}
				dailyGenerated={usage.daily_generated}
				restLabel={hasBlocked ? "Cache ou bloquées" : "Cache"}
			/>
		</>
	);
};

export default AiUsageChart;
