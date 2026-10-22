import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/// Regard de Milo sur la landing : la tête et les yeux suivent le curseur,
/// par-dessus l'animation en cours (attente, salut…), sans la remplacer.

/// Le curseur est visé sur un plan placé entre Milo et la caméra, à cette
/// distance devant sa tête (unités monde) : plus il est proche, plus Milo
/// tourne la tête pour un même déplacement de la souris.
const TARGET_PLANE_DISTANCE = 3;
/// Angle total du regard (tête + yeux), en radians
const MAX_YAW = 0.85;
const MAX_PITCH_UP = 0.45;
const MAX_PITCH_DOWN = 0.35;
/// La tête prend environ deux tiers du mouvement, les yeux le reste
const HEAD_SHARE = 0.65;
const HEAD_MAX_YAW = 0.5;
const HEAD_MAX_PITCH_UP = 0.28;
const HEAD_MAX_PITCH_DOWN = 0.2;
/// Les animations font déjà tourner les yeux jusqu'à ~20° : on reste en deçà
/// pour qu'ils ne sortent pas des paupières
const EYE_MAX_YAW = 0.26;
const EYE_MAX_PITCH = 0.17;
/// Vitesses d'amortissement (1/s) : les yeux partent les premiers, la tête
/// suit, et les yeux se recentrent à mesure qu'elle arrive
const HEAD_SPEED = 4.5;
const EYE_SPEED = 16;

/// Branches du squelette qui tournent avec la tête, toutes enfants de l'os du
/// cou (ORG-spine.003) : la tête déformée et ses paupières/sourcils, les
/// accessoires portés sur la tête, les oreilles.
const HEAD_BRANCHES = ["DEF-head", "MCH-ROT-head", "ORG-head"];
/// Yeux, enfants de DEF-head (« DEF-oeil.L » devient « DEF-oeilL » dans three)
const EYE_PREFIX = "DEF-oeil";

const clamp = THREE.MathUtils.clamp;
const damp = (current: number, target: number, speed: number, dt: number) =>
	current + (target - current) * (1 - Math.exp(-speed * dt));

/// Pose de l'animation d'un os, avant que le regard ne s'y ajoute
interface Saved {
	node: THREE.Object3D;
	position: THREE.Vector3;
	quaternion: THREE.Quaternion;
	active: boolean;
}

const saveFor = (node: THREE.Object3D): Saved => ({
	node,
	position: new THREE.Vector3(),
	quaternion: new THREE.Quaternion(),
	active: false,
});

const save = (entry: Saved) => {
	entry.position.copy(entry.node.position);
	entry.quaternion.copy(entry.node.quaternion);
	entry.active = true;
};

/// À appeler APRÈS useAnimations, dans le même composant : le regard
/// s'applique une fois le mixer mis à jour pour la frame.
export function useMiloGaze(scene: THREE.Object3D, enabled: boolean) {
	const { camera, gl } = useThree();

	const rig = useMemo(() => {
		const head = scene.getObjectByName("DEF-head");
		const neck = head?.parent;
		if (!head || !neck) return null;
		const branches = neck.children.filter((child) => HEAD_BRANCHES.includes(child.name)).map(saveFor);
		const eyes = head.children.filter((child) => child.name.startsWith(EYE_PREFIX)).map(saveFor);
		return { neck, head, branches, eyes, all: [...branches, ...eyes] };
	}, [scene]);

	/// Curseur : coordonnées écran et position dans la toile (NDC). La toile
	/// est mesurée lors des événements, jamais pendant le rendu : la lire dans
	/// la boucle forcerait un recalcul de mise en page à chaque frame.
	const pointer = useRef({ active: false, clientX: 0, clientY: 0, ndc: new THREE.Vector2() });

	useEffect(() => {
		if (!enabled) return;
		const state = pointer.current;
		const project = () => {
			const rect = gl.domElement.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			state.ndc.set(
				((state.clientX - rect.left) / rect.width) * 2 - 1,
				-((state.clientY - rect.top) / rect.height) * 2 + 1,
			);
		};
		const onMove = (event: PointerEvent) => {
			state.active = true;
			state.clientX = event.clientX;
			state.clientY = event.clientY;
			project();
		};
		/// Au scroll, le curseur ne bouge pas mais la toile, si
		const onScroll = () => state.active && project();
		/// Souris sortie de la fenêtre, doigt levé : Milo reprend son regard
		const onLeave = () => (state.active = false);
		const onUp = (event: PointerEvent) => event.pointerType === "touch" && onLeave();

		window.addEventListener("pointermove", onMove, { passive: true });
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
		window.addEventListener("blur", onLeave);
		document.documentElement.addEventListener("mouseleave", onLeave);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
			window.removeEventListener("blur", onLeave);
			document.documentElement.removeEventListener("mouseleave", onLeave);
		};
	}, [enabled, gl]);

	const gaze = useRef({ headYaw: 0, headPitch: 0, eyeYaw: 0, eyePitch: 0 });
	const tmp = useMemo(
		() => ({
			raycaster: new THREE.Raycaster(),
			plane: new THREE.Plane(),
			cameraDir: new THREE.Vector3(),
			pivot: new THREE.Vector3(),
			hit: new THREE.Vector3(),
			eyeCenter: new THREE.Vector3(),
			eyePos: new THREE.Vector3(),
			euler: new THREE.Euler(0, 0, 0, "YXZ"),
			sceneQ: new THREE.Quaternion(),
			sceneQInv: new THREE.Quaternion(),
			neckQ: new THREE.Quaternion(),
			headQ: new THREE.Quaternion(),
			rotChar: new THREE.Quaternion(),
			rotWorld: new THREE.Quaternion(),
			rotLocal: new THREE.Quaternion(),
			parentQ: new THREE.Quaternion(),
			parentQInv: new THREE.Quaternion(),
			eyeLocal: new THREE.Quaternion(),
			pivotLocal: new THREE.Vector3(),
		}),
		[],
	);

	/// Avant le mixer : on retire le regard appliqué à la frame précédente.
	/// Un os qu'aucun clip n'anime garderait sinon la rotation ajoutée, qui
	/// s'additionnerait frame après frame.
	useFrame(() => {
		if (!rig) return;
		for (const entry of rig.all) {
			if (!entry.active) continue;
			entry.node.position.copy(entry.position);
			entry.node.quaternion.copy(entry.quaternion);
			entry.active = false;
		}
	}, -1);

	/// Après le mixer : regard ajouté à la pose de l'animation
	useFrame((_, delta) => {
		if (!rig || !enabled) return;
		const dt = Math.min(delta, 0.1);
		const g = gaze.current;

		/// Matrices à jour pour la pose que le mixer vient d'appliquer
		rig.neck.updateWorldMatrix(true, true);

		/// Direction du curseur dans le repère de Milo (+Z devant lui, +Y en haut)
		let yaw = 0;
		let pitch = 0;
		const state = pointer.current;
		if (state.active) {
			rig.head.getWorldPosition(tmp.pivot);
			camera.getWorldDirection(tmp.cameraDir);
			tmp.plane.setFromNormalAndCoplanarPoint(
				tmp.cameraDir,
				tmp.hit.copy(tmp.pivot).addScaledVector(tmp.cameraDir, -TARGET_PLANE_DISTANCE),
			);
			tmp.raycaster.setFromCamera(state.ndc, camera);
			if (tmp.raycaster.ray.intersectPlane(tmp.plane, tmp.hit)) {
				tmp.eyeCenter.set(0, 0, 0);
				for (const eye of rig.eyes) tmp.eyeCenter.add(eye.node.getWorldPosition(tmp.eyePos));
				if (rig.eyes.length) tmp.eyeCenter.divideScalar(rig.eyes.length);
				else tmp.eyeCenter.copy(tmp.pivot);
				scene.worldToLocal(tmp.hit);
				scene.worldToLocal(tmp.eyeCenter);
				const v = tmp.hit.sub(tmp.eyeCenter);
				yaw = clamp(Math.atan2(v.x, v.z), -MAX_YAW, MAX_YAW);
				pitch = clamp(Math.atan2(v.y, Math.hypot(v.x, v.z)), -MAX_PITCH_DOWN, MAX_PITCH_UP);
			}
		}

		g.headYaw = damp(g.headYaw, clamp(yaw * HEAD_SHARE, -HEAD_MAX_YAW, HEAD_MAX_YAW), HEAD_SPEED, dt);
		g.headPitch = damp(
			g.headPitch,
			clamp(pitch * HEAD_SHARE, -HEAD_MAX_PITCH_DOWN, HEAD_MAX_PITCH_UP),
			HEAD_SPEED,
			dt,
		);
		/// Les yeux couvrent ce que la tête n'a pas (encore) pris
		g.eyeYaw = damp(g.eyeYaw, clamp(yaw - g.headYaw, -EYE_MAX_YAW, EYE_MAX_YAW), EYE_SPEED, dt);
		g.eyePitch = damp(g.eyePitch, clamp(pitch - g.headPitch, -EYE_MAX_PITCH, EYE_MAX_PITCH), EYE_SPEED, dt);

		if (Math.abs(g.headYaw) + Math.abs(g.headPitch) + Math.abs(g.eyeYaw) + Math.abs(g.eyePitch) < 1e-4) return;

		scene.getWorldQuaternion(tmp.sceneQ);
		tmp.sceneQInv.copy(tmp.sceneQ).invert();

		/// Tête : rotation rigide des trois branches autour de la base de la tête
		tmp.rotChar.setFromEuler(tmp.euler.set(-g.headPitch, g.headYaw, 0));
		tmp.rotWorld.copy(tmp.sceneQ).multiply(tmp.rotChar).multiply(tmp.sceneQInv);
		rig.neck.getWorldQuaternion(tmp.neckQ);
		tmp.parentQInv.copy(tmp.neckQ).invert();
		tmp.rotLocal.copy(tmp.parentQInv).multiply(tmp.rotWorld).multiply(tmp.neckQ);
		rig.head.getWorldQuaternion(tmp.headQ);
		tmp.pivotLocal.copy(rig.head.position);
		for (const entry of rig.branches) {
			save(entry);
			entry.node.position.sub(tmp.pivotLocal).applyQuaternion(tmp.rotLocal).add(tmp.pivotLocal);
			entry.node.quaternion.premultiply(tmp.rotLocal);
		}

		/// Yeux : rotation de chaque œil sur lui-même, dans le repère de la tête
		/// déjà tournée
		tmp.rotChar.setFromEuler(tmp.euler.set(-g.eyePitch, g.eyeYaw, 0));
		const eyeWorld = tmp.rotChar.premultiply(tmp.sceneQ).multiply(tmp.sceneQInv);
		tmp.parentQ.copy(tmp.rotWorld).multiply(tmp.headQ);
		tmp.parentQInv.copy(tmp.parentQ).invert();
		tmp.eyeLocal.copy(tmp.parentQInv).multiply(eyeWorld).multiply(tmp.parentQ);
		for (const entry of rig.eyes) {
			save(entry);
			entry.node.quaternion.premultiply(tmp.eyeLocal);
		}
	});
}
