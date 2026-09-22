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
};
