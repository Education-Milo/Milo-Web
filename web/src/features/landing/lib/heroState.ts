/// État partagé entre l'animation GSAP du hero (DOM) et la scène 3D
/// (React Three Fiber). Lu à chaque frame dans useFrame : un simple objet
/// mutable évite un re-render React à chaque événement de scroll ou de souris.
/// `progress` et `launch` sont animés directement par la timeline scrubbée du
/// hero : la 3D suit donc le même lissage que le DOM, dans les deux sens.
export const heroState = {
	/// 0 au repos, 1 quand on a quitté le hero (les jouets 3D s'écartent)
	progress: 0,
	/// Décollage de la fusée : 0 au sol, 0 → 0.3 allumage, 0.3 → 1 envol
	launch: 0,
	/// Position du pointeur dans la fenêtre, normalisée entre -0.5 et 0.5
	pointerX: 0,
	pointerY: 0,
};
