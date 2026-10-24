/// Ce que dit Milo devant sa salle de classe, sur l'accueil. Tout est calculé à
/// partir de ce que l'accueil connaît déjà de l'élève (prénom, série, matière
/// fragile du bulletin, missions du jour) : aucune requête en plus.

export interface MiloSchoolContext {
	firstName: string;
	/** Jours d'activité consécutifs */
	streak?: number;
	/** Matière la plus fragile du bulletin, s'il y en a un */
	weakSubject?: string;
	/** Missions du jour pas encore terminées (hors bonus) */
	pendingMissions?: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Salut selon l'heure de l'appareil */
export function greetingLine({ firstName }: MiloSchoolContext, date = new Date()) {
	const hour = date.getHours();
	if (hour < 6) return `Encore debout, ${firstName} ? Une petite question et au lit 😴`;
	if (hour < 12) return `Bonjour ${firstName} ! La classe est ouverte ☀️`;
	if (hour < 18) return `Salut ${firstName} ! On attaque quoi cet après-midi ? 🚀`;
	return `Bonsoir ${firstName} ! Une petite révision avant de dormir ? 🌙`;
}

/** Phrases qui tournent dans la bulle quand l'élève ne fait rien */
export function idleLines(context: MiloSchoolContext, date = new Date()): string[] {
	const { weakSubject, pendingMissions = 0, streak = 0 } = context;
	const lines = [greetingLine(context, date)];
	if (weakSubject) lines.push(`On s'entraîne un peu en ${weakSubject} ? Je t'explique à ma façon 😉`);
	if (pendingMissions > 0) {
		lines.push(`Encore ${plural(pendingMissions, "mission")} aujourd'hui… je t'aide ? 🎯`);
	}
	if (streak > 1) lines.push(`${streak} jours d'affilée, bravo ! On garde la série ? 🔥`);
	lines.push("Une question sur un cours ? Il n'y a pas de question bête ! 😄", "Je t'attends devant la classe ✏️");
	return lines;
}

/** Au survol du bouton : la porte s'ouvre et Milo invite l'élève à entrer */
export const INVITE_LINES = ["Allons en classe ! 🎒", "Allons discuter ! 💬"];

/** Au clic : Milo file en classe */
export const ENTER_LINE = "C'est parti ! 🚀";

/** Ce que dit Milo quand on le chatouille (clic sur lui) */
export const POKE_LINES = [
	"Hihi, ça chatouille ! 😆",
	"Tu m'as trouvé ! On apprend quoi aujourd'hui ?",
	"Attention, encore un clic et je danse ! 🕺",
	"Coucou ! On rentre en classe ? 🦊",
];

/** Réactions jouées au clic sur Milo, piochées au hasard (clips du .glb) */
export const POKE_CLIPS = ["Hello", "HatLook", "67"];
