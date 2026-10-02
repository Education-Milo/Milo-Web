import React, {
	Suspense,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	MILO_MODEL_PATH,
	applyEquippedAccessories,
	cameraDistanceFor,
	findAction,
	fitMiloToHeight,
	prepareMiloScene,
	updateAngelCircleGlow,
} from "@features/my-milo/utils/miloModel";

const MODEL_PATH = MILO_MODEL_PATH;
/// Salut à l'arrivée sur la page, puis respiration en boucle
const HELLO_CLIP = "Hello";
const IDLE_CLIP = "Idle";
const CROSSFADE = 0.35;

/// Hauteur du corps entier de Milo en unités monde, une fois mis à l'échelle
const FIT_HEIGHT = 2.1;
/// Haut du cadre, au-dessus des oreilles et de la main levée du "Hello"
/// (le corps tient entre -1.05 et +1.05, la main monte à ~1.11)
const FRAME_TOP = 1.375;
/// Hauteur visible : on ne garde que la tête et le haut du corps,
/// le reste sort par le bas de la carte
const FRAME_HEIGHT = 1.85;
/// Focale longue : moins de déformation de perspective sur un gros plan
const CAMERA_FOV = 14;
/// Léger décalage pour compenser le bras levé, qui déporte Milo à droite
const OFFSET_X = -0.08;
/// Milo est tourné de trois quarts, face au texte de la carte
const ROTATION_Y = -0.25;

/// Point du modèle visé par la caméra (milieu du cadre)
const FOCUS_Y = FRAME_TOP - FRAME_HEIGHT / 2;
/// Distance qui fait tenir exactement FRAME_HEIGHT dans le champ vertical
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);

function MiloHello() {
	const group = useRef<THREE.Group>(null);
	const { scene, animations } = useMiloInstance(MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, group);
	/// Animation en cours, surveillée par le garde-fou de la boucle de rendu
	const currentRef = useRef<THREE.AnimationAction | null>(null);

	const { equippedMeshNames } = useEquippedMeshNames();
	/// Exécuté dès la phase de rendu, donc avant tout frame
	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	/// Recentre et met Milo à l'échelle du cadre
	useLayoutEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);
	}, [scene]);

	/// Milo porte ici exactement ce qui est équipé dans "Mon Milo"
	useLayoutEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	const idleAction = useCallback(
		() =>
			findAction(actions, IDLE_CLIP) ??
			findAction(actions, Object.keys(actions)[0] ?? ""),
		[actions],
	);

	/// Enchaîne vers l'attente en boucle, en fondu depuis l'animation en cours
	const playIdle = useCallback(() => {
		const idle = idleAction();
		if (!idle) return;
		const prev = currentRef.current;
		if (prev === idle && idle.isRunning() && idle.loop === THREE.LoopRepeat) {
			return;
		}

		idle.reset();
		idle.enabled = true;
		idle.setEffectiveTimeScale(1);
		idle.setEffectiveWeight(1);
		idle.setLoop(THREE.LoopRepeat, Infinity);
		idle.clampWhenFinished = false;
		idle.play();
		if (prev && prev !== idle) idle.crossFadeFrom(prev, CROSSFADE, false);
		currentRef.current = idle;
	}, [idleAction]);

	/// "Hello" une fois à l'arrivée, puis l'attente en boucle
	useLayoutEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		const hello = findAction(actions, HELLO_CLIP);
		const idle = idleAction();

		/// Pas de clip de salut (ou c'est le même que l'attente) : on démarre
		/// directement sur la boucle plutôt que de figer Milo
		if (!hello || hello === idle) {
			playIdle();
			mixer.update(0);
			scene.visible = true;
			return;
		}

		currentRef.current = hello;
		hello.reset();
		hello.setLoop(THREE.LoopOnce, 1);
		/// Maintenu sur sa dernière frame le temps du fondu vers l'attente
		hello.clampWhenFinished = true;
		hello.play();
		mixer.update(0);
		scene.visible = true;

		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== hello) return;
			playIdle();
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
			hello.stop();
			currentRef.current = null;
		};
	}, [actions, mixer, scene, idleAction, playIdle]);

	useFrame((state) => {
		/// Garde-fou : plus aucune animation active veut dire Milo figé sur sa
		/// dernière frame — on relance l'attente.
		const current = currentRef.current;
		if (current && !current.isRunning()) playIdle();
		updateAngelCircleGlow(scene, state.clock.elapsedTime);
	});

	return (
		<group
			ref={group}
			position={[OFFSET_X, -FOCUS_Y, 0]}
			rotation={[0, ROTATION_Y, 0]}
		>
			<primitive object={scene} />
		</group>
	);
}

const MiloWelcome3D: React.FC = () => (
	/// Milo respire en continu : contrairement à la version figée sur la
	/// dernière frame du salut, le canvas rend à chaque frame.
	<Canvas
		className="hp-welcome-canvas"
		frameloop="always"
		dpr={[1, 2]}
		camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
		gl={{ alpha: true, antialias: true }}
		style={{ background: "transparent" }}
	>
		<ambientLight intensity={2} color="#fff1e2" />
		<hemisphereLight args={["#ffffff", "#c4693a", 0.7]} />
		<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fffaf3" />
		<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
		<Suspense fallback={null}>
			<MiloHello />
		</Suspense>
	</Canvas>
);

useGLTF.preload(MODEL_PATH);

export default MiloWelcome3D;
