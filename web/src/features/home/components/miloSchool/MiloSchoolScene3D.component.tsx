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
import { MiloFootsteps, type FootGround } from "@features/home/components/miloSchool/miloSchool.footsteps";
import {
	ENTRY_MS,
	EXIT_MS,
	frameStep,
	partHandlers,
	schoolScene,
	type MiloSchoolBridge,
	type MiloSchoolFocus,
	type MiloSchoolPhase,
	type MissionsSummary,
} from "@features/home/components/miloSchool/miloSchool.bridge";

/// Scène 3D de la carte « Discute avec Milo » : Milo attend devant la porte
/// de sa salle de classe. Au survol de la porte (ou du bouton), elle s'ouvre
/// et Milo la montre du doigt ; au clic, il rentre en classe en marchant.

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
/// (marge à gauche : un peu d'air et la rivière entre le menu et la maison)
const WIDE_FRAME = { left: -4.1, right: 5.5 };
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
/// Le surplus de hauteur va surtout au ciel ; sur écran large, moins de ciel
/// et un peu plus de pelouse : la maison est plus grande et la vue plus basse
const SPARE_ABOVE_NARROW = 0.7;
const SPARE_ABOVE_WIDE = 0.4;
const CROSSFADE = 0.3;
const POINT_FADE = 0.45;
/// Bulle : à gauche de la tête (carte large) ou au-dessus (carte étroite)
const BUBBLE_SIDE_OFFSET = new THREE.Vector3(-0.32, 0.38, 0);
const BUBBLE_ABOVE_OFFSET = new THREE.Vector3(0, 0.82, 0);
/// Quand il invite l'élève à entrer, Milo se tourne un peu vers la porte :
/// assez pour que son doigt (clip « Point ») la montre, la tête vers l'élève
const INVITE_YAW = 0.45;
/// Les semelles juste posées sur l'herbe
const GROUND_CLEARANCE = 0.012;

/* ============================================================== CAMÉRA */

/// Gros plan sur la pancarte ou la boîte aux lettres : durée du trajet (s)
const FOCUS_SECONDS = 0.9;
const FOCUS_FOV = 30;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const MAIL_DIR = new THREE.Vector3();

/**
 * Pose de la caméra devant ce qu'on regarde de près : face à la pancarte
 * (assez près pour la lire), ou un peu devant la boîte aux lettres.
 */
function focusPose(focus: MiloSchoolFocus, aspect: number, basePos: THREE.Vector3, pos: THREE.Vector3, target: THREE.Vector3) {
	const halfTan = Math.tan(THREE.MathUtils.degToRad(FOCUS_FOV / 2));
	if (focus === "missions") {
		const { x, z, yaw } = SCHOOL.board;
		target.set(x, 1.08, z);
		/// La pancarte occupe une bonne part de la largeur, sans déborder en hauteur
		const fill = aspect < 1 ? 0.9 : 0.6;
		const distance = Math.max(1.1 / fill / 2 / (halfTan * aspect), 1.0 / 0.82 / 2 / halfTan);
		pos.set(x + Math.sin(yaw) * distance, 1.18, z + Math.cos(yaw) * distance);
		return;
	}
	const { x, z, yaw } = SCHOOL.mailbox;
	/// La boîte aux lettres un peu à droite : l'enveloppe s'envole vers le centre.
	/// On la regarde à mi-chemin entre la vue d'ensemble et sa face avant, la
	/// pancarte et le lampadaire restent ainsi hors du cadre
	target.set(x - 0.45, 1.05, z);
	MAIL_DIR.set(basePos.x - x, 0, basePos.z - z).normalize();
	MAIL_DIR.x += Math.sin(yaw);
	MAIL_DIR.z += Math.cos(yaw);
	MAIL_DIR.normalize();
	pos.copy(target).addScaledVector(MAIL_DIR, 2.9);
	pos.y = 1.45;
}

/** Caméra : cadrage selon la taille de l'écran, et gros plans à la demande */
const CameraRig: React.FC<{ bridge: MiloSchoolBridge; reducedMotion: boolean }> = ({ bridge, reducedMotion }) => {
	const { camera, size } = useThree();
	const door = useMemo(() => new THREE.Vector3(), []);
	const doorKey = useRef("");
	const doorStage = useRef<HTMLElement | null>(null);
	const pose = useMemo(
		() => ({
			basePos: new THREE.Vector3(),
			baseTarget: new THREE.Vector3(),
			focusPos: new THREE.Vector3(),
			focusTarget: new THREE.Vector3(),
			target: new THREE.Vector3(),
			anchor: new THREE.Vector3(),
			t: 0,
			last: null as MiloSchoolFocus | null,
			mailKey: "",
			mailRoot: null as HTMLElement | null,
			zoomed: false,
		}),
		[],
	);
	/// Caméra fantôme placée sur la pose de gros plan : sert à savoir où sera
	/// la boîte aux lettres à l'écran une fois la caméra arrivée
	const probe = useMemo(() => new THREE.PerspectiveCamera(FOCUS_FOV, 1, 0.1, 80), []);

	useFrame((_, delta) => {
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
		/// de la marge du bas, et assez large pour ce qui doit rester visible
		const frameH = Math.max(content / visibleShare, minWidth / aspect);
		const spare = frameH * visibleShare - content;
		const spareAbove = bridge.wide ? SPARE_ABOVE_WIDE : SPARE_ABOVE_NARROW;
		const centerY = FRAME_TOP + spare * spareAbove - frameH / 2;
		const baseFov = THREE.MathUtils.radToDeg(2 * Math.atan(frameH / 2 / CAMERA_DISTANCE));
		pose.basePos.set(centerX, centerY + CAMERA_LIFT, CAMERA_DISTANCE);
		pose.baseTarget.set(centerX, centerY, 0);

		/// Gros plan : la caméra glisse vers la pancarte ou la boîte aux lettres
		if (bridge.focus) pose.last = bridge.focus;
		const step = reducedMotion ? 1 : frameStep(delta) / FOCUS_SECONDS;
		pose.t = THREE.MathUtils.clamp(pose.t + (bridge.focus ? step : -step), 0, 1);
		bridge.zoom = pose.t;
		let fov = baseFov;
		if (pose.last) focusPose(pose.last, aspect, pose.basePos, pose.focusPos, pose.focusTarget);
		if (pose.t > 0 && pose.last) {
			const e = easeInOut(pose.t);
			cam.position.lerpVectors(pose.basePos, pose.focusPos, e);
			pose.target.lerpVectors(pose.baseTarget, pose.focusTarget, e);
			fov = THREE.MathUtils.lerp(baseFov, FOCUS_FOV, e);
		} else {
			cam.position.copy(pose.basePos);
			pose.target.copy(pose.baseTarget);
		}
		if (Math.abs(cam.fov - fov) > 0.01) {
			cam.fov = fov;
			cam.updateProjectionMatrix();
		}
		cam.lookAt(pose.target);

		/// Où sera la boîte aux lettres à l'écran, une fois en gros plan
		const root = bridge.root;
		if (root) {
			focusPose("mail", aspect, pose.basePos, probe.position, pose.anchor);
			probe.aspect = aspect;
			probe.updateProjectionMatrix();
			probe.lookAt(pose.anchor);
			probe.updateMatrixWorld();
			pose.anchor.set(SCHOOL.mailbox.x, 1.13, SCHOOL.mailbox.z).project(probe);
			const mx = Math.round(((pose.anchor.x + 1) / 2) * size.width);
			const my = Math.round(((1 - pose.anchor.y) / 2) * size.height);
			const key = `${mx},${my}`;
			/// Tant que la caméra n'est pas revenue, le titre et la bulle restent
			/// cachés (data-zoomed, lu par la feuille de style)
			const zoomed = pose.t > 0.02;
			if (key !== pose.mailKey || root !== pose.mailRoot || zoomed !== pose.zoomed) {
				pose.mailKey = key;
				pose.mailRoot = root;
				pose.zoomed = zoomed;
				root.style.setProperty("--mail-x", `${mx}px`);
				root.style.setProperty("--mail-y", `${my}px`);
				if (zoomed) root.dataset.zoomed = "";
				else delete root.dataset.zoomed;
			}
		}

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

/// Trajets lissés en courbe. À l'entrée : en diagonale sur la pelouse, tout
/// droit sur la marche et par la porte, un pas dans la classe (la lumière de
/// la classe recouvre alors l'écran). Au retour de l'élève, il sort de
/// derrière le mur de gauche, traverse la classe et revient à sa place.
const DOOR_X = SCHOOL.door.x;
const curve = (points: THREE.Vector3[]) => new THREE.CatmullRomCurve3(points, false, "centripetal");
const OUTSIDE = [
	MILO_SPOT.clone(),
	new THREE.Vector3(0.28, 0, 1.12),
	new THREE.Vector3(DOOR_X, 0, 0.8),
	new THREE.Vector3(DOOR_X, 0, 0.15),
	new THREE.Vector3(DOOR_X, 0, -0.45),
];
const ENTRY_PATH = curve([...OUTSIDE, new THREE.Vector3(DOOR_X - 0.22, 0, -0.95)]);
const EXIT_PATH = curve(
	[...OUTSIDE, new THREE.Vector3(DOOR_X - 0.35, 0, -0.95), new THREE.Vector3(DOOR_X - 1.05, 0, -1.25)].reverse(),
);
const ENTRY_LENGTH = ENTRY_PATH.getLength();
/// Temps (s) qu'il marche encore après le bout du trajet d'entrée
const ENTRY_OVERRUN = 0.6;
const EXIT_LENGTH = EXIT_PATH.getLength();
/// Pendant la sortie, la porte se referme une fois Milo descendu de la marche
const EXIT_DOOR_CLOSES_AT = (() => {
	const point = new THREE.Vector3();
	for (let i = 0; i <= 200; i++) {
		if (EXIT_PATH.getPointAt(i / 200, point).z > 0.85) return i / 200;
	}
	return 0.6;
})();

/// Clip « Walk » joué à vitesse normale : un cycle de deux pas (0,67 s)
/// avance de 2,4 unités du modèle. La cadence des pas suit la vitesse de
/// marche, pour que les pieds restent posés au sol sans glisser.
const WALK_CLIP_UNITS_PER_SECOND = 3.6;
/// Milo démarre et s'arrête en douceur (secondes)
const WALK_START = 0.3;
const WALK_STOP = 0.5;

/// Distance parcourue (et vitesse) au bout de `t` secondes d'un trajet de
/// `length` en `duration` secondes : accélération, allure constante, puis
/// arrêt en douceur si `stops`. Sinon (en entrant), il continue sur sa
/// lancée au-delà du bout du trajet, le temps que l'écran s'illumine.
const walkState = { distance: 0, speed: 0 };
function walkProfile(t: number, duration: number, length: number, stops: boolean) {
	const a = WALK_START;
	const d = stops ? WALK_STOP : 0;
	const cruise = length / (duration - a / 2 - d / 2);
	if (t >= duration) {
		walkState.distance = stops ? length : length + cruise * (t - duration);
		walkState.speed = stops ? 0 : cruise;
	} else if (t < a) {
		walkState.distance = (cruise * t * t) / (2 * a);
		walkState.speed = (cruise * t) / a;
	} else if (t < duration - d) {
		walkState.distance = (cruise * a) / 2 + cruise * (t - a);
		walkState.speed = cruise;
	} else {
		const left = duration - t;
		walkState.distance = length - (cruise * left * left) / (2 * d);
		walkState.speed = (cruise * left) / d;
	}
	return walkState;
}

/// La marche devant la porte (dessus à 11 cm) : Milo y monte, puis redescend
/// sur le plancher de la classe, au niveau de la pelouse
const STEP_TOP = 0.11;
const STEP_HALF_WIDTH = (SCHOOL.door.width + 0.6) / 2;
const smooth01 = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
function groundHeight(x: number, z: number) {
	if (Math.abs(x - DOOR_X) > STEP_HALF_WIDTH) return 0;
	return STEP_TOP * (smooth01((0.62 - z) / 0.16) - smooth01((-0.1 - z) / 0.16));
}
/** Sol sous un pied : herbe, pierre de la marche, ou rien (dans la classe) */
function groundUnder(x: number, z: number): FootGround | null {
	if (z < -0.06) return null;
	return Math.abs(x - DOOR_X) < STEP_HALF_WIDTH && z < 0.5 ? "stone" : "grass";
}

interface SchoolMiloProps {
	bridge: MiloSchoolBridge;
	gaze: boolean;
	reducedMotion: boolean;
	/** 0 = jour, 1 = nuit (les brins d'herbe et la poussière s'assombrissent) */
	night: number;
	onReady?: () => void;
}

const SchoolMilo: React.FC<SchoolMiloProps> = ({ bridge, gaze, reducedMotion, night, onReady }) => {
	const root = useRef<THREE.Group>(null);
	const body = useRef<THREE.Group>(null);
	const { scene, animations } = useMiloInstance(MILO_MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, body);
	const { equippedMeshNames } = useEquippedMeshNames();
	const { camera, size, invalidate } = useThree();
	/// Taille d'une unité du modèle dans la scène (mesurée une fois Milo cadré)
	const modelUnit = useRef(FIT_HEIGHT / 7.8);

	useMemo(() => prepareMiloScene(scene), [scene]);
	useLayoutEffect(() => {
		fitMiloToHeight(scene, FIT_HEIGHT);
		modelUnit.current = scene.scale.x * (scene.getObjectByName("rig")?.scale.x ?? 1);
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

	/// Herbe et poussière sous ses pas
	const footsteps = useMemo(() => new MiloFootsteps(), []);
	useEffect(() => () => footsteps.dispose(), [footsteps]);
	const feet = useMemo(() => {
		/// (le chargeur retire les points des noms : « DEF-foot.L » devient « DEF-footL »)
		const bone = (name: string) => scene.getObjectByName(name) ?? scene.getObjectByName(name.replace(".", "")) ?? null;
		return {
			heelL: bone("DEF-foot.L"),
			heelR: bone("DEF-foot.R"),
			toeL: bone("DEF-toe.L"),
			toeR: bone("DEF-toe.R"),
		};
	}, [scene]);

	const state = useRef({
		current: null as THREE.AnimationAction | null,
		reaction: null as THREE.AnimationAction | null,
		walk: null as THREE.AnimationAction | null,
		phase: "idle" as MiloSchoolPhase,
		yaw: 0,
		walkTime: 0,
		/// Avancement du cycle de marche à l'image précédente (-1 : pas encore)
		stepPhase: -1,
	});

	const idleAction = useCallback(() => findAction(actions, "Idle"), [actions]);

	const playLoop = useCallback((action: THREE.AnimationAction | null, fade = CROSSFADE) => {
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
		if (prev && prev !== action) action.crossFadeFrom(prev, fade, false);
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
			if (s.phase === "idle") playLoop(restLoop());
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
			mixer.stopAllAction();
			s.current = null;
			s.reaction = null;
			s.walk = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- lancé une fois par instance de Milo
	}, [actions, mixer, scene]);

	/// Les attentes s'enchaînent (Idle, Idle2, Idle3) tant que rien d'autre ne joue
	useEffect(
		() =>
			alternateIdlesOnLoop(mixer, actions, () => state.current.current, (next) => {
				const s = state.current;
				if (s.reaction || s.phase !== "idle") return;
				playLoop(next);
			}),
		[mixer, actions, playLoop],
	);

	const head = useMemo(() => scene.getObjectByName("DEF-head") ?? null, [scene]);
	const anchor = useMemo(
		() => ({ head: new THREE.Vector3(), v: new THREE.Vector3(), key: "", element: null as HTMLElement | null }),
		[],
	);
	const tmp = useMemo(
		() => ({
			a: new THREE.Vector3(),
			b: new THREE.Vector3(),
			heel: new THREE.Vector3(),
			toe: new THREE.Vector3(),
			viewport: new THREE.Vector2(),
		}),
		[],
	);

	const project = (offset: THREE.Vector3) => {
		anchor.v.copy(anchor.head).add(offset).project(camera);
		return [Math.round(((anchor.v.x + 1) / 2) * size.width), Math.round(((1 - anchor.v.y) / 2) * size.height)];
	};

	/** Un pas : le talon `heel` se pose, la pointe `toe` de l'autre pied pousse */
	const footfall = (heel: THREE.Object3D | null, toe: THREE.Object3D | null) => {
		const group = root.current;
		if (!heel || !toe || !group) return;
		heel.getWorldPosition(tmp.heel);
		toe.getWorldPosition(tmp.toe);
		const ground = groundUnder(tmp.heel.x, tmp.heel.z);
		if (!ground) return;
		tmp.heel.y = groundHeight(tmp.heel.x, tmp.heel.z);
		tmp.toe.y = groundHeight(tmp.toe.x, tmp.toe.z);
		const yaw = state.current.yaw;
		footsteps.step(tmp.heel, tmp.toe, -Math.sin(yaw), -Math.cos(yaw), ground);
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
			/// Repart de « idle » : si la page demande une sortie de classe, elle démarre ci-dessous
			s.phase = "idle";
			s.reaction = null;
			s.yaw = 0;
			group.visible = true;
			footsteps.clear();
			playLoop(restLoop());
		}

		/// Changement de phase demandé par l'interface
		if (bridge.phase !== s.phase) {
			const previous = s.phase;
			s.phase = bridge.phase;
			if (s.phase === "inviting") {
				/// Il montre la porte du doigt, tant qu'on la survole (le bras se
				/// lève pendant le fondu, un peu plus long que d'habitude)
				const point = findAction(actions, "Point");
				if (point && !reducedMotion) {
					s.reaction = null;
					playLoop(point, POINT_FADE);
				}
			} else if (s.phase === "entering" || s.phase === "exiting") {
				s.walkTime = 0;
				s.stepPhase = -1;
				s.reaction = null;
				s.walk = reducedMotion ? null : findAction(actions, "Walk");
				playLoop(s.walk);
				/// Il sort de derrière le mur de la classe, déjà tourné dans le sens de la marche
				if (s.phase === "exiting") {
					EXIT_PATH.getTangentAt(0, tmp.b);
					s.yaw = Math.atan2(tmp.b.x, tmp.b.z);
				}
			} else if (previous === "inviting" && !s.reaction) {
				playLoop(restLoop());
			}
		}

		const walking = s.phase === "entering" || s.phase === "exiting";
		/// Réaction ponctuelle (clic sur Milo…)
		if (bridge.reactions.length && !walking) {
			const action = findAction(actions, bridge.reactions.shift() ?? "");
			if (action) playOnce(action);
		}
		/// Garde-fou : plus rien ne joue, Milo serait figé
		if (!s.reaction && !walking && s.current && !s.current.isRunning()) playLoop(restLoop());

		const dt = frameStep(delta);
		if (walking) {
			/// Il marche le long du trajet, tourné dans le sens de la marche
			const exiting = s.phase === "exiting";
			const path = exiting ? EXIT_PATH : ENTRY_PATH;
			const length = exiting ? EXIT_LENGTH : ENTRY_LENGTH;
			const duration = (exiting ? EXIT_MS : ENTRY_MS) / 1000;
			s.walkTime = reducedMotion ? duration : s.walkTime + dt;
			const { distance, speed } = walkProfile(s.walkTime, duration, length, exiting);
			const u = THREE.MathUtils.clamp(distance / length, 0, 1);
			path.getPointAt(u, tmp.a);
			path.getTangentAt(u, tmp.b);
			/// Au-delà du bout du trajet, il continue tout droit
			if (distance > length) tmp.a.addScaledVector(tmp.b, distance - length);
			group.position.set(tmp.a.x, groundHeight(tmp.a.x, tmp.a.z) + FIT_HEIGHT / 2, tmp.a.z);
			s.yaw = dampAngle(s.yaw, Math.atan2(tmp.b.x, tmp.b.z), 9, dt);

			const walk = s.walk;
			if (walk) {
				/// La cadence des pas suit la vitesse : les pieds ne glissent pas
				walk.setEffectiveTimeScale(Math.max(speed / (WALK_CLIP_UNITS_PER_SECOND * modelUnit.current), 0.2));
				/// Un pied se pose à chaque demi-cycle : le gauche au début, le droit au milieu
				const phase = (walk.time / walk.getClip().duration) % 1;
				const last = s.stepPhase;
				s.stepPhase = phase;
				if (last >= 0 && group.visible && speed > 0.2 && walk.getEffectiveWeight() > 0.5) {
					if (phase < last) footfall(feet.heelL, feet.toeR);
					else if (last < 0.5 && phase >= 0.5) footfall(feet.heelR, feet.toeL);
				}
			}

			if (exiting) {
				group.visible = true;
				if (u >= EXIT_DOOR_CLOSES_AT) bridge.doorOpen = false;
				/// Arrivé à sa place : il se retourne vers l'élève et le salue
				if (s.walkTime >= duration) {
					s.phase = "idle";
					bridge.phase = "idle";
					bridge.doorOpen = false;
					bridge.reactions.push("Hello");
					bridge.onExitDone?.();
				}
			} else {
				/// L'écran est tout illuminé : on change de page. Si ça tarde, il
				/// disparaît plutôt que de traverser le fond de la classe.
				group.visible = s.walkTime < duration + ENTRY_OVERRUN;
			}
		} else {
			group.visible = true;
			group.position.set(MILO_SPOT.x, MILO_SPOT.y + FIT_HEIGHT / 2, MILO_SPOT.z);
			const target = s.phase === "inviting" ? INVITE_YAW : 0;
			s.yaw = reducedMotion ? target : dampAngle(s.yaw, target, 6, dt);
		}
		group.rotation.y = s.yaw;

		frame.gl.getDrawingBufferSize(tmp.viewport);
		footsteps.update(dt, tmp.viewport.y / 2, 1 - night * 0.55);
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
		<>
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
			{/* Herbe et poussière sous ses pas (coordonnées du monde) */}
			<primitive object={footsteps.points} />
		</>
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
			<CameraRig bridge={bridge} reducedMotion={reducedMotion} />
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
				<SchoolMilo
					bridge={bridge}
					gaze={gaze && !reducedMotion}
					reducedMotion={reducedMotion}
					night={night}
					onReady={handleReady}
				/>
			</Suspense>
		</MiloSchoolCanvas>
	);
};

export default MiloSchoolScene3D;
