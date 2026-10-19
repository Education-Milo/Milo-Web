import type { ProfileSummary } from "@shared/store/auth/auth.model";
import type { ClassType } from "@shared/store/user/user.model";

/** GET /account */
export interface Account {
	id: number;
	email: string;
	created_at: string;
	profiles: ProfileSummary[];
}

/** POST /profiles : Prof et Admin restent attribués par un admin. */
export interface CreateProfilePayload {
	/** Mot de passe du compte : sans lui, un enfant pourrait s'ajouter un profil Parent. */
	current_password: string;
	first_name: string;
	last_name: string;
	/** Unique sur toute la plateforme : c'est lui que voient les autres élèves. */
	username: string;
	role: "Enfant" | "Parent";
	/** Obligatoire pour un élève, refusé pour un parent (422). */
	class_?: ClassType;
	/** Exactement 4 chiffres. */
	pin?: string;
}

/** PUT /profiles/{id}/pin : `pin: null` retire le verrou. */
export interface UpdateProfilePinPayload {
	profileId: number;
	current_password: string;
	pin: string | null;
}

export interface DeleteProfilePayload {
	profileId: number;
	current_password: string;
}

/** DELETE /profiles/{id} */
export interface DeleteProfileResponse {
	message: string;
	profile_id: number;
	/** Dernier profil : le compte est supprimé avec lui, le jeton présenté ne vaut plus rien. */
	account_deleted: boolean;
}

export interface ChangeEmailPayload {
	current_password: string;
	new_email: string;
}

export interface ChangePasswordPayload {
	current_password: string;
	new_password: string;
}

/** Plafonds du back */
export const MAX_PROFILES_PER_ACCOUNT = 5;
export const PIN_LENGTH = 4;
export const PASSWORD_MIN_CHARS = 8;
export const PASSWORD_MAX_BYTES = 72;
