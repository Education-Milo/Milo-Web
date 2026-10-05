import type { UserRole } from "@shared/store/user/user.model";

export const ASSIGNABLE_ROLES: UserRole[] = ["Enfant", "Parent", "Prof", "Admin"];

export const ROLE_LABELS: Record<UserRole, string> = {
	Enfant: "Élève",
	Parent: "Parent",
	Prof: "Professeur",
	Admin: "Administrateur",
};

/** Utilisateur tel que renvoyé par GET /users/by-username/{username}. */
export interface AdminUserView {
	id: number | string;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	role: UserRole;
	class_?: string | null;
	created_at: string;
	xp: number;
	miloro_coin: number;
}

export interface ChangeRolePayload {
	userId: number | string;
	role: UserRole;
	reason?: string;
}

/** POST /admin/users/{user_id}/role */
export interface ChangeRoleResponse {
	user_id: number;
	username: string;
	previous_role: UserRole;
	role: UserRole;
}

/** Élément de GET /admin/audit */
export interface AuditEntry {
	id: number;
	admin_id: number;
	admin_username: string;
	action: string;
	target_user_id: number | null;
	target_username: string | null;
	details: string | null;
	ip_address: string | null;
	created_at: string;
}

export interface AuditFilters {
	action?: string;
	target_user_id?: number;
	admin_id?: number;
	limit: number;
	offset: number;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
	role_change: "Changement de rôle",
	demo_account_create: "Profil de démo créé",
	demo_account_switch: "Bascule en profil de démo",
	demo_account_delete: "Profil de démo supprimé",
	cosmetic_add: "Cosmétique ajouté",
	cosmetic_update: "Cosmétique modifié",
	cosmetic_retire: "Cosmétique retiré",
	cosmetic_delete: "Cosmétique supprimé",
};

/** Crédit de miloros : le back n'a pas de route d'ajout, on écrit le nouveau total via PUT /users/{id}. */
export interface GrantCoinsPayload {
	userId: number | string;
	username: string;
	/** Solde lu juste avant, pour calculer le total */
	currentCoins: number;
	amount: number;
}

export interface GrantCoinsResult {
	userId: number | string;
	username: string;
	previousCoins: number;
	newCoins: number;
	amount: number;
}

/** POST /cosmetics/add */
export interface CosmeticCreatePayload {
	name: string;
	type: string;
	price: number;
	rarity: string;
	image_url?: string | null;
	mesh_name?: string | null;
}

/** PUT /cosmetics/update/{id} : n'envoyer QUE les champs modifiés. */
export interface CosmeticUpdatePayload {
	name?: string;
	type?: string;
	price?: number;
	rarity?: string;
	image_url?: string | null;
	mesh_name?: string | null;
	is_active?: boolean;
}

export interface UpdateCosmeticResponse {
	updated: boolean;
	/** Lignes lisibles, ex. "price: 100 → 250" */
	changes: string[];
	/** Objets déséquipés chez les joueurs (arrive quand le type change) */
	unequipped: number;
	cosmetic: import("@features/cosmetics/store/cosmetics.model").Cosmetic;
}

/** DELETE /cosmetics/delete/{id} : supprimé si personne ne le possède, sinon retiré. */
export interface DeleteCosmeticResponse {
	deleted: boolean;
	retired: boolean;
	owners: number;
}

// ─── Tableau de bord ────────────────────────────────────────────────────────

/** GET /admin/dashboard?days= (profils de démo exclus des agrégats) */
export interface AdminDashboard {
	period: { days: number; from: string; to: string };
	users: {
		total: number;
		by_role: Partial<Record<UserRole, number>>;
		new: number;
		active: number;
		demo: number;
	};
	engagement: {
		time_seconds: number;
		lessons_read: number;
		qcm_completed: number;
		avg_score_pct: number | null;
		duels_played: number;
		duels_won: number;
		questions_asked: number;
		courses_scanned: number;
		missions_completed: number;
	};
	economy: {
		cosmetics: number;
		purchases: number;
		coins_in_circulation: number;
	};
	top_subjects: { subject: string; qcm_attempts: number; avg_score_pct: number | null }[];
}

// ─── Support ────────────────────────────────────────────────────────────────

export interface AdminUserRow {
	id: number;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	role: UserRole;
	class_: string | null;
	xp: number;
	miloro_coin: number;
	streak: number;
	is_demo: boolean;
	created_at: string;
}

/** GET /admin/users?q=&role=&limit=&offset= */
export interface AdminUsersPage {
	total: number;
	limit: number;
	offset: number;
	users: AdminUserRow[];
}

export interface AdminUsersFilters {
	q?: string;
	role?: UserRole;
	limit: number;
	offset: number;
}

// ─── Profils de démonstration ───────────────────────────────────────────────

/** Rôles possibles pour un profil de démo (jamais Admin) */
export const DEMO_ROLES: UserRole[] = ["Enfant", "Parent", "Prof"];

export interface DemoAccount {
	id: number;
	username: string;
	email: string;
	role: UserRole;
	class_: string | null;
	is_demo: true;
}

export interface DemoTokenResponse {
	access_token: string;
	token_type: string;
	account: DemoAccount;
}
