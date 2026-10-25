/// Pont entre l'interface (React) et la scène 3D : un objet mutable, lu à
/// chaque image dans useFrame. L'interface y écrit ses intentions sans
/// provoquer de rendu React de la scène, la scène y publie ses ancres.

export type MiloSchoolPhase = "idle" | "inviting" | "entering" | "exiting";

/** Résumé des missions du jour, affiché sur la pancarte */
export interface MissionsSummary {
	done: number;
	total: number;
	/** Missions du jour pas encore terminées (hors bonus) */
	pending: number;
}

/** Ce qu'on peut survoler ou toucher dans la scène */
export type MiloSchoolPart = "door" | "milo" | "missions" | "mail";

export interface MiloSchoolBridge {
	/** Porte ouverte (cible ; la scène amortit le mouvement) */
	doorOpen: boolean;
	/** idle : Milo attend ; inviting : il montre la porte ; entering : il rentre
	 *  en classe ; exiting : il en ressort (retour de l'élève sur l'accueil) */
	phase: MiloSchoolPhase;
	/** Animations ponctuelles à jouer (clic sur Milo…), par nom de clip */
	reactions: string[];
	/** Bulle : la scène y écrit la position de la tête de Milo (variables CSS) */
	bubble: HTMLElement | null;
	/** Scène : la scène y écrit la position de la porte à l'écran (zoom d'entrée) */
	stage: HTMLElement | null;
	/** Marge (px) gardée en bas d'écran : la scène se cadre au-dessus */
	bottomPx: number;
	/** Écran large : la pancarte des missions et la boîte aux lettres sont dans le cadre */
	wide: boolean;
	/** Élément survolé dans la scène (la scène l'écrit aussi pour ses animations) */
	hovered: MiloSchoolPart | null;
	onHover: ((part: MiloSchoolPart | null) => void) | null;
	onPick: ((part: MiloSchoolPart) => void) | null;
	/** Milo est ressorti de la classe et a repris sa place */
	onExitDone: (() => void) | null;
}

export const createMiloSchoolBridge = (): MiloSchoolBridge => ({
	doorOpen: false,
	phase: "idle",
	reactions: [],
	bubble: null,
	stage: null,
	bottomPx: 0,
	wide: true,
	hovered: null,
	onHover: null,
	onPick: null,
	onExitDone: null,
});

/// La scène 3D de l'accueil survit à la navigation (voir MiloSchoolCanvas) :
/// une fois Milo et l'école affichés, un retour sur l'accueil est immédiat
export const schoolScene = { ready: false };

/// Entrée en classe (et sortie) : Milo fait ENTRY_HOPS petits sauts de
/// HOP_SECONDS chacun
export const HOP_SECONDS = 0.34;
export const ENTRY_HOPS = 4;
export const ENTRY_MS = HOP_SECONDS * ENTRY_HOPS * 1000;

/// Milo est-il resté en classe ? Noté à l'entrée, pour le faire ressortir quand
/// l'élève revient sur l'accueil, même après un rechargement de la page. Le
/// stockage peut être indisponible (navigation privée…) : on s'en passe alors.
const IN_CLASSROOM_KEY = "milo.home.inClassroom";
export const inClassroom = {
	get(): boolean {
		try {
			return window.sessionStorage.getItem(IN_CLASSROOM_KEY) === "1";
		} catch {
			return false;
		}
	},
	set(value: boolean) {
		try {
			if (value) window.sessionStorage.setItem(IN_CLASSROOM_KEY, "1");
			else window.sessionStorage.removeItem(IN_CLASSROOM_KEY);
		} catch {
			/// Sans stockage, Milo réapparaît simplement devant la porte
		}
	},
};

/// Pas de temps d'une image, borné : jamais négatif ni énorme (onglet revenu au
/// premier plan, horloge capricieuse), sinon amortis et ressorts s'emballent
export const frameStep = (delta: number) => (Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0);

/** Survol / clic d'un objet de la scène, relayé à l'interface */
export function partHandlers(bridge: MiloSchoolBridge, part: MiloSchoolPart) {
	return {
		onPointerOver: (event: { stopPropagation: () => void }) => {
			event.stopPropagation();
			bridge.hovered = part;
			bridge.onHover?.(part);
		},
		onPointerOut: () => {
			if (bridge.hovered === part) bridge.hovered = null;
			bridge.onHover?.(null);
		},
		onClick: (event: { stopPropagation: () => void }) => {
			event.stopPropagation();
			bridge.onPick?.(part);
		},
	};
}
