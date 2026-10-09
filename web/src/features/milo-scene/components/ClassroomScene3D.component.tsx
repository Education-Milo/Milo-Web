import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	applyAngelCircleGlow,
	applyEquippedAccessories,
	prepareMiloScene,
	updateAngelCircleGlow,
} from "@features/my-milo/utils/miloModel";

/// Décor 3D de la salle : la classe, Milo, le tableau et la feuille. Le texte
/// du tableau et de la feuille est du HTML projeté sur leur surface 3D (drei
/// <Html transform>) : il suit la caméra comme de la craie, mais reste
/// survolable, sélectionnable et accessible.

const CAMERA_FOV = 60;
const BASE_CAMERA_Z = 5;
/// Recul maximal : au-delà, la caméra traverse le fond de la classe
const MAX_CAMERA_Z = 10.5;

/// Zone d'écriture du tableau de classroom2.glb (unités 3D)
const BOARD_CENTER: [number, number, number] = [-1.2, 0.3, 0.52];
const BOARD_WIDTH = 4.8;
const BOARD_HEIGHT = 3;
/// Bord gauche à garder dans le champ (zone d'écriture + marge)
const BOARD_LEFT_EDGE = -3.75;
/// 400 / HTML_DISTANCE_FACTOR pixels CSS par unité 3D (cf. drei <Html>)
const HTML_DISTANCE_FACTOR = 2;
const PX_PER_UNIT = 400 / HTML_DISTANCE_FACTOR;
const BOARD_PX = { width: BOARD_WIDTH * PX_PER_UNIT, height: BOARD_HEIGHT * PX_PER_UNIT };

/// Objets posés sur le bureau, qu'un clic « prend en main » : ils viennent
/// devant l'élève, en bas de l'écran, le tableau reste visible au-dessus.
interface DeskItemConfig {
	/** Côté du carré (unités 3D, avant mise à l'échelle) */
	size: number;
	/** Pose sur le bureau */
	desk: { x: number; y: number; z: number; spin: number; scale: number };
	/** Pose tenue en main */
	hold: { scale: number; distance: number; drop: number; tilt: number };
	paperColor: string;
	glowColor: string;
	className: string;
}

/// La feuille pour écrire à Milo
const SHEET: DeskItemConfig = {
	size: 2.5,
	desk: { x: 0, y: -0.65, z: 4.2, spin: 0, scale: 0.55 },
	hold: { scale: 0.4, distance: 2, drop: 0.4, tilt: 0.3 },
	paperColor: "#FFFBF6",
	glowColor: "#FF541D",
	className: "cls-paper",
};

/// Le post-it « Mes notes », collé à droite de la feuille (le cahier reste à gauche)
const POSTIT: DeskItemConfig = {
	size: 2.4,
	desk: { x: 0.86, y: -0.646, z: 3.86, spin: -0.12, scale: 0.27 },
	hold: { scale: 0.43, distance: 2, drop: 0.36, tilt: 0.22 },
	paperColor: "#FFE27A",
	glowColor: "#FCB218",
	className: "cls-postit",
};

/// Pendant l'écriture, la caméra descend un peu : le tableau remonte à l'écran
const EDIT_CAMERA_DROP = 0.12;

/// Les Html projetés restent sous l'interface (barres, fenêtres)
const HTML_Z_RANGE: [number, number] = [4, 0];

interface MiloModelProps {
	modelPath: string;
	activeAnimation: string;
}

function MiloModel({ modelPath, activeAnimation }: MiloModelProps) {
	const group = useRef<THREE.Group>(null);
	/// Copie dédiée à la salle de classe : la scène du .glb est partagée avec
	/// les autres écrans, on ne doit pas y laisser la pose posée ici.
	const { scene, animations } = useMiloInstance(modelPath);
	const { actions } = useAnimations(animations, group);
	const prevAnimation = useRef<string | null>(null);
	const { equippedMeshNames, accessoryMeshNames } = useEquippedMeshNames();

	/// Dès la phase de rendu : masque les accessoires non équipés et désactive
	/// le frustum culling (sinon les petits maillages du visage disparaissent)
	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	useEffect(() => {
		if (!scene) return;
		scene.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				child.castShadow = true;
				child.receiveShadow = false;
			}
		});
	}, [scene]);

	useEffect(() => {
		if (!actions || !activeAnimation) return;
		const CROSSFADE_DURATION = 0.5;
		const nextAction = actions[activeAnimation];
		if (!nextAction) return;
		const prevName = prevAnimation.current;
		const prevAction = prevName ? actions[prevName] : null;
		nextAction.reset();
		nextAction.setLoop(THREE.LoopRepeat, Infinity);
		nextAction.play();
		if (prevAction && prevAction !== nextAction) {
			prevAction.crossFadeTo(nextAction, CROSSFADE_DURATION, true);
		} else {
			nextAction.fadeIn(CROSSFADE_DURATION);
		}
		prevAnimation.current = activeAnimation;
	}, [actions, activeAnimation]);

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
		applyAngelCircleGlow(scene);
		/// Masqué par prepareMiloScene le temps que la pose et les accessoires
		/// soient posés
		scene.visible = true;
	}, [scene, equippedMeshNames, accessoryMeshNames]);

	/// La salle de classe rend en continu : l'auréole peut y battre
	useFrame((state) => {
		updateAngelCircleGlow(scene, state.clock.elapsedTime);
	});

	return (
		<group ref={group}>
			<primitive object={scene} scale={[0.45, 0.45, 0.45]} position={[2.2, -2.3, 1.4]} rotation={[0, -0.4, 0]} />
		</group>
	);
}

/// Luminosité du bake Blender : 1 = la texture telle que bakée
const BAKE_BRIGHTNESS = 1.1;

function Classroom({ modelPath }: { modelPath: string }) {
	const { scene } = useGLTF(modelPath);
	useEffect(() => {
		if (!scene) return;
		scene.traverse((child) => {
			const mesh = child as THREE.Mesh;
			if (!mesh.isMesh) return;
			mesh.castShadow = false;
			mesh.receiveShadow = true;
			/// Matériaux « unlit » : l'éclairage est dans la texture bakée, les
			/// lumières de la scène n'y changent rien. Le tone mapping ACES
			/// l'assombrirait par rapport au rendu Blender : on l'affiche tel quel.
			const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
			for (const material of materials) {
				if (!(material instanceof THREE.MeshBasicMaterial)) continue;
				material.toneMapped = false;
				material.color.setScalar(BAKE_BRIGHTNESS);
				material.needsUpdate = true;
			}
		});
	}, [scene]);
	return <primitive object={scene} scale={[1, 1, 1]} position={[-2, -2.5, 6.95]} rotation={[0, 0, 0]} />;
}

const ClassroomLighting: React.FC = () => {
	const sunRef = useRef<THREE.DirectionalLight>(null);
	useEffect(() => {
		if (!sunRef.current) return;
		const light = sunRef.current;
		light.shadow.mapSize.set(512, 512);
		light.shadow.camera.near = 2;
		light.shadow.camera.far = 22;
		light.shadow.camera.left = -7;
		light.shadow.camera.right = 7;
		light.shadow.camera.top = 7;
		light.shadow.camera.bottom = -7;
		light.shadow.bias = -0.0025;
		light.shadow.normalBias = 0.04;
		light.shadow.camera.updateProjectionMatrix();
	}, []);
	return (
		<>
			<ambientLight intensity={0.7} color="#cdcbc8" />
			<hemisphereLight args={["#ffffff", "#d9c7a7", 0.4]} />
			<directionalLight ref={sunRef} position={[10, 12, 4]} intensity={2.4} color="#fffffe" castShadow />
			<directionalLight position={[-5, 6, 6]} intensity={0.5} color="#fdfbf9" />
		</>
	);
};

/// Tableau : le contenu HTML est collé sur la surface d'ardoise
const Board: React.FC<{ visible: boolean; children: React.ReactNode }> = ({ visible, children }) => (
	<group position={BOARD_CENTER}>
		<Html transform distanceFactor={HTML_DISTANCE_FACTOR} zIndexRange={HTML_Z_RANGE}>
			<div
				className={`cls-chalkboard${visible ? "" : " is-hidden"}`}
				style={{ width: BOARD_PX.width, height: BOARD_PX.height }}
			>
				{children}
			</div>
		</Html>
	</group>
);

/// Objet du bureau (feuille, post-it) : posé, il respire doucement pour
/// inviter au clic ; pris en main, il se soulève en arc et vient devant
/// l'élève. Son contenu HTML est projeté sur sa surface.
const DeskItem: React.FC<{
	config: DeskItemConfig;
	isHeld: boolean;
	onPick: () => void;
	label: string;
	/** Change à chaque ajout : l'objet fait un petit bond sur le bureau */
	bumpKey?: number;
	children: React.ReactNode;
}> = ({ config, isHeld, onPick, label, bumpKey, children }) => {
	const groupRef = useRef<THREE.Group>(null);
	const glowRef = useRef<THREE.Mesh>(null);
	const paperRef = useRef<THREE.Mesh>(null);
	const [isHovered, setIsHovered] = useState(false);
	const noRaycast = useCallback(() => null, []);
	const { camera, size } = useThree();
	const progress = useRef(0);
	const bump = useRef(0);
	const px = config.size * PX_PER_UNIT;

	useEffect(() => {
		if (bumpKey) bump.current = 1;
	}, [bumpKey]);

	const pose = useMemo(
		() => ({
			deskPos: new THREE.Vector3(config.desk.x, config.desk.y, config.desk.z),
			deskQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, config.desk.spin)),
			tiltQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-config.hold.tilt, 0, 0)),
			heldPos: new THREE.Vector3(),
			heldQuat: new THREE.Quaternion(),
			forward: new THREE.Vector3(),
			up: new THREE.Vector3(),
		}),
		[config],
	);

	useFrame((state, delta) => {
		const group = groupRef.current;
		if (!group) return;
		progress.current = THREE.MathUtils.damp(progress.current, isHeld ? 1 : 0, 5, delta);
		bump.current = THREE.MathUtils.damp(bump.current, 0, 6, delta);
		const p = progress.current;
		const t = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

		// Pose « tenue » : devant la caméra, en bas du champ, assez loin pour
		// tenir en largeur sur un écran étroit
		const aspect = size.width / Math.max(size.height, 1);
		const halfTan = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
		const distance = Math.max(
			config.hold.distance,
			(config.size * config.hold.scale) / 2 / (0.92 * halfTan * aspect),
		);
		pose.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
		pose.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
		pose.heldPos
			.copy(camera.position)
			.addScaledVector(pose.forward, distance)
			.addScaledVector(pose.up, -config.hold.drop * halfTan * distance);
		pose.heldQuat.copy(camera.quaternion).multiply(pose.tiltQuat);

		group.position.lerpVectors(pose.deskPos, pose.heldPos, t);
		// Petit arc : l'objet se soulève avant de venir vers l'élève ; un bond
		// quand on vient d'y ajouter quelque chose
		const hop = Math.sin(bump.current * Math.PI);
		group.position.y += Math.sin(p * Math.PI) * 0.22 + hop * 0.08;
		group.quaternion.slerpQuaternions(pose.deskQuat, pose.heldQuat, t);
		group.scale.setScalar(THREE.MathUtils.lerp(config.desk.scale, config.hold.scale, t) * (1 + hop * 0.12));

		// Soulevé, il passe devant le décor (sinon il traverse les bureaux)
		const lifted = p > 0.02;
		for (const mesh of [paperRef.current, glowRef.current]) {
			if (!mesh) continue;
			(mesh.material as THREE.Material).depthTest = !lifted;
			mesh.renderOrder = lifted ? 10 : 0;
		}

		// Posé, un halo respire doucement pour inviter à cliquer
		if (glowRef.current) {
			const material = glowRef.current.material as THREE.MeshBasicMaterial;
			const idle = 0.16 + 0.12 * Math.sin(state.clock.elapsedTime * 2.2);
			const goal = isHeld ? 0 : isHovered ? 0.7 : Math.max(idle, bump.current);
			material.opacity = THREE.MathUtils.damp(material.opacity, goal, 8, delta);
		}
	});

	return (
		<group
			ref={groupRef}
			position={[config.desk.x, config.desk.y, config.desk.z]}
			rotation={[-Math.PI / 2, 0, config.desk.spin]}
			scale={config.desk.scale}
		>
			<mesh ref={glowRef} position={[0, 0, -0.006]} raycast={noRaycast}>
				<planeGeometry args={[config.size + 0.26, config.size + 0.26]} />
				<meshBasicMaterial color={config.glowColor} transparent opacity={0} side={THREE.DoubleSide} />
			</mesh>
			<mesh
				ref={paperRef}
				name={label}
				onPointerOver={(e) => {
					if (isHeld) return;
					e.stopPropagation();
					setIsHovered(true);
					document.body.style.cursor = "pointer";
				}}
				onPointerOut={() => {
					setIsHovered(false);
					document.body.style.cursor = "auto";
				}}
				onClick={(e) => {
					if (isHeld) return;
					e.stopPropagation();
					setIsHovered(false);
					document.body.style.cursor = "auto";
					onPick();
				}}
			>
				<planeGeometry args={[config.size, config.size]} />
				<meshStandardMaterial color={config.paperColor} side={THREE.DoubleSide} />
			</mesh>
			<Html
				transform
				position={[0, 0, 0.012]}
				distanceFactor={HTML_DISTANCE_FACTOR}
				zIndexRange={HTML_Z_RANGE}
				pointerEvents={isHeld ? "auto" : "none"}
			>
				<div className={`${config.className}${isHeld ? " is-held" : ""}`} style={{ width: px, height: px }}>
					{children}
				</div>
			</Html>
		</group>
	);
};

/// Caméra : face au tableau (reculée si l'écran est étroit, pour qu'il tienne
/// en largeur). Pendant l'écriture, elle descend un peu pour garder le
/// tableau visible au-dessus de la feuille.
const CameraRig: React.FC<{ isEditing: boolean }> = ({ isEditing }) => {
	const { camera, size } = useThree();
	const lookAt = useRef(new THREE.Vector3(0, 0, 0));
	const goalPos = useMemo(() => new THREE.Vector3(), []);
	const goalLook = useMemo(() => new THREE.Vector3(), []);

	useFrame((_, delta) => {
		const aspect = size.width / Math.max(size.height, 1);
		const halfTan = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
		// Le bord gauche de la zone d'écriture (x ≈ -3.6) doit rester dans le champ
		const fitZ = BOARD_CENTER[2] + 3.9 / (halfTan * aspect);
		// Au-delà, la caméra sortirait de la salle : on se décale plutôt vers le tableau
		const boardZ = Math.min(Math.max(BASE_CAMERA_Z, fitZ), MAX_CAMERA_Z);
		const halfWidth = halfTan * (boardZ - BOARD_CENTER[2]) * aspect;
		const boardX = Math.min(0, Math.max(BOARD_CENTER[0], BOARD_LEFT_EDGE + halfWidth));
		const drop = isEditing ? EDIT_CAMERA_DROP : 0;

		goalPos.set(boardX, -drop, boardZ);
		goalLook.set(boardX, -drop, 0);
		camera.position.x = THREE.MathUtils.damp(camera.position.x, goalPos.x, 4, delta);
		camera.position.y = THREE.MathUtils.damp(camera.position.y, goalPos.y, 4, delta);
		camera.position.z = THREE.MathUtils.damp(camera.position.z, goalPos.z, 4, delta);
		lookAt.current.x = THREE.MathUtils.damp(lookAt.current.x, goalLook.x, 4, delta);
		lookAt.current.y = THREE.MathUtils.damp(lookAt.current.y, goalLook.y, 4, delta);
		lookAt.current.z = THREE.MathUtils.damp(lookAt.current.z, goalLook.z, 4, delta);
		camera.lookAt(lookAt.current);
	});
	return null;
};

/// Travelling d'entrée : la caméra avance du fond de la classe vers le tableau.
const IntroCamera: React.FC<{ running: boolean; onDone: () => void }> = ({ running, onDone }) => {
	const { camera } = useThree();
	const progress = useRef(0);
	const done = useRef(false);
	const start = useMemo(() => new THREE.Vector3(0, 2, 12), []);
	const end = useMemo(() => new THREE.Vector3(0, 0, BASE_CAMERA_Z), []);
	const lookStart = useMemo(() => new THREE.Vector3(0, 1, 0), []);
	const lookEnd = useMemo(() => new THREE.Vector3(0, 0, 0), []);
	const look = useMemo(() => new THREE.Vector3(), []);

	useFrame((_, delta) => {
		if (done.current) return;
		if (running) progress.current = Math.min(progress.current + delta * 0.45, 1);
		const p = progress.current;
		const t = p < 0.5 ? 4 * p ** 3 : 1 - Math.pow(-2 * p + 2, 3) / 2;
		camera.position.lerpVectors(start, end, t);
		camera.lookAt(look.lerpVectors(lookStart, lookEnd, t));
		if (p >= 1) {
			done.current = true;
			onDone();
		}
	});
	return null;
};

/// Monté seulement une fois les modèles du <Suspense> résolus. On attend deux
/// frames avant de prévenir : la première passe de useFrame précède le rendu.
const SceneReadySignal: React.FC<{ onReady: () => void }> = ({ onReady }) => {
	const frames = useRef(0);
	useFrame(() => {
		if (frames.current > 1) return;
		frames.current += 1;
		if (frames.current === 2) onReady();
	});
	return null;
};

interface ClassroomScene3DProps {
	activeAnimation: string;
	/** L'intro démarre quand l'écran de chargement s'efface */
	introRunning: boolean;
	introDone: boolean;
	onIntroDone: () => void;
	onReady: () => void;
	isEditing: boolean;
	onSheetClick: () => void;
	/** Le post-it « Mes notes » est pris en main */
	isNotesOpen: boolean;
	onNotesClick: () => void;
	/** Change à chaque note ajoutée : le post-it fait un bond */
	notesBump: number;
	/** Le contenu du tableau est lu en grand ailleurs (mobile) */
	boardVisible: boolean;
	board: React.ReactNode;
	sheet: React.ReactNode;
	notes: React.ReactNode;
}

const ClassroomScene3D: React.FC<ClassroomScene3DProps> = ({
	activeAnimation,
	introRunning,
	introDone,
	onIntroDone,
	onReady,
	isEditing,
	onSheetClick,
	isNotesOpen,
	onNotesClick,
	notesBump,
	boardVisible,
	board,
	sheet,
	notes,
}) => (
	<Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 2, 12], fov: CAMERA_FOV }} className="cls-canvas">
		<Suspense fallback={null}>
			<ClassroomLighting />
			<Environment preset="park" />
			<Classroom modelPath="/classroom2.glb" />
			<MiloModel modelPath="/MiloV11.glb" activeAnimation={activeAnimation} />
			<Board visible={boardVisible}>{board}</Board>
			<DeskItem config={SHEET} isHeld={isEditing} onPick={onSheetClick} label="feuille">
				{sheet}
			</DeskItem>
			<DeskItem config={POSTIT} isHeld={isNotesOpen} onPick={onNotesClick} label="post-it" bumpKey={notesBump}>
				{notes}
			</DeskItem>
			{introDone ? (
				<CameraRig isEditing={isEditing || isNotesOpen} />
			) : (
				<IntroCamera running={introRunning} onDone={onIntroDone} />
			)}
			<SceneReadySignal onReady={onReady} />
		</Suspense>
	</Canvas>
);

export default ClassroomScene3D;
