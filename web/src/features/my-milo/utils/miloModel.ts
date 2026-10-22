import * as THREE from "three";

/// Modèle 3D de Milo. Contient les clips : 67, Arrival, Disapointed,
/// EquipGlasses, EquipTop, Explaining, HatLook, Hello, Idle, Idle2, Idle3,
/// Success, Thinking, Wrong.
///
/// Fichier compressé (meshopt + WebP, 11,7 Mo → 2,4 Mo) : après chaque export
/// depuis Blender, le repasser dans tools/optimize-milo-glb. Un GLTFLoader
/// créé à la main doit recevoir le décodeur meshopt (cf. miloAvatar.ts).
export const MILO_MODEL_PATH = "/MiloV15.glb";

/// Maillage du corps de Milo dans les fichiers .glb : tout autre maillage du
/// modèle est un accessoire équipable (masqué tant qu'il n'est pas équipé).
export const BODY_MESH_NAME = "Milo";

/// Torse de Milo (ventre, dos, épaules, haut des bras), détaché du corps dans
/// MiloV12.glb. Il est masqué quand un haut est porté : la fourrure ne peut
/// alors plus traverser le vêtement, quelle que soit l'animation.
export const TORSO_MESH_NAME = "Milo_torse";

/// Nœuds qui forment le corps de Milo (jamais traités comme des accessoires)
const BODY_PART_NAMES = new Set([BODY_MESH_NAME, TORSO_MESH_NAME]);

/// Propriété personnalisée posée dans Blender sur un haut (t-shirt, pull…) et
/// exportée dans le .glb (extras du nœud → userData côté three) : quand
/// l'accessoire est visible, le torse de Milo est masqué.
export const COVERS_TORSO_FLAG = "cache_torse";

/// Hauts connus, au cas où un .glb serait exporté sans les propriétés
/// personnalisées (option « Custom Properties » décochée)
const KNOWN_TORSO_COVERING_MESH_NAMES = new Set(["tshirt"]);

/// Accessoires présents dans MiloV9 / V10 / V11 .glb. Cette base dépend du
/// fichier 3D, pas du catalogue : elle garantit qu'un Milo "nu" reste nu même
/// quand la boutique est vide ou pas encore chargée.
export const KNOWN_ACCESSORY_MESH_NAMES = [
	"3dglasses",
	"glasses",
	"pixelglasses",
	"tie",
	"tophat",
];

/// Clips d'animation présents dans MiloV11.glb. Une danse (cosmétique de
/// type "dance") référence l'un d'eux dans son champ `mesh_name`.
/// Liste tenue à jour d'après le .glb lui-même : un clip qui n'y figure pas
/// ne joue jamais, la case de la boutique resterait vide.
/// EquipTop et EquipGlasses n'y figurent pas exprès : ce sont les réactions
/// de « Mon Milo » quand on équipe un haut ou des lunettes, pas des danses.
/// Idle2 et Idle3 non plus : ce sont des attentes (cf. IDLE_CLIPS).
export const KNOWN_ANIMATION_CLIPS = [
	"67",
	"Arrival",
	"Disapointed",
	"Explaining",
	"HatLook",
	"Hello",
	"Idle",
	"Thinking",
	"Wrong",
];

/// Meshes des accessoires équipables. Ils sont exclus du cadrage automatique
/// pour que Milo garde la même taille quoi qu'il porte.
///
/// Base : les accessoires connus du .glb. Complétée par le catalogue de
/// cosmétiques (champ `mesh_name`, cf. useEquippedMeshNames) dès qu'il est
/// chargé, pour les objets ajoutés au modèle plus tard.
export const ACCESSORY_MESH_NAMES = new Set<string>(KNOWN_ACCESSORY_MESH_NAMES);

export function registerAccessoryMeshNames(names: Iterable<string>) {
	for (const name of names) ACCESSORY_MESH_NAMES.add(name);
}

/// Vrai si l'objet appartient au corps de Milo : le nœud `Milo` (ou son torse
/// `Milo_torse`) lui-même, ou l'un de ses sous-maillages quand le .glb découpe
/// le corps en plusieurs primitives (le chargeur crée alors un groupe `Milo`
/// contenant des meshes).
export function isBodyPart(object: THREE.Object3D) {
	let current: THREE.Object3D | null = object;
	while (current) {
		if (BODY_PART_NAMES.has(current.name)) return true;
		current = current.parent;
	}
	return false;
}

/// Vrai si l'accessoire est un haut qui recouvre le torse
export function coversTorso(accessory: THREE.Object3D) {
	return (
		accessory.userData?.[COVERS_TORSO_FLAG] === true ||
		KNOWN_TORSO_COVERING_MESH_NAMES.has(accessory.name)
	);
}

/// Masque le torse de Milo si un haut visible le recouvre, l'affiche sinon.
/// Sans effet sur un ancien .glb qui n'a pas de torse séparé.
export function updateTorsoVisibility(scene: THREE.Object3D) {
	let covered = false;
	forEachAccessoryRoot(scene, (accessory) => {
		if (accessory.visible && coversTorso(accessory)) covered = true;
	});
	scene.traverse((child) => {
		if (child.name === TORSO_MESH_NAME) child.visible = !covered;
	});
}

function containsMesh(object: THREE.Object3D) {
	if ((object as THREE.Mesh).isMesh) return true;
	let found = false;
	object.traverse((child) => {
		if ((child as THREE.Mesh).isMesh) found = true;
	});
	return found;
}

function containsBody(object: THREE.Object3D) {
	let found = false;
	object.traverse((child) => {
		if (BODY_PART_NAMES.has(child.name)) found = true;
	});
	return found;
}

/// Parcourt les accessoires du modèle en s'arrêtant à leur nœud racine : c'est
/// lui qui porte le nom attendu (`tophat`, `angelcircle`…) et qui doit être
/// affiché ou masqué. Descendre plus bas tomberait sur les primitives d'un
/// accessoire multi-matériaux (`diplomhat` en a trois), dont les noms ne
/// correspondent à rien dans le catalogue.
///
/// Un accessoire se définit par la négative — tout ce qui n'est pas le corps —
/// et non par une liste de noms : cette liste vient du catalogue backend, donc
/// en asynchrone, et tout ce qui en dépendait se comportait différemment selon
/// que la requête avait répondu ou non.
///
/// Les accessoires sont accrochés aux os (`angelcircle` sous `head_1`, `tie`
/// sous `chest`) : on traverse donc les os et le conteneur du squelette sans
/// jamais les prendre pour des accessoires.
export function forEachAccessoryRoot(
	scene: THREE.Object3D,
	callback: (accessory: THREE.Object3D) => void,
) {
	const visit = (parent: THREE.Object3D) => {
		for (const child of parent.children) {
			if (isBodyPart(child)) continue;
			/// Os, armature, ou tout nœud qui contient le corps : ce sont des
			/// conteneurs, on descend dedans
			if ((child as THREE.Bone).isBone || containsBody(child)) {
				visit(child);
				continue;
			}
			if (containsMesh(child)) {
				callback(child);
				continue;
			}
			visit(child);
		}
	};
	visit(scene);
}

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
		(child as THREE.Mesh).frustumCulled = false;
	});
	/// Tout accessoire reste masqué tant qu'il n'est pas équipé, y compris ceux
	/// que le catalogue n'a pas encore fait connaître
	forEachAccessoryRoot(scene, (accessory) => {
		accessory.visible = false;
	});
	updateTorsoVisibility(scene);
	applyAngelCircleGlow(scene);
	applyMetalReflections(scene);
}

/* ==========================================================================
   REFLETS — accessoires métalliques (couronne en or…)
   ========================================================================== */

/// À partir de cette « metalness », un matériau se comporte comme un métal
const METAL_THRESHOLD = 0.5;
/// Marqueur des matériaux déjà traités (partagés entre tous les clones)
const METAL_FLAG = "miloMetalReflections";

let studioEnvMap: THREE.Texture | null = null;

/// Petit studio peint une fois : ciel clair, horizon crème, sol chaud et deux
/// boîtes à lumière qui font briller les arêtes. Quelques ko, aucun fichier
/// HDR à charger ; le renderer le convertit lui-même en carte de reflets.
function getStudioEnvMap() {
	if (studioEnvMap) return studioEnvMap;
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 128;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, "#ffffff");
		gradient.addColorStop(0.42, "#fff4e4");
		gradient.addColorStop(0.55, "#e8c9a2");
		gradient.addColorStop(1, "#6b4a32");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(36, 20, 44, 26);
		ctx.fillRect(168, 28, 32, 20);
	}
	studioEnvMap = new THREE.CanvasTexture(canvas);
	studioEnvMap.mapping = THREE.EquirectangularReflectionMapping;
	studioEnvMap.colorSpace = THREE.SRGBColorSpace;
	return studioEnvMap;
}

/// Un métal n'a pas de couleur propre : il ne montre que ce qu'il reflète.
/// Sans carte d'environnement (accueil, duels, QCM, avatar…), la couronne en
/// or ne reflète rien et paraît presque noire. Les matériaux métalliques
/// reçoivent donc leurs propres reflets ; le reste de Milo n'est pas touché.
export function applyMetalReflections(scene: THREE.Object3D) {
	scene.traverse((child) => {
		const mesh = child as THREE.Mesh;
		if (!mesh.isMesh) return;
		const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
		for (const material of materials) {
			const standard = material as THREE.MeshStandardMaterial;
			if (!standard?.isMeshStandardMaterial || standard.userData[METAL_FLAG]) continue;
			if (standard.metalness < METAL_THRESHOLD || standard.envMap) continue;
			standard.envMap = getStudioEnvMap();
			standard.userData[METAL_FLAG] = true;
			standard.needsUpdate = true;
		}
	});
}

/// N'affiche que les accessoires équipés dans "Mon Milo". Un haut équipé
/// masque en plus le torse de Milo (cf. updateTorsoVisibility).
export function applyEquippedAccessories(
	scene: THREE.Object3D,
	equippedMeshNames: Iterable<string>,
) {
	const equipped = new Set(equippedMeshNames);
	forEachAccessoryRoot(scene, (accessory) => {
		accessory.visible = equipped.has(accessory.name);
	});
	updateTorsoVisibility(scene);
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
		/// Seul le corps sert de référence. Se baser sur la liste des accessoires
		/// rendait le cadrage dépendant du catalogue backend : tant qu'il n'avait
		/// pas répondu, une auréole ou un chapeau flottant au-dessus de la tête
		/// entrait dans la mesure et rapetissait Milo — d'où un cadrage correct
		/// ou non selon la vitesse de la requête.
		if (!isBodyPart(child)) return;

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
	scene.position.set(0, 0, 0);
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

const warnedFallbacks = new Set<string>();

/// Prévient une fois par clip, en développement, quand l'animation souhaitée
/// n'est pas dans le .glb et qu'un remplaçant est joué à sa place. Sans ça, le
/// repli est invisible : on croit avoir configuré un clip qui ne joue jamais.
export function warnClipFallbackOnce(label: string, wanted: string, used: string) {
	if (!import.meta.env.DEV) return;
	const key = `${label}:${wanted}`;
	if (warnedFallbacks.has(key)) return;
	warnedFallbacks.add(key);
	console.warn(
		`[${label}] Le clip "${wanted}" n'existe pas dans ${MILO_MODEL_PATH} — "${used}" est joué à la place.`,
	);
}

/// Première action existante parmi plusieurs noms de clips candidats, ou null.
/// Permet de viser un clip pas encore exporté dans le .glb tout en gardant un
/// remplaçant jouable en attendant.
export function findFirstAction(
	actions: Record<string, THREE.AnimationAction | null>,
	clipNames: readonly string[],
) {
	for (const clipName of clipNames) {
		const action = findAction(actions, clipName);
		if (action) return action;
	}
	return null;
}

/* ==========================================================================
   ATTENTES — Milo alterne entre plusieurs idles
   ========================================================================== */

/// Les attentes de Milo (Idle : 10 s ; Idle2 et Idle3 : 8 s, un peu plus
/// vives). Elles commencent et finissent sur la même pose : on peut passer de
/// l'une à l'autre à chaque fin de boucle sans à-coup. "Idle" reste la première
/// jouée, et la seule si un ancien .glb n'a pas les autres.
export const IDLE_CLIPS = ["Idle", "Idle2", "Idle3"];

/// Vrai si l'action joue l'une des attentes
export function isIdleAction(action: THREE.AnimationAction | null | undefined) {
	const name = action?.getClip().name.toLowerCase();
	return Boolean(name) && IDLE_CLIPS.some((clip) => clip.toLowerCase() === name);
}

/// Une autre attente que `current`, au hasard parmi celles du modèle ; null
/// s'il n'y en a pas d'autre (l'attente en cours continue alors de boucler)
export function nextIdleAction(
	actions: Record<string, THREE.AnimationAction | null>,
	current: THREE.AnimationAction | null,
) {
	const others = IDLE_CLIPS.map((clip) => findAction(actions, clip)).filter(
		(action): action is THREE.AnimationAction => Boolean(action) && action !== current,
	);
	return others.length ? others[Math.floor(Math.random() * others.length)] : null;
}

/// Branche l'alternance des attentes sur un mixer : quand l'attente en cours
/// (`getCurrent`) termine une boucle, `play` reçoit l'attente suivante, à
/// lancer en boucle avec un fondu. Une réaction ou une danse en cours n'est
/// jamais interrompue : seule une attente qui boucle déclenche le relais.
/// Renvoie la fonction de désabonnement (à rendre depuis un useEffect).
export function alternateIdlesOnLoop(
	mixer: THREE.AnimationMixer,
	actions: Record<string, THREE.AnimationAction | null>,
	getCurrent: () => THREE.AnimationAction | null,
	play: (next: THREE.AnimationAction) => void,
) {
	const onLoop = (event: { action: THREE.AnimationAction }) => {
		if (event.action !== getCurrent() || !isIdleAction(event.action)) return;
		const next = nextIdleAction(actions, event.action);
		if (next) play(next);
	};
	mixer.addEventListener("loop", onLoop);
	return () => {
		mixer.removeEventListener("loop", onLoop);
	};
}

/* ==========================================================================
   AURÉOLE — éclat lumineux, appliqué à ce seul maillage
   ========================================================================== */

/// Maillage de l'auréole dans MiloV11.glb
export const ANGEL_CIRCLE_MESH_NAME = "angelcircle";

/// Doré, volontairement plus clair que la couleur de base du maillage
const GLOW_COLOR = "#ffd98a";
/// Intensité au repos, et amplitude du battement
const GLOW_BASE = 1.5;
const GLOW_AMPLITUDE = 0.9;
/// Le halo additif qui entoure l'anneau
const HALO_NAME = "__miloAngelHalo";
const HALO_SCALE = 1.16;
const HALO_OPACITY = 0.32;

/// Marqueur posé sur les matériaux déjà traités : la scène du .glb est mise en
/// cache et partagée entre les écrans, on ne veut pas empiler les traitements
const GLOW_FLAG = "miloAngelGlow";

/// Fait briller l'auréole — et uniquement elle. Le reste de Milo garde son
/// matériau d'origine.
///
/// Pas de post-traitement (bloom) : il faudrait un EffectComposer sur chaque
/// canvas où Milo apparaît, et le rendu hors écran des avatars n'en a pas.
/// Un matériau émissif non affecté par le tone mapping, doublé d'un halo
/// additif, donne l'éclat partout et ne coûte rien.
export function applyAngelCircleGlow(scene: THREE.Object3D) {
	const halo = scene.getObjectByName(ANGEL_CIRCLE_MESH_NAME);
	if (!halo) return;

	halo.traverse((child) => {
		const mesh = child as THREE.Mesh;
		if (!mesh.isMesh || mesh.name === HALO_NAME) return;

		const material = mesh.material as THREE.MeshStandardMaterial;
		if (!material) return;

		/// Les clones de Milo partagent les matériaux du modèle en cache : on ne
		/// traite celui-ci qu'une fois, sinon on empile les traitements
		if (!material.userData[GLOW_FLAG]) {
			material.emissive = new THREE.Color(GLOW_COLOR);
			material.emissiveIntensity = GLOW_BASE;
			/// Sans ça, le tone mapping ACES écrase l'éclat et l'anneau redevient
			/// un simple objet doré
			material.toneMapped = false;
			material.userData[GLOW_FLAG] = true;
			material.needsUpdate = true;
		}

		/// L'enveloppe, elle, est un objet de la scène : chaque Milo affiché a
		/// besoin de la sienne. La poser sous condition du matériau privait de
		/// halo tous les clones sauf le premier.
		if (mesh.getObjectByName(HALO_NAME)) return;

		/// Enveloppe additive : c'est elle qui donne le débordement lumineux
		const shell = new THREE.Mesh(
			mesh.geometry,
			new THREE.MeshBasicMaterial({
				color: new THREE.Color(GLOW_COLOR),
				transparent: true,
				opacity: HALO_OPACITY,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				toneMapped: false,
				side: THREE.BackSide,
			}),
		);
		shell.name = HALO_NAME;
		shell.scale.setScalar(HALO_SCALE);
		shell.frustumCulled = false;
		mesh.add(shell);
	});
}

/// Anime l'éclat : battement lumineux et lente rotation de l'anneau.
/// À appeler depuis un useFrame, là où la boucle de rendu tourne déjà.
/// Sans appel, l'auréole reste brillante mais fixe.
export function updateAngelCircleGlow(scene: THREE.Object3D, elapsed: number) {
	const halo = scene.getObjectByName(ANGEL_CIRCLE_MESH_NAME);
	if (!halo || !halo.visible) return;

	const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.4);
	halo.rotation.y = elapsed * 0.7;

	halo.traverse((child) => {
		const mesh = child as THREE.Mesh;
		if (!mesh.isMesh) return;

		if (mesh.name === HALO_NAME) {
			const shellMaterial = mesh.material as THREE.MeshBasicMaterial;
			shellMaterial.opacity = HALO_OPACITY * (0.55 + 0.45 * pulse);
			mesh.scale.setScalar(HALO_SCALE + 0.05 * pulse);
			return;
		}

		const material = mesh.material as THREE.MeshStandardMaterial;
		if (material?.userData[GLOW_FLAG]) {
			material.emissiveIntensity = GLOW_BASE + GLOW_AMPLITUDE * pulse;
		}
	});
}
