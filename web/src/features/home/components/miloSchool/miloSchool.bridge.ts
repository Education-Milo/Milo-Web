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

/** Ce que la caméra va voir de près : la pancarte, ou la boîte aux lettres */
export type MiloSchoolFocus = "missions" | "mail";

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
	/** Carte : la scène y écrit la position de la boîte aux lettres à
	 *  l'écran (--mail-x / --mail-y, px), d'où s'envole l'enveloppe */
	root: HTMLElement | null;
	/** La caméra s'approche de la pancarte ou de la boîte aux lettres */
	focus: MiloSchoolFocus | null;
	/** Avancement du gros plan (0 : vue d'ensemble, 1 : caméra arrivée), écrit par la scène */
	zoom: number;
	/** Marge (px) gardée en bas d'écran : la scène se cadre au-dessus */
	bottomPx: number;
	/** Largeur vue par la caméra (unités monde, dans le plan de la façade), écrite par la scène */
	span: number;
	/** Arrivée de la scène par la droite : secondes écoulées depuis le début
	 *  (la scène l'avance ; une nouvelle page d'accueil repart de zéro) */
	arrival: number;
	/** Milo est arrivé à sa place : la bulle peut s'afficher */
	arrived: boolean;
	onArrived: (() => void) | null;
	/** Entrée en classe : taille de la scène (px) avant qu'elle ne s'élargisse
	 *  sous le menu qui s'efface. La caméra garde ce cadrage, puis se recentre
	 *  sur la porte : l'image ne saute pas quand la toile grandit. */
	cover: { width: number; height: number } | null;
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
	root: null,
	focus: null,
	zoom: 0,
	bottomPx: 0,
	span: 0,
	arrival: 0,
	arrived: false,
	onArrived: null,
	cover: null,
	wide: true,
	hovered: null,
	onHover: null,
	onPick: null,
	onExitDone: null,
});

/// La scène 3D de l'accueil survit à la navigation (voir MiloSchoolCanvas) :
/// une fois Milo et l'école affichés, un retour sur l'accueil est immédiat
export const schoolScene = { ready: false };

/// En quittant l'accueil, tout repart hors champ pour une dernière image (voir
/// miloSchool.arrival) : la toile la garde affichée et la montre au retour, le
/// temps de dessiner la première image de l'arrivée suivante. Sans cela, on
/// reverrait un instant la scène en place avant qu'elle ne disparaisse pour arriver.
export const arrivalParking = { epoch: 0 };
export const parkArrivals = () => {
	arrivalParking.epoch++;
};

/// Entrée en classe : Milo marche de sa place jusqu'un pas après la porte en
/// ENTRY_MS (la scène règle sa vitesse et la cadence de ses pas sur cette
/// durée : plus court = il presse le pas). Au retour de l'élève, il ressort
/// de la classe et revient à sa place en EXIT_MS.
export const ENTRY_MS = 2300;
export const EXIT_MS = 3100;

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
