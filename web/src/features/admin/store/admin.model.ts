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
