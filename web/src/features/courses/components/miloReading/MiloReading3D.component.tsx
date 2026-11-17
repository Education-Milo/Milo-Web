import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Canvas from "@shared/components/SafeCanvas.component";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	BOOK_MESH_NAME,
	READ_CLIP,
	applyEquippedAccessories,
	cameraDistanceFor,
	findAction,
	fitMiloToHeight,
	getBodyBox,
	prepareMiloScene,
} from "@features/my-milo/utils/miloModel";

/// Milo qui lit, dans l'en-tête de la page Cours : un livre apparaît entre
/// ses pattes, il le lit, tourne deux pages, le referme et le fait disparaître.
/// Entre deux lectures, il patiente sur son idle.
///
/// Le livre est un accessoire du modèle (maillage `livre`) : masqué partout
/// ailleurs, il n'est affiché ici que pendant le clip "Read".

/// --- Cadrage --------------------------------------------------------------
/// Le même que le Milo de la page Profil (MiloWelcome3D) et des cartes d'amis :
/// la tête et le haut du corps (le livre se lit à hauteur de poitrine), une
/// focale longue, la caméra à hauteur de Milo, tourné de trois quarts vers le
/// texte. Seule différence : un peu de marge en haut pour un chapeau.
/// Hauteur du corps entier une fois mis à l'échelle (entre -1.05 et +1.05)
const FIT_HEIGHT = 2.1;
/// Bas du cadre du profil (FRAME_TOP 1.375 - FRAME_HEIGHT 1.85) ; le reste
/// sort par le bas de la carte
const FRAME_BOTTOM = 1.375 - 1.85;
/// Haut du cadre : celui du profil, plus la place d'un haut-de-forme ou d'une
/// couronne (la toile est agrandie d'autant : Milo garde la taille du profil,
/// cf. .co-hero__reader)
const FRAME_TOP = 1.55;
const CAMERA_FOV = 14;
const FOCUS_Y = (FRAME_TOP + FRAME_BOTTOM) / 2;
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_TOP - FRAME_BOTTOM, CAMERA_FOV);
/// Trois quarts, tourné vers le texte de l'en-tête (comme sur le profil)
const YAW = -0.25;
/// Caméra à hauteur de Milo, comme partout ailleurs
const ELEVATION = 0;

/// --- Animations -----------------------------------------------------------
const IDLE_CLIP = "Idle";
const CROSSFADE = 0.35;
/// Première lecture peu après l'apparition, puis une pause entre deux lectures
const FIRST_READ_DELAY = 0.8;
const PAUSE_MIN = 5;
const PAUSE_MAX = 9;
/// Le livre a une échelle nulle au début et à la fin du clip (images 0-12 et
/// 214-240 sur 240). On ne l'affiche qu'entre les deux : pendant les fondus,
/// three mélange son échelle avec celle du repos (1) et le ferait surgir en
/// grand.
const BOOK_IN = 11 / 24;
const BOOK_OUT = 215 / 24;
/// Au retour d'un onglet en arrière-plan, pas de bond dans l'animation
const MAX_DELTA = 0.1;

const randomPause = () => PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);

function ReadingMilo({ onReady }: { onReady: () => void }) {
	const { scene, animations } = useMiloInstance();
	const { equippedMeshNames } = useEquippedMeshNames();

	/// Mixer géré ici (et non par useAnimations) pour borner le pas de temps
	const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
	const actions = useMemo(() => {
		const map: Record<string, THREE.AnimationAction> = {};
		for (const clip of animations) map[clip.name] = mixer.clipAction(clip);
		return map;
	}, [animations, mixer]);
	const idle = findAction(actions, IDLE_CLIP);
	const read = findAction(actions, READ_CLIP);
	const book = useMemo(() => scene.getObjectByName(BOOK_MESH_NAME) ?? null, [scene]);

	const currentRef = useRef<THREE.AnimationAction | null>(null);
	/// Temps restant (s) avant la prochaine lecture
	const countdown = useRef(FIRST_READ_DELAY);

	/// Dès la phase de rendu : pas d'image en T-pose avec tous les accessoires
	useMemo(() => prepareMiloScene(scene), [scene]);

	useLayoutEffect(() => {
		fitMiloToHeight(scene, FIT_HEIGHT);
		/// Même correction que MiloStage3D : on finit le centrage horizontal
		scene.position.x -= getBodyBox(scene).getCenter(new THREE.Vector3()).x;
		scene.visible = true;
		onReady();
	}, [scene, onReady]);

	useEffect(() => {
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	const fadeTo = useCallback((next: THREE.AnimationAction | null, once: boolean) => {
		if (!next) return;
		const prev = currentRef.current;
		next.reset();
		next.enabled = true;
		next.setEffectiveTimeScale(1);
		next.setEffectiveWeight(1);
		next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
		next.clampWhenFinished = once;
		next.play();
		if (prev && prev !== next) next.crossFadeFrom(prev, CROSSFADE, false);
		currentRef.current = next;
	}, []);

	/// Attente en boucle dès le chargement
	useEffect(() => {
		fadeTo(idle, false);
		return () => {
			mixer.stopAllAction();
			currentRef.current = null;
		};
	}, [idle, mixer, fadeTo]);

	/// Fin de la lecture : retour à l'attente, puis nouvelle lecture plus tard
	useEffect(() => {
		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== read) return;
			countdown.current = randomPause();
			fadeTo(idle, false);
		};
		mixer.addEventListener("finished", onFinished);
		return () => mixer.removeEventListener("finished", onFinished);
	}, [mixer, read, idle, fadeTo]);

	useFrame((_, delta) => {
		if (read && currentRef.current !== read) {
			countdown.current -= delta;
			if (countdown.current <= 0) fadeTo(read, true);
		}
		mixer.update(Math.min(delta, MAX_DELTA));

		if (book) {
			let showBook = false;
			if (read && currentRef.current === read && read.isRunning()) {
				showBook = read.getEffectiveWeight() > 0.98 && read.time > BOOK_IN && read.time < BOOK_OUT;
			}
			book.visible = showBook;
		}
	});

	return (
		<group rotation-x={ELEVATION}>
			<group position={[0, -FOCUS_Y, 0]} rotation-y={YAW}>
				<primitive object={scene} />
			</group>
		</group>
	);
}

const MiloReading3D: React.FC = () => {
	const wrapper = useRef<HTMLDivElement>(null);
	const [ready, setReady] = useState(false);
	const [visible, setVisible] = useState(true);
	const handleReady = useCallback(() => setReady(true), []);

	/// Hors de l'écran (page défilée), la scène ne calcule plus rien
	useEffect(() => {
		const el = wrapper.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={wrapper} className={`co-reader${ready ? " is-ready" : ""}`}>
			<Canvas
				frameloop={visible ? "always" : "never"}
				dpr={[1, 2]}
				/// Taille de mise en page, sans les transformations : mesurée
				/// pendant l'apparition (.co-reader à 96 %), la toile restait trop
				/// petite et Milo flottait au-dessus du bord de la carte
				resize={{ offsetSize: true }}
				camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
				gl={{ alpha: true, antialias: true }}
				style={{ background: "transparent" }}
			>
				{/* Exactement l'éclairage du Milo du profil (MiloWelcome3D) : même
				    couleur de pelage d'une page à l'autre */}
				<ambientLight intensity={2} color="#fff1e2" />
				<hemisphereLight args={["#ffffff", "#c4693a", 0.7]} />
				<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fffaf3" />
				<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
				<Suspense fallback={null}>
					<ReadingMilo onReady={handleReady} />
				</Suspense>
			</Canvas>
		</div>
	);
};

export default MiloReading3D;
