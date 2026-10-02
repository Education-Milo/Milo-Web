import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { MILO_MODEL_PATH } from "@features/my-milo/utils/miloModel";

/// Instance de Milo réservée à l'écran qui l'appelle.
///
/// `useGLTF` met la scène du .glb en cache et rend le MÊME objet à tous les
/// écrans. La monter telle quelle a deux conséquences :
///
///  - Les transformations d'un écran restent sur le modèle. React Three Fiber
///    ne restaure pas les props d'un `<primitive>` au démontage (le modèle
///    peut être piloté hors de React) : la rotation de la salle de classe
///    suivait Milo jusqu'à la page d'accueil, où il apparaissait de travers.
///  - Un objet 3D n'a qu'un seul parent : deux Milo à l'écran en même temps se
///    volent le modèle, l'un des deux disparaît.
///
/// Le clone copie les nœuds et le squelette ; géométries et matériaux restent
/// partagés, donc c'est bon marché.
export function useMiloInstance(path: string = MILO_MODEL_PATH) {
	const { scene: template, animations } = useGLTF(path);
	const scene = useMemo(() => cloneSkinned(template), [template]);
	return { scene, animations };
}
