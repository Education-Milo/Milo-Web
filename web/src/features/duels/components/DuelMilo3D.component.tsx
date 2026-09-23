import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
	MILO_MODEL_PATH,
	applyEquippedAccessories,
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

/// Même cadrage que le Milo du QCM : haut du corps, focale longue
const FIT_HEIGHT = 2.1;
const FRAME_TOP = 1.3;
const FRAME_HEIGHT = 1.9;
const CAMERA_FOV = 20;
const FOCUS_Y = FRAME_TOP - FRAME_HEIGHT / 2;
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);

export interface DuelDance {
	/// Nom du clip d'animation (champ `mesh_name` d'un cosmétique de type "dance")
	clip: string;
	/// Change à chaque émote reçue, pour rejouer deux fois la même danse
	seq: number;
}

interface DuelMilo3DProps {
	/// `mesh_name` des skins équipés par CE joueur (message `start` du duel)
	equippedMeshNames: string[];
	/// Attente (boucle), bonne ou mauvaise réponse (jouée une fois)
	state: MiloQcmState;
	/// Danse à jouer une fois ; ignorée si Milo est déjà en pleine réaction
	dance?: DuelDance | null;
	/// Vrai tant qu'une réaction ou une danse est en cours : bloque les émotes
	onBusyChange?: (busy: boolean) => void;
	/// Orientation : Milo tourné vers la carte de question
	facing?: "right" | "left";
	className?: string;
}

function MiloModel({
	equippedMeshNames,
	state,
	dance,
	onBusyChange,
	facing,
	onReady,
}: Omit<DuelMilo3DProps, "className"> & { onReady: () => void }) {
	const group = useRef<THREE.Group>(null);
	const { scene: template, animations } = useGLTF(MILO_MODEL_PATH);
	/// Deux Milo peuvent être à l'écran : chaque instance clone la scène,
	/// sinon les deux modèles partageraient os et visibilité des accessoires.
	const scene = useMemo(() => SkeletonUtils.clone(template), [template]);
	const { actions, mixer } = useAnimations(animations, scene);
	const { invalidate } = useThree();

	const currentRef = useRef<THREE.AnimationAction | null>(null);
	/// Action "one-shot" en cours (réaction ou danse)
	const oneShotRef = useRef<THREE.AnimationAction | null>(null);
	const lastDanceSeqRef = useRef<number>(0);

	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	const setBusy = useCallback(
		(busy: boolean) => {
			onBusyChange?.(busy);
		},
		[onBusyChange],
	);

	const resolveAction = useCallback(
		(clipName: string) => {
			const action = findAction(actions, clipName);
			if (action) return action;
			if (import.meta.env.DEV) {
				console.warn(
					`[DuelMilo3D] Animation "${clipName}" introuvable. Clips disponibles : ${Object.keys(actions).join(", ")}`,
				);
			}
			return null;
		},
		[actions],
	);

	const idleAction = useCallback(
		() => resolveAction(MILO_QCM_CLIPS.waiting) ?? findAction(actions, Object.keys(actions)[0] ?? ""),
		[actions, resolveAction],
	);

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

	/// Réaction à la réponse : prioritaire sur une danse en cours
	useEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		if (state === "waiting") {
			// Nouvelle question : retour à l'attente seulement si rien ne joue
			if (!oneShotRef.current) fadeTo(idleAction(), false);
			return;
		}
		const action = resolveAction(MILO_QCM_CLIPS[state]) ?? idleAction();
		oneShotRef.current = action;
		setBusy(true);
		fadeTo(action, true);
	}, [state, actions, resolveAction, idleAction, fadeTo, setBusy]);

	/// Danse reçue : jouée une fois si Milo est libre
	useEffect(() => {
		if (!dance || dance.seq === lastDanceSeqRef.current) return;
		lastDanceSeqRef.current = dance.seq;
		if (!actions || Object.keys(actions).length === 0) return;
		if (oneShotRef.current) return; // réaction en cours : on ignore
		const action = resolveAction(dance.clip);
		if (!action) return; // clip absent du modèle : pas de saut d'animation
		oneShotRef.current = action;
		setBusy(true);
		fadeTo(action, true);
	}, [dance, actions, resolveAction, fadeTo, setBusy]);

	/// Fin d'un one-shot : retour à l'attente, Milo redevient disponible
	useEffect(() => {
		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== oneShotRef.current) return;
			oneShotRef.current = null;
			setBusy(false);
			fadeTo(idleAction(), false);
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
		};
	}, [mixer, fadeTo, idleAction, setBusy]);

	useEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);
		scene.visible = true;
		invalidate();
		onReady();
	}, [scene, invalidate, onReady]);

	useFrame(() => invalidate());

	const rotationY = facing === "left" ? -0.35 : 0.35;

	return (
		<group ref={group} position={[0, -FOCUS_Y, 0]} rotation={[0, rotationY, 0]}>
			<primitive object={scene} />
		</group>
	);
}

const DuelMilo3D: React.FC<DuelMilo3DProps> = ({ className = "", ...modelProps }) => {
	const [canMount, setCanMount] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const handleReady = useCallback(() => setIsReady(true), []);

	/// Comme pour le QCM : on monte le canvas après le premier affichage
	useEffect(() => {
		let idleId = 0;
		let rafId = 0;
		const start = () => setCanMount(true);
		if (typeof requestIdleCallback === "function") {
			idleId = requestIdleCallback(start, { timeout: 600 });
		} else {
			rafId = requestAnimationFrame(() => {
				rafId = requestAnimationFrame(start);
			});
		}
		return () => {
			if (idleId && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, []);

	return (
		<div className={`duel-milo-3d ${isReady ? "is-ready" : ""} ${className}`} aria-hidden="true">
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
						<MiloModel {...modelProps} onReady={handleReady} />
					</Suspense>
				</Canvas>
			)}
		</div>
	);
};

useGLTF.preload(MILO_MODEL_PATH);

export default DuelMilo3D;
