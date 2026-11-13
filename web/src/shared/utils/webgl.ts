let cached: boolean | undefined;

/**
 * WebGL est-il utilisable sur cet appareil ? Certains postes scolaires,
 * navigateurs verrouillés ou cartes graphiques bloquées le désactivent :
 * three.js échoue alors à chaque image et peut faire planter l'onglet.
 * Le résultat est calculé une fois puis mis en cache.
 */
export function isWebGLAvailable(): boolean {
	if (cached !== undefined) return cached;
	try {
		const canvas = document.createElement("canvas");
		const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
		cached = Boolean(gl);
		// Rend tout de suite le contexte de test : les navigateurs en limitent le nombre
		gl?.getExtension("WEBGL_lose_context")?.loseContext();
	} catch {
		cached = false;
	}
	return cached;
}
