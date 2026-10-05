import React from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import StatsView from "@features/stats/components/StatsView";
import { StatsScopeProvider } from "@features/stats/context/StatsScope";

/** Page /stats : les statistiques de l'élève connecté. */
const StatsPage: React.FC = () => (
	<ScreenLayout>
		<StatsScopeProvider scope={{ kind: "me" }}>
			<StatsView />
		</StatsScopeProvider>
	</ScreenLayout>
);

export default StatsPage;
