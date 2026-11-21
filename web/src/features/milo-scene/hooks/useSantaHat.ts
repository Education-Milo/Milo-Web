import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/// Bonnet de Père Noël de Milo, dans la salle décorée pour Noël.
///
/// Fait en code (quelques centaines de triangles) et accroché à l'os de la
/// tête, comme les chapeaux de la boutique : il suit toutes les animations.
/// Si Milo porte déjà quelque chose sur la tête (chapeau, couronne,
/// auréole…), le bonnet s'efface.
///
/// Le bonnet n'est pas un accessoire de la boutique : forEachAccessoryRoot
/// le voit sous l'os comme les autres et applyEquippedAccessories le masque.
/// Sa visibilité est donc reposée à chaque image.

const HAT_NAME = "__bonnetNoel";
/// Accessoires portés sur le dessus de la tête : avec eux, pas de bonnet
const ON_TOP_OF_HEAD = /hat|crown|circle|couronne|bonnet|casquette|helmet|cap$/i;
/// Le bonnet se pose comme la toque (chef_hat) : même place sur l'os de la
/// tête. Valeurs de MiloV22.glb, relues sur la toque si elle est là.
const POSE_FROM = "chef_hat";
const HAT_POSE = {
	position: new THREE.Vector3(-0.0055, 2.674, 0.069),
	quaternion: new THREE.Quaternion(0.1584, 0.0034, -0.0013, 0.9874).normalize(),
	scale: 0.86,
};

/** L'os de la tête : celui qui porte les chapeaux de la boutique */
function findHeadBone(scene: THREE.Object3D) {
	for (const name of [POSE_FROM, "tophat", "angelcircle", "crown"]) {
		const parent = scene.getObjectByName(name)?.parent;
		if (parent) return parent;
	}
	return scene.getObjectByName("head") ?? scene.getObjectByName("head_1") ?? null;
}

/** Tube dont le rayon varie le long d'une courbe (corps du bonnet) */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, radius: (t: number) => number, segments: number, sides: number) {
	const frames = curve.computeFrenetFrames(segments, false);
	const positions: number[] = [];
	const indices: number[] = [];
	const point = new THREE.Vector3();
	for (let i = 0; i <= segments; i++) {
		const t = i / segments;
		curve.getPointAt(t, point);
		const r = radius(t);
		for (let j = 0; j < sides; j++) {
			const a = (j / sides) * Math.PI * 2;
			const n = frames.normals[i].clone().multiplyScalar(Math.cos(a));
			const b = frames.binormals[i].clone().multiplyScalar(Math.sin(a));
			const v = point.clone().add(n.add(b).multiplyScalar(r));
			positions.push(v.x, v.y, v.z);
		}
	}
	for (let i = 0; i < segments; i++) {
		for (let j = 0; j < sides; j++) {
			const a = i * sides + j;
			const b = i * sides + ((j + 1) % sides);
			const c = (i + 1) * sides + ((j + 1) % sides);
			const d = (i + 1) * sides + j;
			indices.push(a, b, d, b, c, d);
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

function createSantaHat(pose: THREE.Object3D | null) {
	const hat = new THREE.Group();
	hat.name = HAT_NAME;
	if (pose) {
		hat.position.copy(pose.position);
		hat.quaternion.copy(pose.quaternion);
		hat.scale.setScalar(pose.scale.x);
	} else {
		hat.position.copy(HAT_POSE.position);
		hat.quaternion.copy(HAT_POSE.quaternion);
		hat.scale.setScalar(HAT_POSE.scale);
	}

	const red = new THREE.MeshStandardMaterial({ color: "#A50A1F", roughness: 0.8 });
	const fur = new THREE.MeshStandardMaterial({ color: "#F7F4EE", roughness: 0.95 });

	/// Corps : un cône souple dont la pointe retombe sur le côté, en arrière
	const spine = new THREE.CatmullRomCurve3(
		[
			[0, 0.12, 0],
			[0, 0.9, -0.05],
			[0.08, 1.6, -0.2],
			[0.36, 2.08, -0.42],
			[0.8, 2.22, -0.62],
			[1.16, 2.0, -0.76],
			[1.32, 1.66, -0.82],
		].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
		false,
		"centripetal",
	);
	const body = new THREE.Mesh(
		taperedTube(spine, (t) => THREE.MathUtils.lerp(1.2, 0.08, Math.pow(t, 0.75)), 22, 16),
		red,
	);
	/// Bordure en fourrure, un peu aplatie
	const brim = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.3, 10, 28), fur);
	brim.rotation.x = Math.PI / 2;
	brim.position.y = 0.16;
	brim.scale.set(1, 1, 0.85);
	/// Pompon
	const pompom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), fur);
	pompom.position.copy(spine.getPointAt(1)).addScaledVector(spine.getTangentAt(1), 0.18);

	for (const mesh of [body, brim, pompom]) {
		mesh.castShadow = true;
		mesh.frustumCulled = false;
		hat.add(mesh);
	}
	return {
		hat,
		dispose: () => {
			[body, brim, pompom].forEach((mesh) => mesh.geometry.dispose());
			red.dispose();
			fur.dispose();
		},
	};
}

/** Milo porte déjà un accessoire sur le dessus de la tête */
function wearsHeadTop(head: THREE.Object3D, hat: THREE.Object3D) {
	return head.children.some((child) => child !== hat && child.visible && ON_TOP_OF_HEAD.test(child.name));
}

/**
 * Coiffe Milo (scène de la salle de classe) d'un bonnet de Noël.
 * `enabled` est fixé pour la visite : il ne change pas en cours de route.
 */
export function useSantaHat(scene: THREE.Object3D | null | undefined, enabled: boolean) {
	const head = useMemo(() => (scene ? findHeadBone(scene) : null), [scene]);
	const santa = useMemo(
		() => (enabled && scene ? createSantaHat(scene.getObjectByName(POSE_FROM) ?? null) : null),
		[enabled, scene],
	);

	useEffect(() => {
		if (!santa || !head) return;
		head.add(santa.hat);
		return () => {
			head.remove(santa.hat);
			santa.dispose();
		};
	}, [santa, head]);

	useFrame(() => {
		if (santa && head) santa.hat.visible = !wearsHeadTop(head, santa.hat);
	});
}
