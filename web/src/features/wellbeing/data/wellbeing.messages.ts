import type { Emoji3DName } from "@features/landing/data/landing.data";

/**
 * Rappels bien-être : Milo ne doit pas devenir un écran sans fin.
 * Ton bienveillant et drôle, jamais culpabilisant : Milo parle comme un
 * grand frère qui s'inquiète un peu pour toi (charte : tutoiement, phrases
 * courtes, un seul point d'exclamation par paragraphe).
 */
export type NudgeKind = "break" | "daily" | "bedtime";

export interface NudgeMessage {
	title: string;
	body: string;
}

export interface NudgeTip {
	icon: Emoji3DName;
	text: string;
}

export interface NudgeTheme {
	/** Illustration de Milo (public/wellbeing) */
	image: string;
	/** Pastille 3D qui flotte près de Milo */
	badge: Emoji3DName;
	tips: NudgeTip[];
	primary: string;
	secondary: string;
}

export const NUDGE_THEMES: Record<NudgeKind, NudgeTheme> = {
	break: {
		image: "/wellbeing/milo-pause.webp",
		badge: "sparkles",
		tips: [
			{ icon: "high_voltage", text: "Lève-toi et étire-toi deux minutes" },
			{ icon: "light_bulb", text: "Regarde au loin pour reposer tes yeux" },
			{ icon: "brain", text: "Ton cerveau retient mieux après une pause" },
		],
		primary: "Je fais une pause",
		secondary: "Encore 5 minutes",
	},
	daily: {
		image: "/wellbeing/milo-fatigue.webp",
		badge: "hundred_points",
		tips: [
			{ icon: "video_game", text: "Va jouer dehors ou retrouver tes amis" },
			{ icon: "books", text: "Un livre papier, ça compte aussi" },
			{ icon: "trophy", text: "Tes progrès du jour sont bien gardés" },
		],
		primary: "D'accord, je décroche",
		secondary: "Encore 5 minutes",
	},
	bedtime: {
		image: "/wellbeing/milo-dodo.webp",
		badge: "glowing_star",
		tips: [
			{ icon: "brain", text: "Pendant que tu dors, ton cerveau range tes leçons" },
			{ icon: "star", text: "Écran éteint, lumière douce, et au lit" },
			{ icon: "spiral_calendar", text: "On reprend demain, ta série est gardée" },
		],
		primary: "Bonne nuit, je me déconnecte",
		secondary: "Je termine vite",
	},
};

export const NUDGE_MESSAGES: Record<NudgeKind, NudgeMessage[]> = {
	// Longue session d'affilée
	break: [
		{ title: "Pause renard !", body: "Ça fait un bon moment que tu bosses. Une petite pause et tu repars encore plus fort." },
		{ title: "On souffle un peu ?", body: "Tu as bien travaillé. Va te dégourdir les pattes, je garde ta place au chaud." },
		{ title: "Recharge des batteries", body: "Même les super-héros font des pauses. Reviens dans un moment, on reprendra là où tu en étais." },
	],
	// Temps total élevé sur la journée
	daily: [
		{ title: "Ouf, quelle journée !", body: "Tu es sur Milo depuis longtemps aujourd'hui. Le reste peut attendre demain, promis." },
		{ title: "Ta batterie clignote…", body: "Tu as déjà beaucoup appris aujourd'hui. Une vraie pause loin des écrans, c'est aussi ça, bien apprendre." },
		{ title: "Mission bonus : décrocher", body: "Ta mission secrète du jour : faire autre chose que l'écran. Je garde tes progrès en sécurité." },
	],
	// Il est tard
	bedtime: [
		{ title: "Oula… il est tard !", body: "Je crois bien qu'il est l'heure d'aller dormir. Le sommeil, c'est là que tes leçons s'installent pour de bon." },
		{ title: "Hmm, tu as vu l'heure ?", body: "La lune est déjà levée. Et si on allait se coucher ? On se retrouve demain, en pleine forme." },
		{ title: "Il faut aller dormir !", body: "Tu es sur Milo depuis trop longtemps et il commence à faire nuit. Pyjama, dents brossées, et au lit." },
	],
};

export const pickNudgeMessage = (kind: NudgeKind): NudgeMessage => {
	const list = NUDGE_MESSAGES[kind];
	return list[Math.floor(Math.random() * list.length)];
};
