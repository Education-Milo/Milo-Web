import React, { createContext, useContext } from "react";

/**
 * Compte dont on affiche les statistiques.
 * - "me" : l'élève connecté (/tracking/stats/me, /tracking/activity/me…)
 * - "user" : un autre compte, vu depuis le panel admin (/admin/users/{id}/…)
 */
export type StatsScope = { kind: "me" } | { kind: "user"; userId: number; username?: string };

const StatsScopeContext = createContext<StatsScope>({ kind: "me" });

export const StatsScopeProvider: React.FC<{ scope: StatsScope; children: React.ReactNode }> = ({
	scope,
	children,
}) => <StatsScopeContext.Provider value={scope}>{children}</StatsScopeContext.Provider>;

export const useStatsScope = () => useContext(StatsScopeContext);
