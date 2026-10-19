import type { ProfileSummary } from "@shared/store/auth/auth.model";

const CLASS_LABELS: Record<string, string> = {
	"6eme": "6ème",
	"5eme": "5ème",
	"4eme": "4ème",
	"3eme": "3ème",
};

export const profileRoleLabel = (profile: Pick<ProfileSummary, "role" | "class_">) => {
	switch (profile.role) {
		case "Enfant":
			return profile.class_ ? `Élève · ${CLASS_LABELS[profile.class_] ?? profile.class_}` : "Élève";
		case "Parent":
			return "Parent";
		case "Prof":
			return "Professeur";
		case "Admin":
			return "Administrateur";
		default:
			return profile.role;
	}
};

export const profileInitials = (profile: Pick<ProfileSummary, "first_name" | "last_name">) =>
	`${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "?";

/** Teinte stable par profil, pour distinguer les vignettes d'un coup d'œil. */
const TONES = ["orange", "teal", "violet", "sky", "rose"] as const;
export const profileTone = (profileId: number) => TONES[Math.abs(profileId) % TONES.length];

export const utf8Length = (value: string) => new TextEncoder().encode(value).length;
