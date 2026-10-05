import type { BetaProfile } from "@features/feedback/types";

export type ProfileErrors = Partial<Record<keyof BetaProfile, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfile(p: BetaProfile): ProfileErrors {
	const errors: ProfileErrors = {};
	if (!p.firstName.trim()) errors.firstName = "Indique ton prénom.";
	if (!p.lastName.trim()) errors.lastName = "Indique ton nom.";
	if (!p.role) errors.role = "Choisis si tu es élève ou parent.";
	if (p.role === "eleve" && !p.classe) errors.classe = "Choisis ta classe.";
	if (p.role === "parent" && !p.profession.trim()) errors.profession = "Indique ta profession.";
	if (p.email.trim() && !EMAIL_RE.test(p.email.trim())) errors.email = "Cet email ne semble pas complet (ex. prenom@gmail.com).";
	return errors;
}
