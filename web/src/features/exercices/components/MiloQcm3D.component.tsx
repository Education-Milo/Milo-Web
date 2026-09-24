import React, {
	Suspense,
	useCallback,
	useEffect,
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
	updateAngelCircleGlow,
	cameraDistanceFor,
	findAction,
	fitMiloToHeight,
	prepareMiloScene,
} from "@features/my-milo/utils/miloModel";
import {
	MILO_QCM_CLIPS,
	MILO_QCM_CROSSFADE,
	type MiloQcmState,
} from "@features/exercices/data/miloQcm.animations";

/// Hauteur du corps entier de Milo en unités monde, une fois mis à l'échelle
const FIT_HEIGHT = 2.1;
/// Haut du cadre, au-dessus des oreilles (le corps tient entre -1.05 et +1.05)
const FRAME_TOP = 1.3;
/// Hauteur visible : on ne garde que le haut du corps, le reste sort par le
/// bas de l'écran
const FRAME_HEIGHT = 1.9;
/// Focale longue : moins de déformation de perspective
const CAMERA_FOV = 20;
/// 0 = Milo regarde droit vers l'utilisateur
const ROTATION_Y = 0;
/// Décalage vers la gauche du cadre : garde son visage dégagé de la carte de
/// question, quelle que soit la largeur de l'écran
const OFFSET_X = -0.3;

const FOCUS_Y = FRAME_TOP - FRAME_HEIGHT / 2;
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);

function MiloModel({
	state,
	onReady,
}: {
	state: MiloQcmState;
	onReady: () => void;
}) {
	const group = useRef<THREE.Group>(null);
	const { scene, animations } = useGLTF(MILO_MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, group);
	const { invalidate } = useThree();

	/// Action en cours, et action "one-shot" en cours s'il y en a une
	const currentRef = useRef<THREE.AnimationAction | null>(null);
	const reactionRef = useRef<THREE.AnimationAction | null>(null);

	const { equippedMeshNames } = useEquippedMeshNames();

	/// Exécuté dès la phase de rendu, avant le premier frame
	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	/// Résout un nom de clip en action, avec repli sur l'animation d'attente
	/// puis sur le premier clip du modèle : un nom mal orthographié ne doit
	/// jamais laisser Milo figé ou invisible
	const resolveAction = useCallback(
		(clipName: string) => {
			const action = findAction(actions, clipName);
			if (action) return action;

			if (import.meta.env.DEV) {
				console.warn(
					`[MiloQcm3D] Animation "${clipName}" introuvable. Clips disponibles : ${Object.keys(
						actions,
					).join(", ")}`,
				);
			}
			return (
				findAction(actions, MILO_QCM_CLIPS.waiting) ??
				findAction(actions, Object.keys(actions)[0] ?? "")
			);
		},
		[actions],
	);

	/// Bascule proprement vers une animation : fondu enchaîné depuis la
	/// précédente, sans warp (les clips n'ont pas la même durée)
	const fadeTo = useCallback(
		(next: THREE.AnimationAction | null, once: boolean) => {
			if (!next) return;
			const prev = currentRef.current;
			if (prev === next && !once) return;

			next.reset();
			next.enabled = true;
			next.setEffectiveTimeScale(1);
			next.setEffectiveWeight(1);
			if (once) {
				next.setLoop(THREE.LoopOnce, 1);
				next.clampWhenFinished = true;
			} else {
				next.setLoop(THREE.LoopRepeat, Infinity);
				next.clampWhenFinished = false;
			}
			next.play();

			if (prev && prev !== next) {
				next.crossFadeFrom(prev, MILO_QCM_CROSSFADE, false);
			} else if (!prev) {
				next.fadeIn(MILO_QCM_CROSSFADE);
			}

			currentRef.current = next;
			invalidate();
		},
		[invalidate],
	);

	/// Une réaction (bonne/mauvaise réponse) se joue une fois, l'attente boucle
	useEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		const isReaction = state !== "waiting";
		const action = resolveAction(MILO_QCM_CLIPS[state]);
		reactionRef.current = isReaction ? action : null;
		fadeTo(action, isReaction);
	}, [state, actions, resolveAction, fadeTo]);

	/// Fin d'une réaction : retour à l'animation d'attente
	useEffect(() => {
		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== reactionRef.current) return;
			reactionRef.current = null;
			fadeTo(resolveAction(MILO_QCM_CLIPS.waiting), false);
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
		};
	}, [mixer, fadeTo, resolveAction]);

	/// Cadrage : indépendant de la pose, calculé une fois le modèle chargé
	useEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);
		scene.visible = true;
		invalidate();
		onReady();
	}, [scene, invalidate, onReady]);

	/// L'animation d'attente tourne en boucle : on rend en continu
	useFrame((state) => {
		updateAngelCircleGlow(scene, state.clock.elapsedTime);
		invalidate();
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

const MiloQcm3D: React.FC<{ state: MiloQcmState }> = ({ state }) => {
	/// Charger et parser le modèle (3,6 Mo, 263 os) puis créer le contexte
	/// WebGL bloque le thread principal plusieurs centaines de ms. Monté en
	/// même temps que le QCM, ça fige la page avant son premier affichage :
	/// on attend donc que la page soit peinte pour monter le canvas.
	const [canMount, setCanMount] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const handleReady = useCallback(() => setIsReady(true), []);

	useEffect(() => {
		let idleId = 0;
		let rafId = 0;
		const start = () => setCanMount(true);

		if (typeof requestIdleCallback === "function") {
			idleId = requestIdleCallback(start, { timeout: 600 });
		} else {
			/// Deux frames : la première peint le QCM, la seconde monte Milo
			rafId = requestAnimationFrame(() => {
				rafId = requestAnimationFrame(start);
			});
		}
		return () => {
			if (idleId && typeof cancelIdleCallback === "function") {
				cancelIdleCallback(idleId);
			}
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, []);

	return (
		<div
			className={`qcm-milo-3d${isReady ? " is-ready" : ""}`}
			aria-hidden="true"
		>
			{canMount && (
				<Canvas
					dpr={[1, 2]}
					camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
					gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
					style={{ background: "transparent" }}
				>
					<ambientLight intensity={1.5} color="#fff1e2" />
					<hemisphereLight args={["#ffffff", "#c4693a", 0.7]} />
					<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fffaf3" />
					<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
					<Suspense fallback={null}>
						<MiloModel state={state} onReady={handleReady} />
					</Suspense>
				</Canvas>
			)}
		</div>
	);
};

useGLTF.preload(MILO_MODEL_PATH);

export default MiloQcm3D;
