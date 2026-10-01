import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import {
	MILO_MODEL_PATH,
	applyEquippedAccessories,
	cameraDistanceFor,
	findAction,
	fitMiloToHeight,
	prepareMiloScene,
	updateAngelCircleGlow,
} from "@features/my-milo/utils/miloModel";

/// Aperçu d'une danse : Milo l'exécute en boucle dans la vignette survolée.
/// Monté uniquement pendant le survol, et par la page une case à la fois :
/// un seul contexte WebGL est ouvert, quel que soit le nombre de danses.

/// Une danse engage tout le corps : contrairement aux autres écrans, on cadre
/// Milo en pied, avec de la marge pour les bras et les jambes qui s'écartent.
const FIT_HEIGHT = 2.1;
const FRAME_TOP = 1.4;
const FRAME_HEIGHT = 2.7;
const CAMERA_FOV = 22;
const ROTATION_Y = -0.2;

const FOCUS_Y = FRAME_TOP - FRAME_HEIGHT / 2;
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);

function DancingMilo({
	clip,
	onReady,
}: {
	clip: string;
	onReady: () => void;
}) {
	const group = useRef<THREE.Group>(null);
	const { scene: template, animations } = useGLTF(MILO_MODEL_PATH);
	/// La scène du .glb est mise en cache et partagée : on la clone pour ne
	/// jamais voler le modèle à un autre Milo affiché ailleurs
	const scene = useMemo(() => SkeletonUtils.clone(template), [template]);
	const { actions, mixer } = useAnimations(animations, scene);
	const { invalidate } = useThree();

	const { equippedMeshNames } = useEquippedMeshNames();

	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	useEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);
		scene.visible = true;
		invalidate();
	}, [scene, invalidate]);

	/// La danse tourne en boucle tant que la souris reste sur la case
	useEffect(() => {
		if (!actions) return;
		const action = findAction(actions, clip);
		if (!action) {
			/// Clip introuvable (nom saisi en admin qui ne correspond à rien) :
			/// on ne signale pas "prêt", la case garde son emoji plutôt que
			/// d'afficher un Milo immobile
			if (import.meta.env.DEV) {
				console.warn(
					`[DancePreview3D] Animation "${clip}" introuvable. Clips disponibles : ${Object.keys(actions).join(", ")}`,
				);
			}
			return;
		}

		action.reset();
		action.setLoop(THREE.LoopRepeat, Infinity);
		action.clampWhenFinished = false;
		action.play();
		/// Applique la première frame avant le premier rendu, sinon Milo
		/// apparaît une frame en T-pose
		mixer.update(0);
		onReady();

		return () => {
			action.stop();
		};
	}, [actions, mixer, clip, onReady]);

	useFrame((state) => updateAngelCircleGlow(scene, state.clock.elapsedTime));

	return (
		<group ref={group} position={[0, -FOCUS_Y, 0]} rotation={[0, ROTATION_Y, 0]}>
			<primitive object={scene} />
		</group>
	);
}

const DancePreview3D: React.FC<{ clip: string }> = ({ clip }) => {
	const [isReady, setIsReady] = useState(false);
	const handleReady = useCallback(() => setIsReady(true), []);

	return (
		<div className={`shop-dance-preview${isReady ? " is-ready" : ""}`} aria-hidden="true">
			<Canvas
				dpr={[1, 2]}
				camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
				gl={{ alpha: true, antialias: true }}
				style={{ background: "transparent" }}
			>
				<ambientLight intensity={1.4} color="#fff1e2" />
				<hemisphereLight args={["#ffffff", "#c4693a", 0.7]} />
				<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fffaf3" />
				<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
				<Suspense fallback={null}>
					<DancingMilo clip={clip} onReady={handleReady} />
				</Suspense>
			</Canvas>
		</div>
	);
};

export default DancePreview3D;
