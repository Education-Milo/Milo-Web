import React, { useState } from "react";
import { Activity } from "lucide-react";
import AiUsageChart from "@features/admin/components/AiUsageChart";
import { fmt, formatLatency } from "@features/admin/components/DashboardParts";
import { getAdminErrorMessage } from "@features/admin/store/admin.queries";
import { useAiUsage } from "@features/admin/store/moderation.queries";

const PERIODS = [7, 30, 90];

/** Requêtes IA d'un seul compte : même graphique que la page Modération IA. */
const UserAiUsage: React.FC<{ userId: number }> = ({ userId }) => {
	const [days, setDays] = useState(30);
	const { data, isLoading, isError, error, isFetching } = useAiUsage(days, userId);

	return (
		<section className="ad-card">
			<div className="ad-toolbar ad-toolbar--between">
				<div className="ad-card-title-wrap">
					<div className="ad-card-icon"><Activity size={18} /></div>
					<div>
						<h2 className="ad-card-title">Requêtes IA</h2>
						<p className="ad-card-subtitle">
							{data
								? data.total === 0
									? `Aucune requête IA sur les ${days} derniers jours`
									: `${fmt(data.total)} requête${data.total > 1 ? "s" : ""} sur ${days} jours · ${formatLatency(data.latency_ms)}`
								: `Sur les ${days} derniers jours`}
						</p>
					</div>
				</div>
				<div className="ad-segmented" role="tablist" aria-label="Période">
					{PERIODS.map((p) => (
						<button
							key={p}
							type="button"
							role="tab"
							aria-selected={days === p}
							className={`ad-segmented-btn ${days === p ? "active" : ""}`}
							onClick={() => setDays(p)}
						>
							{p} jours
						</button>
					))}
				</div>
			</div>

			{isLoading && <p className="ad-muted">Chargement...</p>}
			{isError && !data && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>}
			{data && data.total > 0 && (
				<div className={isFetching ? "is-fetching" : undefined}>
					<AiUsageChart usage={data} />
				</div>
			)}
		</section>
	);
};

export default UserAiUsage;
