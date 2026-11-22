// Allège la salle de classe (classroom2.glb) sans changer ce qui s'affiche.
//
// Usage, depuis ce dossier :
//   npm install
//   node optimize-classroom.mjs ../../public/classroom2.glb <sortie>.glb
//
// 1. Textures (éclairage précalculé dans Blender, JPEG) → WebP qualité 90 :
//    même rendu à l'œil, environ trois fois plus léger.
// 2. Compression meshopt de la géométrie. Les positions des sommets restent
//    des flottants (pas de quantification) : quantifier ajouterait une échelle
//    et un décalage aux nœuds, or le code s'appuie sur leurs transformations
//    (pivot de la porte, cadre de l'ardoise…).
//
// Noms des nœuds, maillages et matériaux conservés : le code s'y réfère.
// useGLTF (drei) charge le décodeur meshopt de lui-même.
import fs from "node:fs";
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { prune, quantize, reorder, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
	console.error("Usage : node optimize-classroom.mjs <entrée>.glb <sortie>.glb");
	process.exit(1);
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
	.registerExtensions(ALL_EXTENSIONS)
	.registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const document = await io.read(input);

await document.transform(
	textureCompress({ encoder: sharp, targetFormat: "webp", quality: 90, effort: 100 }),
	reorder({ encoder: MeshoptEncoder, target: "size", cleanup: false }),
	quantize({ cleanup: false, pattern: /^(?!POSITION).*$/, quantizeNormal: 10, quantizeTexcoord: 14, quantizeColor: 8 }),
	prune({
		propertyTypes: [PropertyType.ACCESSOR],
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
console.log(`${input} (${mb(input)} Mo) → ${output} (${mb(output)} Mo)`);
