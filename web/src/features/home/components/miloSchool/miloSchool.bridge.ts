/// Pont entre l'interface (React) et la scène 3D : un objet mutable, lu à
/// chaque image dans useFrame. L'interface y écrit ses intentions sans
/// provoquer de rendu React de la scène, la scène y publie ses ancres.

export type MiloSchoolPhase = "idle" | "inviting" | "entering";

export interface MiloSchoolBridge {
	/** Porte ouverte (cible ; la scène amortit le mouvement) */
	doorOpen: boolean;
	/** idle : Milo attend ; inviting : il montre la porte ; entering : il rentre en classe */
	phase: MiloSchoolPhase;
	/** Animations ponctuelles à jouer (clic sur Milo…), par nom de clip */
	reactions: string[];
	/** Bulle : la scène y écrit la position de la tête de Milo (variables CSS) */
	bubble: HTMLElement | null;
	/** Hauteur (px) réservée en bas de carte au bouton : la scène se cadre au-dessus */
	bottomPx: number;
	/** Survol de la porte ou de Milo dans la scène */
	onHover: ((part: "door" | "milo" | null) => void) | null;
	onDoorClick: (() => void) | null;
	onMiloClick: (() => void) | null;
}

export const createMiloSchoolBridge = (): MiloSchoolBridge => ({
	doorOpen: false,
	phase: "idle",
	reactions: [],
	bubble: null,
	bottomPx: 0,
	onHover: null,
	onDoorClick: null,
	onMiloClick: null,
});

/// Entrée en classe : Milo fait ENTRY_HOPS petits sauts de HOP_SECONDS chacun
export const HOP_SECONDS = 0.34;
export const ENTRY_HOPS = 4;
export const ENTRY_MS = HOP_SECONDS * ENTRY_HOPS * 1000;

/// Pas de temps d'une image, borné : jamais négatif ni énorme (onglet revenu au
/// premier plan, horloge capricieuse), sinon amortis et ressorts s'emballent
export const frameStep = (delta: number) => (Number.isFinite(delta) && delta > 0 ? Math.min(delta, 0.1) : 0);
