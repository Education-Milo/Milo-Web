import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { frameStep } from "@features/home/components/miloSchool/miloSchool.bridge";

/// Contour blanc très fin autour des objets cliquables, au survol.
/// Technique de la « coque inversée » : chaque maillage reçoit un double qui
/// ne dessine que ses faces arrière, gonflé de quelques pixels à l'écran ; il
/// ne dépasse de l'objet qu'au bord de sa silhouette. Ça marche aussi pour
/// Milo animé (le double partage son squelette), sans passe de post-traitement.

/// Épaisseur du trait, en pixels CSS
const OUTLINE_CSS_PX = 1.6;
/// Formes plates : pas d'épaisseur, pas de contour (le volume voisin en a un)
const FLAT_GEOMETRIES = new Set(["PlaneGeometry", "ShapeGeometry", "CircleGeometry"]);

interface OutlineUniforms {
	outlinePx: { value: number };
	outlineResolution: { value: THREE.Vector2 };
}

function createOutlineMaterial() {
	const uniforms: OutlineUniforms = {
		outlinePx: { value: OUTLINE_CSS_PX },
		outlineResolution: { value: new THREE.Vector2(1, 1) },
	};
	const material = new THREE.MeshBasicMaterial({
		color: "#FFFFFF",
		side: THREE.BackSide,
		transparent: true,
		opacity: 0,
		depthWrite: false,
		toneMapped: false,
		fog: false,
	});
	material.visible = false;
	material.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, uniforms);
		shader.vertexShader = shader.vertexShader
			.replace("#include <common>", "#include <common>\nuniform float outlinePx;\nuniform vec2 outlineResolution;")
			.replace(
				"#include <project_vertex>",
				`#include <project_vertex>
#ifdef USE_SKINNING
	vec3 outlineNormal = objectNormal;
#else
	vec3 outlineNormal = normal;
#endif
	vec3 outlineView = normalize( normalMatrix * outlineNormal );
	vec2 outlineDir = ( projectionMatrix * vec4( outlineView, 0.0 ) ).xy;
	outlineDir /= max( length( outlineDir ), 1e-4 );
	gl_Position.xy += outlineDir * outlinePx * 2.0 / outlineResolution * gl_Position.w;`,
			);
	};
	material.customProgramCacheKey = () => "milo-school-outline";
	return { material, uniforms };
}

/** Ajoute une coque de contour à chaque maillage en volume sous `root` ; renvoie le nettoyage */
function attachOutline(root: THREE.Object3D, material: THREE.Material) {
	const targets: THREE.Mesh[] = [];
	root.traverse((child) => {
		const mesh = child as THREE.Mesh;
		if (!mesh.isMesh || mesh.userData.outlineHull) return;
		/// Les zones de clic invisibles et les formes plates n'ont pas de contour
		if (!mesh.visible || FLAT_GEOMETRIES.has(mesh.geometry.type)) return;
		if ((mesh as THREE.InstancedMesh).isInstancedMesh) return;
		targets.push(mesh);
	});

	const hulls: THREE.Mesh[] = [];
	const ownGeometries: THREE.BufferGeometry[] = [];
	for (const mesh of targets) {
		let hull: THREE.Mesh;
		if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
			/// Milo : même géométrie (normales déjà lisses), même squelette
			const source = mesh as THREE.SkinnedMesh;
			const skinned = new THREE.SkinnedMesh(source.geometry, material);
			skinned.bindMode = source.bindMode;
			skinned.bind(source.skeleton, source.bindMatrix);
			skinned.frustumCulled = false;
			hull = skinned;
		} else {
			/// Décor : sommets fusionnés et normales moyennées, sinon le contour
			/// se déchire aux arêtes vives (boîtes)
			const base = new THREE.BufferGeometry();
			base.setAttribute("position", mesh.geometry.getAttribute("position"));
			if (mesh.geometry.index) base.setIndex(mesh.geometry.index);
			const merged = mergeVertices(base, 1e-4);
			merged.computeVertexNormals();
			base.dispose();
			ownGeometries.push(merged);
			hull = new THREE.Mesh(merged, material);
		}
		hull.userData.outlineHull = true;
		hull.castShadow = false;
		hull.receiveShadow = false;
		hull.renderOrder = mesh.renderOrder;
		/// Jamais visé par les clics
		hull.raycast = () => {};
		mesh.add(hull);
		hulls.push(hull);
	}

	return () => {
		for (const hull of hulls) hull.removeFromParent();
		for (const geometry of ownGeometries) geometry.dispose();
	};
}

/**
 * Contour blanc qui apparaît en fondu quand `isActive()` est vrai.
 * `deps` : à changer quand le contenu de `root` change (autre modèle…).
 */
export function useHoverOutline(
	root: RefObject<THREE.Object3D | null>,
	isActive: () => boolean,
	deps: readonly unknown[] = [],
) {
	const { material, uniforms } = useMemo(createOutlineMaterial, []);
	const amount = useRef(0);
	const size = useMemo(() => new THREE.Vector2(), []);

	useLayoutEffect(() => {
		const object = root.current;
		if (!object) return;
		return attachOutline(object, material);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` décrit le contenu de `root`
	}, [material, root, ...deps]);

	useLayoutEffect(() => () => material.dispose(), [material]);

	useFrame(({ gl }, delta) => {
		const target = isActive() ? 1 : 0;
		amount.current += (target - amount.current) * (1 - Math.exp(-14 * frameStep(delta)));
		if (target === 0 && amount.current < 0.01) amount.current = 0;
		material.opacity = amount.current * 0.95;
		material.visible = amount.current > 0;
		if (!material.visible) return;
		gl.getDrawingBufferSize(size);
		uniforms.outlineResolution.value.copy(size);
		uniforms.outlinePx.value = OUTLINE_CSS_PX * gl.getPixelRatio();
	});
}
