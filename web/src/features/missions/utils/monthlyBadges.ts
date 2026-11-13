import type { MonthlyBadge, MonthlyChallenge } from "@shared/types/missions";

export const MONTH_NAMES = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
];

/** « de Novembre », mais « d'Avril », « d'Août », « d'Octobre » */
const ELIDED_MONTHS = new Set([3, 7, 9]);
export const monthWithPreposition = (monthIndex: number) =>
	`${ELIDED_MONTHS.has(monthIndex) ? "d'" : "de "}${MONTH_NAMES[monthIndex]}`;

/** Badge illustré de chaque mois (public/badges/mois/01…12.webp) */
export const badgeImage = (monthIndex: number) => `/badges/mois/${String(monthIndex + 1).padStart(2, "0")}.webp`;

/** Ce que raconte chaque badge, affiché dans sa fiche */
export const BADGE_STORIES = [
	"Bonnet, écharpe et flocons : Milo affronte l'hiver.",
	"Un gros cœur pour tous ceux qui révisent avec lui.",
	"Les cerisiers sont en fleurs, le printemps arrive.",
	"Ciré jaune et giboulées : rien n'arrête Milo.",
	"Un brin de muguet pour fêter le joli mois de mai.",
	"Lunettes de soleil : l'été pointe le bout de son nez.",
	"Chapeau de paille et jus d'orange à la plage.",
	"Bouée et lunettes de piscine : plouf !",
	"Cartable sur le dos, c'est la rentrée.",
	"Chapeau de sorcier et citrouille d'Halloween.",
	"Un chocolat chaud sous les feuilles d'automne.",
	"Bonnet rouge et cadeau : joyeux Noël !",
];

/**
 * Défi du mois. Le back ne renvoie pas encore la progression mensuelle :
 * valeurs d'illustration, comme sur l'ancienne page.
 */
export const getMonthlyChallenge = (today = new Date()): MonthlyChallenge => {
	const monthIndex = today.getMonth();
	const lastDay = new Date(today.getFullYear(), monthIndex + 1, 0).getDate();
	return {
		title: `L'aventure ${monthWithPreposition(monthIndex)}`,
		daysLeft: lastDay - today.getDate(),
		questsCurrent: 4,
		questsTotal: 35,
	};
};

/**
 * Collection de l'année. Pas encore d'historique côté back : les mois
 * passés alternent « obtenu » / « manqué » pour montrer les deux états.
 */
export const getMonthlyBadges = (today = new Date()): MonthlyBadge[] => {
	const year = today.getFullYear();
	const current = today.getMonth();
	return MONTH_NAMES.map((month, monthIndex) => {
		const status: MonthlyBadge["status"] =
			monthIndex < current ? (monthIndex % 2 === 0 ? "earned" : "missed") : monthIndex === current ? "in-progress" : "locked";
		return {
			id: `${String(year).slice(-2)}-${String(monthIndex + 1).padStart(2, "0")}`,
			month,
			monthIndex,
			year,
			imageUrl: badgeImage(monthIndex),
			status,
		};
	});
};
