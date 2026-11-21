/// ════════════════════════════════════════════════════════════════════════
///  THÈME DE L'ACCUEIL (la maison de Milo) : le seul endroit à modifier
/// ════════════════════════════════════════════════════════════════════════
///
///   "auto"   → l'accueil prend tout seul la saison du moment
///              (cf. HOME_SEASON_PERIODS ; hors période : "normal")
///   "noel"   → toujours en hiver, décoré pour Noël
///   "normal" → le jardin de tous les jours
///
/// Pour voir un thème sans toucher au code, ajouter ?accueil=noel (ou
/// ?accueil=normal) à l'adresse de la page d'accueil.
///
/// Même principe que la salle de classe (milo-scene/utils/classroomTheme.ts).
export const HOME_THEME: HomeThemeSetting = "noel";

/// ── Ajouter une saison (Halloween, printemps…) ─────────────────────────────
/// 1. l'ajouter à HomeSeason et à HOME_SEASONS (ce qu'elle change),
/// 2. lui donner une période dans HOME_SEASON_PERIODS (pour le mode "auto"),
/// 3. si elle a sa propre déco 3D, la rendre dans SeasonDecor
///    (home/components/miloSchool/miloSchool.seasons.tsx).

export type HomeSeason = "normal" | "noel";
export type HomeThemeSetting = "auto" | HomeSeason;

/** Ce qu'une saison change sur l'accueil */
export interface HomeSeasonLook {
	/** Flocons qui tombent (0 : aucun). Peu nombreux : un seul appel de dessin, mais
	 *  chaque flocon est déplacé à chaque image */
	snowflakes: number;
	/** Pelouse sous la neige (quelques touffes d'herbe dépassent) */
	snowyLawn: boolean;
	/** Neige sur le toit, la cheminée, les arbres et les buissons */
	snowCaps: boolean;
	/** Bonhomme de neige sur la pelouse */
	snowman: boolean;
	/** Guirlande lumineuse sous le bord du toit (elle clignote, sauf mouvements réduits) */
	lights: boolean;
	/** Fleurs dans les buissons, papillons le jour, lucioles la nuit */
	wildlife: boolean;
	/** Milo porte un bonnet de Père Noël (sauf s'il a déjà un chapeau) */
	santaHat: boolean;
	/** Phrases de saison ajoutées à ce que Milo dit dans sa bulle */
	lines: string[];
}

export const HOME_SEASONS: Record<HomeSeason, HomeSeasonLook> = {
	normal: {
		snowflakes: 0,
		snowyLawn: false,
		snowCaps: false,
		snowman: false,
		lights: false,
		wildlife: true,
		santaHat: false,
		lines: [],
	},
	noel: {
		snowflakes: 220,
		snowyLawn: true,
		snowCaps: true,
		snowman: true,
		lights: true,
		wildlife: false,
		santaHat: true,
		lines: [
			"Il neige ! ❄️ Parfait pour réviser bien au chaud.",
			"Tu as vu mon bonhomme de neige ? ⛄ Je l'ai fait ce matin !",
			"Bientôt Noël 🎄 On boucle quelques missions avant les vacances ?",
		],
	},
};

/// Périodes du mode "auto" (jours inclus ; une période peut chevaucher le nouvel an)
export const HOME_SEASON_PERIODS: Partial<Record<HomeSeason, { from: { month: number; day: number }; to: { month: number; day: number } }>> = {
	noel: { from: { month: 12, day: 1 }, to: { month: 1, day: 6 } },
};

const isSeason = (value: string | null): value is HomeSeason => value !== null && value in HOME_SEASONS;

function inPeriod(season: HomeSeason, date: Date) {
	const period = HOME_SEASON_PERIODS[season];
	if (!period) return false;
	const today = (date.getMonth() + 1) * 100 + date.getDate();
	const start = period.from.month * 100 + period.from.day;
	const end = period.to.month * 100 + period.to.day;
	return start <= end ? today >= start && today <= end : today >= start || today <= end;
}

/** Saison affichée : ?accueil=… dans l'adresse, sinon HOME_THEME */
export function resolveHomeSeason(date = new Date()): HomeSeason {
	if (typeof window !== "undefined") {
		const forced = new URLSearchParams(window.location.search).get("accueil");
		if (isSeason(forced)) return forced;
	}
	if (HOME_THEME !== "auto") return HOME_THEME;
	const current = (Object.keys(HOME_SEASON_PERIODS) as HomeSeason[]).find((season) => inPeriod(season, date));
	return current ?? "normal";
}

/** Réglages de la saison affichée */
export const homeSeasonLook = (date = new Date()) => HOME_SEASONS[resolveHomeSeason(date)];
