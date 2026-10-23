/// « Tout enlever » : calendrier et pose de la pirouette (cf. MiloPoof.component)

/// Calendrier (en secondes depuis le clic)
export const POOF_TIMING = {
	/// Fin de la pirouette (atterrissage compris)
	duration: 1.05,
	/// Instant où les accessoires disparaissent : le nuage couvre déjà Milo
	hideAt: 0.36,
	/// Apparition des bouffées de fumée
	smokeStart: 0.14,
	/// Durée de vie d'une bouffée
	smokeLife: 1.05,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/// Arche 0 → 1 → 0 entre a et b, nulle ailleurs
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));
export const smootherstep = (x: number) => {
	const t = clamp01(x);
	return t * t * t * (t * (t * 6 - 15) + 10);
};

/// Pose de la pirouette à l'instant t : accroupi, saut avec un tour complet,
/// réception amortie. `lift` est exprimé en fraction de la taille de Milo.
export function pirouetteAt(t: number) {
	const squash =
		1 - 0.08 * bump(t, 0, 0.16) + 0.05 * bump(t, 0.16, 0.5) - 0.07 * bump(t, 0.78, 0.98);
	return {
		rotationY: Math.PI * 2 * smootherstep((t - 0.12) / 0.7),
		lift: 0.11 * bump(t, 0.15, 0.8),
		scaleY: squash,
		scaleXZ: 1 / Math.sqrt(squash),
	};
}
