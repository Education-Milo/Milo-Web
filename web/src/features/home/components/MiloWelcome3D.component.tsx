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
import { useMiloInventoryStore } from "@features/my-milo/store/miloInventory.store";
import { MILO_ITEMS } from "@features/my-milo/data/miloItems.data";

const MODEL_PATH = "/MiloV10.glb";
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
const CAMERA_DISTANCE =
	FRAME_HEIGHT / (2 * Math.tan((CAMERA_FOV * Math.PI) / 360));

/// Meshes d'accessoires : ils sont exclus du calcul de cadrage pour que
const ACCESSORY_MESH_NAMES = new Set(
	MILO_ITEMS.map((item) => item.meshName).filter(Boolean) as string[],
);
function getBodyBox(scene: THREE.Object3D) {
	const box = new THREE.Box3();
	const meshBox = new THREE.Box3();
	const toParentSpace = new THREE.Matrix4();
	scene.updateWorldMatrix(true, true);
	const parentInverse = new THREE.Matrix4();
	if (scene.parent) parentInverse.copy(scene.parent.matrixWorld).invert();

	scene.traverse((child) => {
		const mesh = child as THREE.SkinnedMesh;
		if (!mesh.isMesh) return;
		if (ACCESSORY_MESH_NAMES.has(child.name)) return;

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

function MiloHello({ setFrozen }: { setFrozen: (frozen: boolean) => void }) {
	const group = useRef<THREE.Group>(null);
	const { scene, animations } = useGLTF(MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, group);
	const isAnimating = useRef(true);
	const holdFrames = useRef(HOLD_FRAMES);
	const actionRef = useRef<THREE.AnimationAction | null>(null);
	const { invalidate, gl } = useThree();

	const equippedItemIds = useMiloInventoryStore((state) => state.equippedItemIds);

	const equippedMeshNames = useMemo(() => {
		return equippedItemIds
			.map((id) => MILO_ITEMS.find((i) => i.id === id)?.meshName)
			.filter(Boolean) as string[];
	}, [equippedItemIds]);
	useMemo(() => {
		if (!scene) return;
		scene.visible = false;
		scene.traverse((child) => {
			if (ACCESSORY_MESH_NAMES.has(child.name)) child.visible = false;
			(child as THREE.Mesh).frustumCulled = false;
		});
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

	useLayoutEffect(() => {
		if (!scene) return;
		scene.position.set(0, 0, 0);
		scene.scale.setScalar(1);

		const box = getBodyBox(scene);
		if (box.isEmpty()) return;
		const size = box.getSize(new THREE.Vector3());
		const center = box.getCenter(new THREE.Vector3());
		if (size.y === 0) return;

		const scale = FIT_HEIGHT / size.y;
		scene.scale.setScalar(scale);
		scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
		invalidate();
	}, [scene, invalidate]);

	useLayoutEffect(() => {
		if (!scene) return;
		scene.traverse((child) => {
			if (ACCESSORY_MESH_NAMES.has(child.name)) {
				child.visible = equippedMeshNames.includes(child.name);
			}
		});
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
			<ambientLight intensity={1.1} color="#fff1e2" />
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
