/// ════════════════════════════════════════════════════════════════════════
///  THÈME DE LA SALLE DE CLASSE : le seul endroit à modifier
/// ════════════════════════════════════════════════════════════════════════
///
///   "auto"   → la salle se décore toute seule pour les fêtes
///              (du 1er décembre au 6 janvier, cf. CHRISTMAS_DECOR.period)
///   "noel"   → toujours décorée pour Noël
///   "normal" → jamais décorée
///
/// Pour voir un thème sans toucher au code, ajouter ?salle=noel (ou
/// ?salle=normal) à l'adresse de la page de la salle.
export const CLASSROOM_THEME: ClassroomThemeSetting = "auto";

/// Réglages de la déco de Noël
export const CHRISTMAS_DECOR = {
	/** Période du mode "auto" (jours inclus) */
	period: { from: { month: 12, day: 1 }, to: { month: 1, day: 6 } },
	/** Sapin, guirlandes, cadeaux… exportés depuis r_class_noel.blend */
	model: "/classroom/noel.glb",
	/** Les guirlandes lumineuses scintillent (sinon : allumées, fixes) */
	twinkle: true,
	/** Quelques flocons tombent doucement dans la classe */
	snowIndoors: true,
	/** Neige derrière la porte et les fenêtres, jardin enneigé */
	snowOutdoors: true,
	/** Milo porte un bonnet de Père Noël (sauf s'il a déjà un chapeau) */
	santaHat: true,
} as const;

export type ClassroomThemeSetting = "auto" | "noel" | "normal";
export type ClassroomTheme = "noel" | "normal";

const isTheme = (value: string | null): value is ClassroomTheme => value === "noel" || value === "normal";

/** La date tombe dans la période des fêtes (elle peut chevaucher le nouvel an) */
export function isChristmasTime(date = new Date()) {
	const { from, to } = CHRISTMAS_DECOR.period;
	const today = (date.getMonth() + 1) * 100 + date.getDate();
	const start = from.month * 100 + from.day;
	const end = to.month * 100 + to.day;
	return start <= end ? today >= start && today <= end : today >= start || today <= end;
}

/** Thème affiché : ?salle=… dans l'adresse, sinon CLASSROOM_THEME */
export function resolveClassroomTheme(date = new Date()): ClassroomTheme {
	if (typeof window !== "undefined") {
		const forced = new URLSearchParams(window.location.search).get("salle");
		if (isTheme(forced)) return forced;
	}
	if (CLASSROOM_THEME === "auto") return isChristmasTime(date) ? "noel" : "normal";
	return CLASSROOM_THEME;
}
