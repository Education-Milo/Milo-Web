import { GraduationCap, Users, BookOpenCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoleSlug = "eleve" | "parent" | "professeur";

export interface RoleDefinition {
	slug: RoleSlug;
	label: "Élève" | "Parent" | "Professeur";
	title: string;
	tagline: string;
	description: string;
	icon: LucideIcon;
	active: boolean;
}

export const ROLES: RoleDefinition[] = [
	{
		slug: "eleve",
		label: "Élève",
		title: "Je suis élève",
		tagline: "De la 6ème à la 3ème",
		description:
			"Révise en t'amusant, défie tes amis en duel et fais grandir ton Milo.",
		icon: GraduationCap,
		active: true,
	},
	{
		slug: "parent",
		label: "Parent",
		title: "Je suis parent",
		tagline: "Espace famille",
		description:
			"Suis les progrès de tes enfants et accompagne-les en toute sérénité.",
		icon: Users,
		active: true,
	},
	{
		slug: "professeur",
		label: "Professeur",
		title: "Je suis professeur",
		tagline: "Bientôt disponible",
		description:
			"Accompagne ta classe avec des outils pensés pour l'enseignement.",
		icon: BookOpenCheck,
		active: false,
	},
];

export const getRoleBySlug = (slug?: string): RoleDefinition | undefined =>
	ROLES.find((role) => role.slug === slug);
