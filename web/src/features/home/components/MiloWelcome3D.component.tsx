import React, {
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import {
	MILO_MODEL_PATH,
	applyEquippedAccessories,
	cameraDistanceFor,
	fitMiloToHeight,
	prepareMiloScene,
} from "@features/my-milo/utils/miloModel";

const MODEL_PATH = MILO_MODEL_PATH;
const HELLO_CLIP = "Hello";

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
/// Quelques frames de marge après le gel : en mode "demand", elles évitent
/// que le compositeur reste sur une image intermédiaire
const HOLD_FRAMES = 30;

/// Point du modèle visé par la caméra (milieu du cadre)
const FOCUS_Y = FRAME_TOP - FRAME_HEIGHT / 2;
/// Distance qui fait tenir exactement FRAME_HEIGHT dans le champ vertical
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);

function MiloHello({ setFrozen }: { setFrozen: (frozen: boolean) => void }) {
	const group = useRef<THREE.Group>(null);
	const { scene, animations } = useGLTF(MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, group);
	const isAnimating = useRef(true);
	const holdFrames = useRef(HOLD_FRAMES);
	const actionRef = useRef<THREE.AnimationAction | null>(null);
	const { invalidate, gl } = useThree();

	const { equippedMeshNames } = useEquippedMeshNames();
	/// Exécuté dès la phase de rendu, donc avant tout frame
	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	useEffect(() => {
		const revive = () => {
			holdFrames.current = HOLD_FRAMES;
			invalidate();
		};
		const onVisibility = () => {
			if (document.visibilityState === "visible") revive();
		};
		const canvas = gl.domElement;
		document.addEventListener("visibilitychange", onVisibility);
		canvas.addEventListener("webglcontextrestored", revive);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			canvas.removeEventListener("webglcontextrestored", revive);
		};
	}, [gl, invalidate]);

	/// Recentre et met Milo à l'échelle du cadre
	useLayoutEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);
		invalidate();
	}, [scene, invalidate]);

	/// Milo porte ici exactement ce qui est équipé dans "Mon Milo"
	useLayoutEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
		invalidate();
	}, [scene, equippedMeshNames, invalidate]);

	const freeze = useCallback(() => {
		const action = actionRef.current;
		if (!action) return;
		action.paused = true;
		action.time = action.getClip().duration;
		mixer.update(0);
		isAnimating.current = false;
		holdFrames.current = HOLD_FRAMES;
		setFrozen(true);
		invalidate();
	}, [mixer, invalidate, setFrozen]);

	useLayoutEffect(() => {
		if (!actions) return;
		const clipName =
			Object.keys(actions).find(
				(name) => name.toLowerCase() === HELLO_CLIP.toLowerCase(),
			) ?? Object.keys(actions)[0];
		const action = clipName ? actions[clipName] : null;
		if (!action) return;

		setFrozen(false);
		actionRef.current = action;
		action.reset();
		action.setLoop(THREE.LoopOnce, 1);
		action.clampWhenFinished = true;
		action.play();
		mixer.update(0);
		scene.visible = true;

		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== action) return;
			freeze();
		};

		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
			action.stop();
			actionRef.current = null;
			isAnimating.current = true;
			holdFrames.current = HOLD_FRAMES;
		};
	}, [actions, mixer, scene, invalidate, setFrozen, freeze]);

	useFrame(() => {
		if (isAnimating.current) {
			invalidate();
			return;
		}
		if (holdFrames.current > 0) {
			holdFrames.current -= 1;
			invalidate();
		}
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

const MiloWelcome3D: React.FC = () => {
	const [isFrozen, setIsFrozen] = useState(false);
	const setFrozen = useCallback((frozen: boolean) => setIsFrozen(frozen), []);

	return (
		<Canvas
			className="hp-welcome-canvas"
			frameloop={isFrozen ? "demand" : "always"}
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
				<MiloHello setFrozen={setFrozen} />
			</Suspense>
		</Canvas>
	);
};

useGLTF.preload(MODEL_PATH);

export default MiloWelcome3D;
