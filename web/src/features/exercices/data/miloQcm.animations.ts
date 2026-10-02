/// Les 3 états de Milo pendant un QCM
export type MiloQcmState = "waiting" | "correct" | "wrong";

/// Clips candidats pour chaque état, par ordre de préférence : le premier
/// présent dans MiloV11.glb est joué.
///
/// Viser un clip qui n'existe pas encore est donc sans danger — il suffit de le
/// placer en tête de liste, il prendra le relais le jour de son export. Garder
/// un remplaçant derrière est en revanche indispensable : sans animation à
/// jouer, Milo restait figé sur la dernière frame de son attente.
export const MILO_QCM_CLIPS: Record<MiloQcmState, readonly string[]> = {
	/// En attente de la réponse de l'utilisateur : jouée en boucle
	waiting: ["Idle"],
	/// Bonne réponse : jouée une fois, puis retour à l'attente
	correct: ["Success"],
	/// Mauvaise réponse : jouée une fois, puis retour à l'attente
	wrong: ["Disapointed", "Wrong"],
};

export const MILO_QCM_CROSSFADE = 0.3;
