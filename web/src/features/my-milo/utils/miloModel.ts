import * as THREE from "three";
import { MILO_ITEMS } from "@features/my-milo/data/miloItems.data";

/// Modèle 3D de Milo. Contient les clips : Arrival, Disapointed, Explaining,
/// HatLook, Hello, Idle, Thinking, Wrong.
export const MILO_MODEL_PATH = "/MiloV11.glb";

/// Meshes des accessoires équipables. Ils sont exclus du cadrage automatique
/// pour que Milo garde la même taille quoi qu'il porte.
export const ACCESSORY_MESH_NAMES = new Set(
	MILO_ITEMS.map((item) => item.meshName).filter(Boolean) as string[],
);

/// À appeler pendant la phase de rendu, avant le premier frame : masque Milo
/// tant que sa pose n'est pas appliquée (sinon il apparaît une frame en T-pose
/// avec tous les accessoires visibles) et désactive le frustum culling.
///
/// Three met en cache la sphère englobante de chaque mesh dans la pose du
/// premier rendu. Les petits meshes du visage (yeux, sourcils, truffe) en
/// sortent dès que la tête bouge et se font éliminer : Milo se retrouve sans
/// yeux ni truffe. Pour un personnage seul qui remplit le cadre, ce culling
/// n'apporte rien.
export function prepareMiloScene(scene: THREE.Object3D) {
	scene.visible = false;
	scene.traverse((child) => {
		if (ACCESSORY_MESH_NAMES.has(child.name)) child.visible = false;
		(child as THREE.Mesh).frustumCulled = false;
	});
}

/// N'affiche que les accessoires équipés dans "Mon Milo"
export function applyEquippedAccessories(
	scene: THREE.Object3D,
	equippedMeshNames: string[],
) {
	scene.traverse((child) => {
		if (ACCESSORY_MESH_NAMES.has(child.name)) {
			child.visible = equippedMeshNames.includes(child.name);
		}
	});
}

/// Boîte englobante du corps de Milo, accessoires exclus, exprimée dans le
/// repère du parent de `scene` — celui où s'appliquent scene.position et
/// scene.scale — sans dépendre des groupes au-dessus (cadrage, rotation…).
/// Le modèle porte sa propre rotation : mesurer dans son repère local
/// donnerait la hauteur sur le mauvais axe.
export function getBodyBox(scene: THREE.Object3D) {
	const box = new THREE.Box3();
	const meshBox = new THREE.Box3();
	const toParentSpace = new THREE.Matrix4();
	scene.updateWorldMatrix(true, true);
	const parentInverse = new THREE.Matrix4();
	if (scene.parent) parentInverse.copy(scene.parent.matrixWorld).invert();

	scene.traverse((child) => {
		const mesh = child as THREE.SkinnedMesh;
		if (!mesh.isMesh) return;
		if (ACCESSORY_MESH_NAMES.has(child.name)) return;

		let localBox: THREE.Box3 | null = null;
		if (mesh.isSkinnedMesh) {
			if (!mesh.boundingBox) mesh.computeBoundingBox();
			localBox = mesh.boundingBox;
		} else {
			if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
			localBox = mesh.geometry.boundingBox;
		}
		if (!localBox) return;

		toParentSpace.multiplyMatrices(parentInverse, mesh.matrixWorld);
		meshBox.copy(localBox).applyMatrix4(toParentSpace);
		if (!meshBox.isEmpty()) box.union(meshBox);
	});
	return box;
}

export function fitMiloToHeight(scene: THREE.Object3D, targetHeight: number) {
	scene.position.set(-0.35, 0, 0);
	scene.scale.setScalar(1);

	const box = getBodyBox(scene);
	if (box.isEmpty()) return;
	const size = box.getSize(new THREE.Vector3());
	const center = box.getCenter(new THREE.Vector3());
	if (size.y === 0) return;

	const scale = targetHeight / size.y;
	scene.scale.setScalar(scale);
	scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}

export function cameraDistanceFor(frameHeight: number, fovDeg: number) {
	return frameHeight / (2 * Math.tan((fovDeg * Math.PI) / 360));
}

export function findAction(
	actions: Record<string, THREE.AnimationAction | null>,
	clipName: string,
) {
	const key = Object.keys(actions).find(
		(name) => name.toLowerCase() === clipName.toLowerCase(),
	);
	return key ? (actions[key] ?? null) : null;
}
