/// Les 3 états de Milo pendant un QCM
export type MiloQcmState = "waiting" | "correct" | "wrong";
export const MILO_QCM_CLIPS: Record<MiloQcmState, string> = {
	/// En attente de la réponse de l'utilisateur : jouée en boucle
	waiting: "Idle",
	/// Bonne réponse : jouée une fois, puis retour à l'attente
	correct: "Success",
	/// Mauvaise réponse : jouée une fois, puis retour à l'attente
	wrong: "Disapointed",
};

export const MILO_QCM_CROSSFADE = 0.3;
