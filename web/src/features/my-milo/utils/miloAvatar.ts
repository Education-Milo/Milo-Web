import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MILO_ITEMS } from "@features/my-milo/data/miloItems.data";

/// Portrait de Milo rendu en image, pour servir de photo de profil.
///
/// Un <Canvas> react-three-fiber par avatar serait ingérable : chaque canvas
/// ouvre un contexte WebGL et les navigateurs en limitent le nombre à une
/// poignée (~8 à 16). Une liste d'amis en dépasse vite le compte. On utilise
/// donc UN seul rendu hors écran, partagé, dont le résultat est mis en cache
/// par combinaison d'accessoires : quelques images pour toute l'application.

const MODEL_PATH = "/MiloV10.glb";
/// Taille de rendu : l'avatar est affiché bien plus petit, on garde de la marge
/// pour les écrans à forte densité
const RENDER_SIZE = 256;
/// Cadrage portrait : tête entière et haut du buste. Le corps tient entre
/// -1.05 et +1.05, le menton est vers 0 et les oreilles vers 1.05.
const FIT_HEIGHT = 2.1;
const FRAME_TOP = 1.3;
const FRAME_HEIGHT = 1.85;
const CAMERA_FOV = 20;

/// Meshes des accessoires équipables
const ACCESSORY_MESH_NAMES = new Set(
	MILO_ITEMS.map((item) => item.meshName).filter(Boolean) as string[],
);

/// Une image par combinaison d'accessoires
const cache = new Map<string, string>();

/// Clé stable, indépendante de l'ordre d'équipement
export const avatarKey = (meshNames: string[]) =>
	[...new Set(meshNames)].sort().join("|") || "nu";

/// Traduit des ids d'objets (ce que stocke le backend) en noms de meshes.
/// Les ids sont la donnée stable : les noms de meshes dépendent du fichier .glb.
export const meshNamesForItemIds = (itemIds: number[]) =>
	itemIds
		.map((id) => MILO_ITEMS.find((item) => item.id === id)?.meshName)
		.filter(Boolean) as string[];

/// Boîte englobante du corps, accessoires exclus, pour que Milo garde la même
/// taille quoi qu'il porte
function measureBody(model: THREE.Object3D) {
	const box = new THREE.Box3();
	const meshBox = new THREE.Box3();
	model.updateMatrixWorld(true);
	model.traverse((child) => {
		const mesh = child as THREE.SkinnedMesh;
		if (!mesh.isMesh || ACCESSORY_MESH_NAMES.has(child.name)) return;
		meshBox.setFromObject(mesh);
		if (!meshBox.isEmpty()) box.union(meshBox);
	});
	return box;
}

interface Rig {
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	model: THREE.Object3D;
}

let rigPromise: Promise<Rig> | null = null;

function buildRig(): Promise<Rig> {
	return new Promise<Rig>((resolve, reject) => {
		new GLTFLoader().load(
			MODEL_PATH,
			(gltf) => {
				const model = gltf.scene;

				/// La pose de bind est une T-pose : on applique la première frame de
				/// l'animation d'attente pour obtenir un portrait naturel
				const idle =
					gltf.animations.find((clip) => clip.name.toLowerCase() === "idle") ??
					gltf.animations[0];
				if (idle) {
					const mixer = new THREE.AnimationMixer(model);
					mixer.clipAction(idle).play();
					mixer.update(0);
				}

				/// Three met en cache la sphère englobante de chaque mesh : les petits
				/// meshes du visage se font sinon éliminer par le frustum culling et
				/// Milo perd ses yeux et sa truffe
				model.traverse((child) => {
					(child as THREE.Mesh).frustumCulled = false;
				});

				const scene = new THREE.Scene();
				const holder = new THREE.Group();
				holder.add(model);
				scene.add(holder);

				const box = measureBody(model);
				if (!box.isEmpty()) {
					const size = box.getSize(new THREE.Vector3());
					const center = box.getCenter(new THREE.Vector3());
					if (size.y > 0) {
						const scale = FIT_HEIGHT / size.y;
						model.scale.setScalar(scale);
						model.position.set(
							-center.x * scale,
							-center.y * scale,
							-center.z * scale,
						);
					}
				}
				/// Amène la tête au centre du cadre
				holder.position.y = -(FRAME_TOP - FRAME_HEIGHT / 2);

				scene.add(new THREE.AmbientLight(new THREE.Color("#fff1e2"), 1.6));
				scene.add(
					new THREE.HemisphereLight(
						new THREE.Color("#ffffff"),
						new THREE.Color("#c4693a"),
						0.7,
					),
				);
				const keyLight = new THREE.DirectionalLight(
					new THREE.Color("#fffaf3"),
					2.2,
				);
				keyLight.position.set(3, 5, 4);
				scene.add(keyLight);
				const fillLight = new THREE.DirectionalLight(
					new THREE.Color("#ffd9b8"),
					0.7,
				);
				fillLight.position.set(-4, 2, 2);
				scene.add(fillLight);

				const distance =
					FRAME_HEIGHT / (2 * Math.tan((CAMERA_FOV * Math.PI) / 360));
				const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
				camera.position.set(0, 0, distance);
				camera.lookAt(0, 0, 0);

				const renderer = new THREE.WebGLRenderer({
					alpha: true,
					antialias: true,
					/// Nécessaire pour relire le canvas avec toDataURL
					preserveDrawingBuffer: true,
				});
				renderer.setSize(RENDER_SIZE, RENDER_SIZE);
				renderer.setPixelRatio(1);
				renderer.setClearAlpha(0);

				resolve({ renderer, scene, camera, model });
			},
			undefined,
			reject,
		);
	});
}

/// Rend — ou retourne depuis le cache — le portrait de Milo portant `meshNames`.
/// Renvoie une data-URL PNG, ou null si le modèle n'a pas pu être chargé
/// (l'appelant retombe alors sur les initiales).
export async function renderMiloAvatar(
	meshNames: string[],
): Promise<string | null> {
	const key = avatarKey(meshNames);
	const cached = cache.get(key);
	if (cached) return cached;

	try {
		if (!rigPromise) rigPromise = buildRig();
		const rig = await rigPromise;

		const equipped = new Set(meshNames);
		rig.model.traverse((child) => {
			if (ACCESSORY_MESH_NAMES.has(child.name)) {
				child.visible = equipped.has(child.name);
			}
		});

		rig.renderer.render(rig.scene, rig.camera);
		const url = rig.renderer.domElement.toDataURL("image/png");
		cache.set(key, url);
		return url;
	} catch {
		return null;
	}
}
