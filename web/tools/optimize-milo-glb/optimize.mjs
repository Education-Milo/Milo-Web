// Allège le .glb de Milo exporté depuis Blender, sans changer ce qui s'affiche
// (MiloV17 : 12,2 Mo → ~2 Mo).
//
// Usage, depuis ce dossier :
//   npm install
//   node optimize.mjs "<export Blender>.glb" ../../public/MiloV17.glb
//
// 0. Ne garde que la hiérarchie « rig » : le metarig et les formes des
//    contrôleurs Rigify (WGT-…) partent avec l'export Blender mais ne servent
//    qu'à l'animateur.
// 1. Retire les pistes d'animation des os qui ne déforment aucun sommet et ne
//    portent aucun accessoire : contrôleurs et os MCH du rig Rigify. Les os
//    pondérés, ceux qui portent un maillage (tie sous chest, auréole sous la
//    tête…) et tous leurs parents gardent leurs pistes.
// 2. Retire les pistes constantes égales à la pose de repos de l'os : three.js
//    remet de lui-même un os à son état d'origine quand aucun clip ne le
//    pilote, y compris pendant les fondus enchaînés.
// 3. Supprime les os inutiles (ni pondérés, ni porteurs d'un accessoire, ni
//    parents d'un os utile) et les retire du squelette (269 → ~100 os : moins
//    de nœuds à mettre à jour et de matrices à envoyer à la carte graphique à
//    chaque image). Les os gardés ne changent ni de nom ni de parent, et
//    restent tous des os du squelette : le code qui cherche les accessoires
//    (forEachAccessoryRoot) descend dans les os pour les trouver.
// 4. Partage les données identiques (les deux t-shirts ont la même géométrie).
//    (Retirer les clés d'animation redondantes a été essayé : le fichier
//    grossit, chaque piste devant alors porter ses propres temps.)
// 5. Textures PNG → WebP sans perte.
// 6. Compression meshopt (EXT_meshopt_compression) de la géométrie et des
//    animations. Les positions des sommets restent des flottants (la
//    quantification déplacerait l'origine des accessoires, sur laquelle le
//    code s'appuie : halo de l'auréole) ; elles sont seulement arrondies au
//    1/4096 d'unité (0,06 mm à l'écran), ce qui se compresse bien mieux.
//
// Les noms des nœuds, maillages, matériaux et clips et les propriétés
// personnalisées (extras) sont conservés : le code et la boutique s'y réfèrent.
// Le site doit charger le fichier avec le décodeur meshopt : useGLTF (drei) le
// fait par défaut, GLTFLoader a besoin de setMeshoptDecoder (cf. miloAvatar.ts).
import fs from "node:fs";
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, quantize, reorder, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
	console.error('Usage : node optimize.mjs "<export Blender>.glb" <sortie>.glb');
	process.exit(1);
}

/// Écart maximal (par composante) pour qu'une piste soit jugée égale au repos
const REST_TOLERANCE = 1e-5;
/// Pas d'arrondi des positions des sommets (unités du modèle)
const POSITION_STEP = 1 / 4096;
/// Nom du nœud racine du personnage dans l'export
const RIG_NAME = "rig";

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
	.registerExtensions(ALL_EXTENSIONS)
	.registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const document = await io.read(input);
const root = document.getRoot();

if (root.listExtensionsUsed().some((ext) => ext.extensionName === "EXT_meshopt_compression")) {
	console.error(`${input} est déjà compressé : partir de l'export Blender d'origine.`);
	process.exit(1);
}

// 0. Seule la hiérarchie du personnage est gardée
const disposeTree = (node) => {
	for (const child of node.listChildren()) disposeTree(child);
	node.dispose();
};
const nodesBefore = root.listNodes().length;
if (root.listNodes().some((node) => node.getName() === RIG_NAME)) {
	for (const scene of root.listScenes()) {
		for (const node of scene.listChildren()) if (node.getName() !== RIG_NAME) disposeTree(node);
	}
	for (const skin of root.listSkins()) if (!skin.listParents().some((parent) => parent.propertyType === "Node")) skin.dispose();
	for (const mesh of root.listMeshes()) if (!mesh.listParents().some((parent) => parent.propertyType === "Node")) mesh.dispose();
}

const removeChannel = (animation, channel) => {
	const sampler = channel.getSampler();
	channel.dispose();
	if (sampler && sampler.listParents().every((parent) => parent.propertyType === "Root" || parent === animation)) {
		sampler.dispose();
	}
};

// 1. Os utiles : pondérés, porteurs d'un maillage, et leurs parents
const parentOf = new Map();
for (const node of root.listNodes()) for (const child of node.listChildren()) parentOf.set(child, node);
const useful = new Set();
const keepWithAncestors = (node) => {
	for (let current = node; current && !useful.has(current); current = parentOf.get(current)) useful.add(current);
};
for (const node of root.listNodes()) {
	const mesh = node.getMesh();
	if (!mesh) continue;
	keepWithAncestors(node);
	const joints = node.getSkin()?.listJoints();
	if (!joints) continue;
	for (const primitive of mesh.listPrimitives()) {
		for (let set = 0; ; set++) {
			const jointsAttr = primitive.getAttribute(`JOINTS_${set}`);
			const weightsAttr = primitive.getAttribute(`WEIGHTS_${set}`);
			if (!jointsAttr || !weightsAttr) break;
			const j = [];
			const w = [];
			for (let i = 0; i < jointsAttr.getCount(); i++) {
				jointsAttr.getElement(i, j);
				weightsAttr.getElement(i, w);
				for (let k = 0; k < j.length; k++) {
					if (w[k] > 0) keepWithAncestors(joints[j[k]]);
				}
			}
		}
	}
}

let removedUseless = 0;
let removedRest = 0;
for (const animation of root.listAnimations()) {
	for (const channel of animation.listChannels()) {
		const node = channel.getTargetNode();
		if (node && !useful.has(node)) {
			removeChannel(animation, channel);
			removedUseless++;
			continue;
		}
		// 2. Pistes constantes égales à la pose de repos
		const path = channel.getTargetPath();
		const out = channel.getSampler()?.getOutput();
		if (!node || !out || !["translation", "rotation", "scale"].includes(path)) continue;
		const rest = path === "translation" ? node.getTranslation() : path === "rotation" ? node.getRotation() : node.getScale();
		const value = [];
		let atRest = true;
		for (let i = 0; i < out.getCount() && atRest; i++) {
			out.getElement(i, value);
			const dot = value.reduce((sum, v, k) => sum + v * rest[k], 0);
			const sign = path === "rotation" && dot < 0 ? -1 : 1;
			for (let k = 0; k < value.length; k++) if (Math.abs(sign * value[k] - rest[k]) > REST_TOLERANCE) atRest = false;
		}
		if (atRest) {
			removeChannel(animation, channel);
			removedRest++;
		}
	}
}

// 3. Squelette réduit aux os utiles…
let jointsBefore = 0;
let jointsAfter = 0;
for (const skin of root.listSkins()) {
	const joints = skin.listJoints();
	const ibm = skin.getInverseBindMatrices();
	jointsBefore += joints.length;
	const kept = joints.map((joint, index) => (useful.has(joint) ? index : -1)).filter((index) => index >= 0);
	const remap = new Map(kept.map((oldIndex, newIndex) => [oldIndex, newIndex]));
	jointsAfter += kept.length;
	const seen = new Set();
	for (const node of root.listNodes()) {
		if (node.getSkin() !== skin) continue;
		for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
			for (let set = 0; ; set++) {
				const jointsAttr = primitive.getAttribute(`JOINTS_${set}`);
				const weightsAttr = primitive.getAttribute(`WEIGHTS_${set}`);
				if (!jointsAttr || !weightsAttr) break;
				if (seen.has(jointsAttr)) continue;
				seen.add(jointsAttr);
				const j = [];
				const w = [];
				for (let i = 0; i < jointsAttr.getCount(); i++) {
					jointsAttr.getElement(i, j);
					weightsAttr.getElement(i, w);
					// (les influences de poids nul pointent vers le premier os gardé)
					jointsAttr.setElement(i, j.map((index, k) => (w[k] > 0 ? remap.get(index) : 0)));
				}
			}
		}
	}
	if (ibm) {
		const element = [];
		const array = new Float32Array(kept.length * 16);
		kept.forEach((oldIndex, newIndex) => {
			ibm.getElement(oldIndex, element);
			array.set(element, newIndex * 16);
		});
		ibm.setArray(array);
	}
	for (const joint of joints) skin.removeJoint(joint);
	for (const index of kept) skin.addJoint(joints[index]);
}
// … et suppression des os qui ne servent plus à rien
const rig = root.listNodes().find((node) => node.getName() === RIG_NAME);
for (const node of root.listNodes()) {
	if (!useful.has(node) && node !== rig && !node.getMesh() && !node.getCamera()) node.dispose();
}

// 4. Données identiques partagées (temps des clés d'un même clip, géométrie des deux t-shirts)
await document.transform(dedup({ propertyTypes: [PropertyType.ACCESSOR] }));

// Positions arrondies (elles restent des flottants)
const rounded = new Set();
for (const mesh of root.listMeshes()) {
	for (const primitive of mesh.listPrimitives()) {
		const position = primitive.getAttribute("POSITION");
		if (!position || rounded.has(position)) continue;
		rounded.add(position);
		const array = position.getArray();
		for (let i = 0; i < array.length; i++) array[i] = Math.round(array[i] / POSITION_STEP) * POSITION_STEP;
		position.setArray(array);
	}
}

// 5. Textures en WebP sans perte
await document.transform(textureCompress({ encoder: sharp, targetFormat: "webp", lossless: true, effort: 100 }));

// 6. Compression meshopt. Le nettoyage automatique des fonctions est coupé :
//    il pourrait supprimer ou fusionner des nœuds, matériaux ou attributs.
await document.transform(
	reorder({ encoder: MeshoptEncoder, target: "size", cleanup: false }),
	quantize({
		cleanup: false,
		pattern: /^(?!POSITION).*$/,
		quantizeNormal: 8,
		quantizeTexcoord: 14,
		quantizeColor: 8,
		quantizeWeight: 16,
		quantizeGeneric: 12,
	}),
	prune({
		propertyTypes: [PropertyType.ACCESSOR, PropertyType.ANIMATION_SAMPLER],
		keepAttributes: true,
		keepIndices: true,
		keepLeaves: true,
		keepExtras: true,
	}),
);
document
	.createExtension(EXTMeshoptCompression)
	.setRequired(true)
	.setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });

await io.write(output, document);
const mb = (file) => (fs.statSync(file).size / 1e6).toFixed(2);
console.log(
	`${input} (${mb(input)} Mo) → ${output} (${mb(output)} Mo) : ` +
		`${nodesBefore} → ${root.listNodes().length} nœuds, squelette ${jointsBefore} → ${jointsAfter} os, ` +
		`${removedUseless} pistes d'os inutiles et ${removedRest} pistes au repos retirées`,
);
