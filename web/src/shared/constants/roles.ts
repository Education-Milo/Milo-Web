import type { UserRole } from "@shared/store/user/user.model";

/**
 * Rôles qui ont accès à l'application élève (cours, QCM, missions, duels,
 * boutique, stats, amis). Un admin garde son compte élève et joue comme
 * n'importe quel élève, avec les pages d'administration en plus.
 */
export const PLAYER_ROLES: UserRole[] = ["Enfant", "Admin"];

export const canPlay = (role: UserRole | null | undefined): boolean =>
	Boolean(role && PLAYER_ROLES.includes(role));
