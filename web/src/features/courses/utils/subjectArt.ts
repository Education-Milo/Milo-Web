import type { Emoji3DName } from "@features/landing/data/landing.data";
import { getSubjectKey, getSubjectVisuals, type CourseVisuals } from "@shared/constants/courses";

/// Identité d'une matière sur les pages Cours : icône 3D (la charte des pages
/// Missions, Duels, Personnalisation), couleur et ce qu'on y apprend.

export interface SubjectArt {
	icon: Emoji3DName;
	/** Ce qu'on y apprend, en quelques mots */
	blurb: string;
	theme: CourseVisuals["colorTheme"];
	locked: boolean;
}

const ART: Record<string, { icon: Emoji3DName; blurb: string }> = {
	"Mathématiques": { icon: "bar_chart", blurb: "Nombres, calculs, géométrie et problèmes" },
	"Français": { icon: "books", blurb: "Lecture, grammaire, orthographe et écriture" },
	"Anglais": { icon: "globe", blurb: "Vocabulaire, grammaire et expression" },
	"Histoire-Géographie": { icon: "spiral_calendar", blurb: "Grandes époques et territoires du monde" },
	"Physique-Chimie": { icon: "high_voltage", blurb: "Matière, énergie et expériences" },
	"SVT": { icon: "sparkles", blurb: "Le vivant, le corps humain et la planète" },
};

const DEFAULT_ART = { icon: "graduation_cap" as Emoji3DName, blurb: "Leçons expliquées par Milo et QCM" };

export function getSubjectArt(title: string | undefined | null): SubjectArt {
	const key = getSubjectKey(title);
	const visuals = getSubjectVisuals(title);
	const art = (key && ART[key]) || DEFAULT_ART;
	return { ...art, theme: visuals.colorTheme, locked: visuals.locked === true };
}

/// Icônes des cours et des chapitres d'une matière, en alternance
export const COURSE_ICONS: Emoji3DName[] = ["books", "graduation_cap", "brain", "light_bulb", "rocket", "bullseye"];

/** Intitulé de niveau lisible : « 6eme » → « 6ème » */
export const levelLabel = (level: string | undefined | null) => (level ? level.replace(/eme$/, "ème") : "");

/// « Anglais - 6eme » → « Anglais » : la classe est déjà affichée à côté
const LEVEL_SUFFIX = /\s*[-–—]?\s*\(?\b[3-6]\s*(e|è|é)me\b\)?\s*$/i;

/**
 * Nom de la matière sans la classe en suffixe, sauf si deux matières de la
 * liste se retrouvaient alors avec le même nom.
 */
export function subjectDisplayTitles<T extends { id: number; title: string }>(subjects: T[]): Map<number, string> {
	const short = subjects.map((subject) => subject.title.replace(LEVEL_SUFFIX, "").trim() || subject.title);
	const counts = new Map<string, number>();
	short.forEach((title) => counts.set(title, (counts.get(title) ?? 0) + 1));
	return new Map(subjects.map((subject, i) => [subject.id, counts.get(short[i])! > 1 ? subject.title : short[i]]));
}

/** Nom d'une seule matière, sans la classe en suffixe */
export const subjectDisplayTitle = (title: string | undefined | null) =>
	title ? title.replace(LEVEL_SUFFIX, "").trim() || title : "";
