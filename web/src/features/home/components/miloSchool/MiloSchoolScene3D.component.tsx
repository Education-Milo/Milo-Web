import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	MILO_MODEL_PATH,
	alternateIdlesOnLoop,
	applyEquippedAccessories,
	findAction,
	fitMiloToHeight,
	isIdleAction,
	prepareMiloScene,
	updateAngelCircleGlow,
} from "@features/my-milo/utils/miloModel";
import { useMiloGaze } from "@features/landing/hooks/useMiloGaze";
import { useHoverOutline } from "@features/home/components/miloSchool/miloSchool.outline";
import MiloSchoolYard, { SCHOOL } from "@features/home/components/miloSchool/MiloSchoolYard.component";
import MiloSchoolCanvas from "@features/home/components/miloSchool/MiloSchoolCanvas.component";
import {
	ENTRY_HOPS,
	HOP_SECONDS,
	frameStep,
	partHandlers,
	schoolScene,
	type MiloSchoolBridge,
	type MiloSchoolPhase,
	type MissionsSummary,
} from "@features/home/components/miloSchool/miloSchool.bridge";

/// Scène 3D de la carte « Discute avec Milo » : Milo attend devant la porte
/// de sa salle de classe. Au survol du bouton, la porte s'ouvre et il montre
/// le chemin ; au clic, il rentre en classe en sautillant.

/// Le modèle de Milo est téléchargé dès le chargement de l'appli (souvent déjà
/// en cache) : l'accueil s'affiche directement, sans écran d'attente
useGLTF.preload(MILO_MODEL_PATH);

const FIT_HEIGHT = 1.85;
/// Milo, sur la pelouse, à gauche de la porte
const MILO_SPOT = new THREE.Vector3(-0.78, 0, 1.45);
/// Cadrage (unités monde, mesurées dans le plan de la façade z = 0) : du bas du
/// toit aux pieds de Milo (plus près de la caméra, ils tombent sous le sol de la façade)
const FRAME_TOP = 4.1;
const FRAME_BOTTOM = -0.52;
/// Écran large : de la bulle de Milo (à gauche) à la boîte aux lettres
/// (à droite), toujours dans le cadre
const WIDE_FRAME = { left: -3.0, right: 5.9 };
/// Écran étroit : Milo et la porte ; la pancarte et la boîte aux lettres
/// passent alors en boutons dans l'interface
const NARROW_CENTER_X = 0.2;
const MIN_FRAME_WIDTH_NARROW = 4.3;
/// Écran presque carré (tablette) : un peu plus large, la pancarte entière
const SQUARE_CENTER_X = 0.9;
const MIN_FRAME_WIDTH_SQUARE = 7.2;
const CAMERA_DISTANCE = 8.5;
/// La caméra est un peu plus haute que le centre du cadre : on voit le toit
const CAMERA_LIFT = 0.55;
/// Le surplus de hauteur va au ciel plutôt qu'à la pelouse
const SPARE_ABOVE = 0.7;
const CROSSFADE = 0.3;
/// Bulle : à gauche de la tête (carte large) ou au-dessus (carte étroite)
const BUBBLE_SIDE_OFFSET = new THREE.Vector3(-0.32, 0.38, 0);
const BUBBLE_ABOVE_OFFSET = new THREE.Vector3(0, 0.82, 0);
/// Tournée vers la porte quand il invite l'élève à entrer
const INVITE_YAW = 0.55;
/// Les semelles juste posées sur l'herbe
const GROUND_CLEARANCE = 0.012;

/* ============================================================== CAMÉRA */

/** Caméra fixe : la scène se cadre selon la taille de l'écran, au-dessus du bouton */
const CameraRig: React.FC<{ bridge: MiloSchoolBridge }> = ({ bridge }) => {
	const { camera, size } = useThree();
	const door = useMemo(() => new THREE.Vector3(), []);
	const doorKey = useRef("");
	const doorStage = useRef<HTMLElement | null>(null);

	useFrame(() => {
		const cam = camera as THREE.PerspectiveCamera;
		const height = Math.max(size.height, 1);
		const reserved = THREE.MathUtils.clamp(bridge.bottomPx, 0, height * 0.4);
		const visibleShare = (height - reserved) / height;
		const aspect = size.width / height;
		const centerX = bridge.wide
			? (WIDE_FRAME.left + WIDE_FRAME.right) / 2
			: aspect < 1
				? NARROW_CENTER_X
				: SQUARE_CENTER_X;
		const minWidth = bridge.wide
			? WIDE_FRAME.right - WIDE_FRAME.left
			: aspect < 1
				? MIN_FRAME_WIDTH_NARROW
				: MIN_FRAME_WIDTH_SQUARE;
		const content = FRAME_TOP - FRAME_BOTTOM;
		/// Hauteur totale du cadre (à z = 0) pour que le contenu tienne au-dessus
		/// du bouton, et assez large pour ce qui doit rester visible
		const frameH = Math.max(content / visibleShare, minWidth / aspect);
		const spare = frameH * visibleShare - content;
		const centerY = FRAME_TOP + spare * SPARE_ABOVE - frameH / 2;
		const fov = THREE.MathUtils.radToDeg(2 * Math.atan(frameH / 2 / CAMERA_DISTANCE));

		if (Math.abs(cam.fov - fov) > 0.01) {
			cam.fov = fov;
			cam.updateProjectionMatrix();
		}
		cam.position.set(centerX, centerY + CAMERA_LIFT, CAMERA_DISTANCE);
		cam.lookAt(centerX, centerY, 0);

		/// Position de la porte à l'écran : le zoom d'entrée en classe part d'elle
		const stage = bridge.stage;
		if (stage) {
			cam.updateMatrixWorld();
			door.set(SCHOOL.door.x, SCHOOL.door.height * 0.5, 0).project(cam);
			const key = `${door.x.toFixed(3)},${door.y.toFixed(3)}`;
			/// (nouvelle page d'accueil = nouvel élément : on réécrit)
			if (key !== doorKey.current || stage !== doorStage.current) {
				doorKey.current = key;
				doorStage.current = stage;
				stage.style.setProperty("--door-x", `${((door.x + 1) / 2) * 100}%`);
				stage.style.setProperty("--door-y", `${((1 - door.y) / 2) * 100}%`);
			}
		}
	});
	return null;
};

/* ============================================================== LUMIÈRES */

const lerpColor = (day: string, night: string, t: number) => new THREE.Color(day).lerp(new THREE.Color(night), t);

const Lights: React.FC<{ night: number }> = ({ night }) => {
	const hemiSky = useMemo(() => lerpColor("#E2F2FF", "#6F7DCC", night), [night]);
	const sunColor = useMemo(() => lerpColor("#FFF1D6", "#9FB3FF", night), [night]);
	const miloTarget = useMemo(() => new THREE.Object3D(), []);
	return (
		<>
			<ambientLight intensity={0.7 - night * 0.45} color="#FFF4E6" />
			<hemisphereLight args={[hemiSky, "#6E8F3A", 0.95 - night * 0.5]} />
			<directionalLight
				position={[-5, 8, 7]}
				intensity={2.4 - night * 1.95}
				color={sunColor}
				castShadow
				shadow-mapSize={[1024, 1024]}
				shadow-bias={-0.0005}
				shadow-normalBias={0.03}
				shadow-camera-left={-8}
				shadow-camera-right={9}
				shadow-camera-top={7}
				shadow-camera-bottom={-4}
				shadow-camera-near={1}
				shadow-camera-far={30}
			/>
			<directionalLight position={[6, 3, 6]} intensity={0.45 - night * 0.25} color="#FFD7B5" />
			{/* La nuit, une douce lumière de face sur Milo, comme un projecteur de théâtre */}
			<primitive object={miloTarget} position={[MILO_SPOT.x, 1.0, MILO_SPOT.z]} />
			<spotLight
				position={[MILO_SPOT.x + 1.1, 3.8, MILO_SPOT.z + 3.2]}
				target={miloTarget}
				angle={0.38}
				penumbra={0.95}
				intensity={night * 22}
				distance={10}
				decay={1.6}
				color="#FFE4C4"
			/>
		</>
	);
};

/* ============================================================== MILO */

/// Trajet de l'entrée en classe : jusqu'au seuil, puis dans la classe
/// (ENTRY_HOPS + 1 points : un saut entre deux points)
const ENTRY_POINTS = [
	MILO_SPOT.clone(),
	new THREE.Vector3(0.02, 0, 1.08),
	new THREE.Vector3(SCHOOL.door.x, 0, 0.58),
	new THREE.Vector3(SCHOOL.door.x, 0.12, -0.25),
	new THREE.Vector3(SCHOOL.door.x, 0, -1.25),
];
const HOP_HEIGHT = 0.26;

interface SchoolMiloProps {
	bridge: MiloSchoolBridge;
	gaze: boolean;
	reducedMotion: boolean;
	onReady?: () => void;
}

const SchoolMilo: React.FC<SchoolMiloProps> = ({ bridge, gaze, reducedMotion, onReady }) => {
	const root = useRef<THREE.Group>(null);
	const body = useRef<THREE.Group>(null);
	const { scene, animations } = useMiloInstance(MILO_MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, body);
	const { equippedMeshNames } = useEquippedMeshNames();
	const { camera, size, invalidate } = useThree();

	useMemo(() => prepareMiloScene(scene), [scene]);
	useLayoutEffect(() => {
		fitMiloToHeight(scene, FIT_HEIGHT);
		scene.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) child.castShadow = true;
		});
	}, [scene]);
	useLayoutEffect(() => {
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	useMiloGaze(scene, gaze);
	/// Contour blanc au survol (Milo est cliquable)
	useHoverOutline(body, () => bridge.hovered === "milo" && state.current.phase === "idle", [scene]);

	const state = useRef({
		current: null as THREE.AnimationAction | null,
		reaction: null as THREE.AnimationAction | null,
		phase: "idle" as MiloSchoolPhase,
		yaw: 0,
		entryTime: 0,
	});

	const idleAction = useCallback(() => findAction(actions, "Idle"), [actions]);

	const playLoop = useCallback((action: THREE.AnimationAction | null) => {
		if (!action) return;
		const s = state.current;
		const prev = s.current;
		if (prev === action && action.isRunning() && action.loop === THREE.LoopRepeat) return;
		action.reset();
		action.enabled = true;
		action.setEffectiveTimeScale(1);
		action.setEffectiveWeight(1);
		action.setLoop(THREE.LoopRepeat, Infinity);
		action.clampWhenFinished = false;
		action.play();
		if (prev && prev !== action) action.crossFadeFrom(prev, CROSSFADE, false);
		s.current = action;
	}, []);

	const playOnce = useCallback((action: THREE.AnimationAction, timeScale = 1) => {
		const s = state.current;
		const prev = s.current;
		action.reset();
		action.enabled = true;
		action.setEffectiveTimeScale(timeScale);
		action.setEffectiveWeight(1);
		action.setLoop(THREE.LoopOnce, 1);
		action.clampWhenFinished = true;
		action.play();
		if (prev && prev !== action) action.crossFadeFrom(prev, CROSSFADE, false);
		s.current = action;
		s.reaction = action;
	}, []);

	const restLoop = useCallback(() => {
		const current = state.current.current;
		return current && isIdleAction(current) ? current : idleAction();
	}, [idleAction]);

	/// Arrivée : un salut de la main, puis l'attente
	useLayoutEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		const s = state.current;
		const hello = findAction(actions, "Hello");
		if (hello && !reducedMotion) playOnce(hello);
		else playLoop(idleAction());
		mixer.update(0);
		/// Pieds sur l'herbe : le cadrage du modèle centre sa boîte englobante,
		/// pas ses semelles. On mesure le point le plus bas de la pose de départ
		/// et on remonte le corps d'autant.
		if (root.current && body.current) {
			body.current.position.y = 0;
			const lowest = lowestPoint(scene, root.current);
			if (Number.isFinite(lowest)) {
				body.current.position.y = GROUND_CLEARANCE - FIT_HEIGHT / 2 - lowest;
			}
		}
		scene.visible = true;
		invalidate();
		onReady?.();

		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== s.reaction) return;
			s.reaction = null;
			if (s.phase !== "entering") playLoop(restLoop());
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
			mixer.stopAllAction();
			s.current = null;
			s.reaction = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- lancé une fois par instance de Milo
	}, [actions, mixer, scene]);

	/// Les attentes s'enchaînent (Idle, Idle2, Idle3) tant que rien d'autre ne joue
	useEffect(
		() =>
			alternateIdlesOnLoop(mixer, actions, () => state.current.current, (next) => {
				const s = state.current;
				if (s.reaction || s.phase === "entering") return;
				playLoop(next);
			}),
		[mixer, actions, playLoop],
	);

	const head = useMemo(() => scene.getObjectByName("DEF-head") ?? null, [scene]);
	const anchor = useMemo(
		() => ({ head: new THREE.Vector3(), v: new THREE.Vector3(), key: "", element: null as HTMLElement | null }),
		[],
	);
	const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

	const project = (offset: THREE.Vector3) => {
		anchor.v.copy(anchor.head).add(offset).project(camera);
		return [Math.round(((anchor.v.x + 1) / 2) * size.width), Math.round(((1 - anchor.v.y) / 2) * size.height)];
	};

	const lastBridge = useRef(bridge);
	useFrame((frame, delta) => {
		const s = state.current;
		const group = root.current;
		if (!group) return;

		/// Retour sur l'accueil : la scène a survécu, mais la page est neuve.
		/// Milo reprend sa place devant la porte, comme au premier jour.
		if (lastBridge.current !== bridge) {
			lastBridge.current = bridge;
			s.phase = bridge.phase;
			s.reaction = null;
			s.yaw = 0;
			group.visible = true;
			group.scale.setScalar(1);
			playLoop(restLoop());
		}

		/// Changement de phase demandé par l'interface
		if (bridge.phase !== s.phase) {
			const previous = s.phase;
			s.phase = bridge.phase;
			if (s.phase === "inviting") {
				const success = findAction(actions, "Success");
				if (success && !reducedMotion) playOnce(success, 1.15);
			} else if (s.phase === "entering") {
				s.entryTime = 0;
				const cheer = findAction(actions, "Success");
				if (cheer && !reducedMotion) playOnce(cheer, 1.3);
			} else if (previous === "inviting" && !s.reaction) {
				playLoop(restLoop());
			}
		}

		/// Réaction ponctuelle (clic sur Milo)
		if (bridge.reactions.length && s.phase !== "entering") {
			const action = findAction(actions, bridge.reactions.shift() ?? "");
			if (action) playOnce(action);
		}
		/// Garde-fou : plus rien ne joue, Milo serait figé
		if (!s.reaction && s.phase !== "entering" && s.current && !s.current.isRunning()) playLoop(restLoop());

		const dt = frameStep(delta);
		if (s.phase === "entering") {
			/// Petits sauts d'un point à l'autre du trajet, tourné dans le sens de la marche
			s.entryTime += reducedMotion ? 10 : dt;
			const hops = ENTRY_HOPS;
			const progress = Math.min(s.entryTime / HOP_SECONDS, hops);
			const index = THREE.MathUtils.clamp(Math.floor(progress), 0, hops - 1);
			const local = progress - index;
			const from = ENTRY_POINTS[index];
			const to = ENTRY_POINTS[index + 1];
			tmp.a.lerpVectors(from, to, local);
			const lift = Math.sin(local * Math.PI) * HOP_HEIGHT * (progress >= hops ? 0 : 1);
			group.position.set(tmp.a.x, tmp.a.y + lift + FIT_HEIGHT / 2, tmp.a.z);
			tmp.b.subVectors(to, from);
			const heading = Math.atan2(tmp.b.x, tmp.b.z);
			s.yaw = dampAngle(s.yaw, heading, 14, dt);
			/// Écrasé à l'atterrissage, étiré en l'air
			const squash = 1 - Math.sin(local * Math.PI * 2) * 0.06;
			group.scale.set(2 - squash, squash, 2 - squash);
			/// Une fois dans la classe, il disparaît (la porte se referme derrière lui)
			group.visible = progress < hops - 0.05;
		} else {
			group.visible = true;
			group.scale.setScalar(1);
			group.position.set(MILO_SPOT.x, MILO_SPOT.y + FIT_HEIGHT / 2, MILO_SPOT.z);
			const target = s.phase === "inviting" ? INVITE_YAW : 0;
			s.yaw = reducedMotion ? target : dampAngle(s.yaw, target, 6, dt);
		}
		group.rotation.y = s.yaw;

		updateAngelCircleGlow(scene, frame.clock.elapsedTime);

		/// Bulle accrochée à la tête : position écran, écrite sans passer par React
		const bubble = bridge.bubble;
		if (bubble && head) {
			head.getWorldPosition(anchor.head);
			const [ax, ay] = project(BUBBLE_SIDE_OFFSET);
			const [hx, hy] = project(BUBBLE_ABOVE_OFFSET);
			const key = `${ax},${ay},${hx},${hy}`;
			if (key !== anchor.key || bubble !== anchor.element) {
				anchor.key = key;
				anchor.element = bubble;
				bubble.style.setProperty("--ax", `${ax}px`);
				bubble.style.setProperty("--ay", `${ay}px`);
				bubble.style.setProperty("--hx", `${hx}px`);
				bubble.style.setProperty("--hy", `${hy}px`);
			}
		}
	});

	return (
		<group ref={root} position={[MILO_SPOT.x, FIT_HEIGHT / 2, MILO_SPOT.z]}>
			<group ref={body}>
				<primitive object={scene} />
			</group>
			{/* Zone de clic : une capsule invisible autour de Milo, au lieu de
			    tester les ~50 000 triangles animés du modèle */}
			<mesh visible={false} {...partHandlers(bridge, "milo")}>
				<capsuleGeometry args={[0.48, 0.8, 6, 12]} />
			</mesh>
		</group>
	);
};

/** Point le plus bas (y) des maillages animés visibles, dans le repère de `frame` */
function lowestPoint(object: THREE.Object3D, frame: THREE.Object3D) {
	frame.updateMatrixWorld(true);
	const toFrame = frame.matrixWorld.clone().invert();
	const vertex = new THREE.Vector3();
	let lowest = Infinity;
	object.traverse((child) => {
		const mesh = child as THREE.SkinnedMesh;
		if (!mesh.isSkinnedMesh || !mesh.visible) return;
		const toLocal = toFrame.clone().multiply(mesh.matrixWorld);
		const count = mesh.geometry.attributes.position.count;
		for (let i = 0; i < count; i++) {
			mesh.getVertexPosition(i, vertex).applyMatrix4(toLocal);
			if (vertex.y < lowest) lowest = vertex.y;
		}
	});
	return lowest;
}

/** Amortit un angle vers sa cible par le plus court chemin */
function dampAngle(current: number, target: number, speed: number, dt: number) {
	const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
	return current + diff * (1 - Math.exp(-speed * dt));
}

/* ============================================================== CANVAS */

export interface MiloSchoolScene3DProps {
	bridge: MiloSchoolBridge;
	/** Carte visible à l'écran : la scène ne tourne que dans ce cas */
	active: boolean;
	reducedMotion: boolean;
	/** Milo suit le curseur des yeux (désactivé pendant l'entrée en classe) */
	gaze: boolean;
	/** 0 = jour, 1 = nuit */
	night: number;
	missions: MissionsSummary;
	unreadNews: number;
	onReady?: () => void;
}

/// Réglages du moteur, lus à sa création (objets constants : la scène survit
/// aux visites, voir MiloSchoolCanvas)
const ENGINE = {
	shadows: true,
	/// Toute la page : on plafonne la densité de pixels pour rester fluide
	dpr: [1, 1.5] as [number, number],
	camera: { position: [NARROW_CENTER_X, 2.4, CAMERA_DISTANCE] as [number, number, number], fov: 30, near: 0.1, far: 80 },
	gl: { antialias: true, powerPreference: "high-performance" as const },
};
const onEngineCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => gl.setClearColor("#BFE4FA");


const MiloSchoolScene3D: React.FC<MiloSchoolScene3DProps> = ({
	bridge,
	active,
	reducedMotion,
	gaze,
	night,
	missions,
	unreadNews,
	onReady,
}) => {
	const handleReady = useCallback(() => {
		schoolScene.ready = true;
		onReady?.();
	}, [onReady]);
	return (
		<MiloSchoolCanvas
			frameloop={reducedMotion ? "demand" : active ? "always" : "never"}
			config={ENGINE}
			onCreated={onEngineCreated}
		>
			<CameraRig bridge={bridge} />
			<Lights night={night} />
			{/* Un seul Suspense : l'école et Milo apparaissent ensemble */}
			<Suspense fallback={null}>
				<MiloSchoolYard
					bridge={bridge}
					night={night}
					animate={!reducedMotion}
					reducedMotion={reducedMotion}
					missions={missions}
					unreadNews={unreadNews}
				/>
				<SchoolMilo bridge={bridge} gaze={gaze && !reducedMotion} reducedMotion={reducedMotion} onReady={handleReady} />
			</Suspense>
		</MiloSchoolCanvas>
	);
};

export default MiloSchoolScene3D;
