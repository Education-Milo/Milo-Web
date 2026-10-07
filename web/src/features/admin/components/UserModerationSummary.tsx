import React from "react";
import { useModerationEvents } from "@features/admin/store/moderation.queries";
import { fmt } from "@features/admin/components/DashboardParts";

/** Fenêtre la plus large acceptée par le back */
const WINDOW_DAYS = 365;
const SELF_HARM_FAMILY = "Autolyse";

/**
 * Signalements de modération de CE compte. Le compteur d'autolyse vit ici,
 * sur la fiche de l'élève, et jamais dans un classement global.
 */
const UserModerationSummary: React.FC<{ userId: number }> = ({ userId }) => {
	const base = { days: WINDOW_DAYS, user_id: userId, limit: 1, offset: 0 };
	const all = useModerationEvents(base);
	const selfHarm = useModerationEvents({ ...base, family: SELF_HARM_FAMILY });

	if (all.isLoading || selfHarm.isLoading) return null;
	if (all.isError || !all.data) return null;

	const total = all.data.total;
	const selfHarmTotal = selfHarm.data?.total ?? 0;

	return (
		<div className="ad-role-form">
			<h3 className="ad-subtitle">Modération IA</h3>
			<p className="ad-muted ad-moderation-summary">
				{total === 0
					? "Aucun signalement sur les 12 derniers mois."
					: `${fmt(total)} signalement${total > 1 ? "s" : ""} sur les 12 derniers mois${
							selfHarmTotal > 0 ? `, dont ${fmt(selfHarmTotal)} lié${selfHarmTotal > 1 ? "s" : ""} à l'autolyse` : ""
						}.`}
			</p>
		</div>
	);
};

export default UserModerationSummary;
