import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import Canvas from "@shared/components/SafeCanvas.component";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	MILO_MODEL_PATH,
	alternateIdlesOnLoop,
	applyEquippedAccessories,
	findAction,
	findFirstAction,
	fitMiloToHeight,
	prepareMiloScene,
	warnClipFallbackOnce,
} from "@features/my-milo/utils/miloModel";
import {
	DUEL_MILO_CAMERA_DISTANCE,
	DUEL_MILO_FIT_HEIGHT,
	DUEL_MILO_FOCUS_Y,
	DUEL_MILO_FOV,
} from "@features/duels/utils/duelMiloFrame";
import {
	MILO_QCM_CLIPS,
	MILO_QCM_CROSSFADE,
	type MiloQcmState,
} from "@features/exercices/data/miloQcm.animations";

/// Même cadrage que le Milo du QCM : haut du corps, focale longue
const FIT_HEIGHT = DUEL_MILO_FIT_HEIGHT;
const CAMERA_FOV = DUEL_MILO_FOV;
const FOCUS_Y = DUEL_MILO_FOCUS_Y;
const CAMERA_DISTANCE = DUEL_MILO_CAMERA_DISTANCE;

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
	/// Milo est chargé et cadré : ses animations peuvent être jouées
	onReady?: () => void;
	/// Attente (ms) avant de lancer la 3D : le démarrage (contexte WebGL, copie
	/// du modèle, shaders) fige l'écran un instant, mieux vaut qu'il tombe une
	/// fois l'animation d'arrivée terminée
	mountDelayMs?: number;
	/// Résolution maximale du rendu (×2 par défaut)
	maxDpr?: number;
}

export function MiloModel({
	equippedMeshNames,
	state,
	dance,
	onBusyChange,
	facing,
	onReady,
}: Omit<DuelMilo3DProps, "className" | "onReady" | "mountDelayMs" | "maxDpr"> & { onReady: () => void }) {
	const group = useRef<THREE.Group>(null);
	/// Deux Milo sont à l'écran : chacun travaille sur sa propre copie, sinon
	/// les deux modèles partageraient os et visibilité des accessoires.
	const { scene, animations } = useMiloInstance();
	const { actions, mixer } = useAnimations(animations, scene);
	const { invalidate, gl, camera, scene: root } = useThree();

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

	/// Clip nommé, ou null s'il n'existe pas dans le modèle
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
		() =>
			findFirstAction(actions, MILO_QCM_CLIPS.waiting) ??
			findAction(actions, Object.keys(actions)[0] ?? ""),
		[actions],
	);

	/// Réaction à une réponse, ou null si aucun clip candidat n'existe. Pas de
	/// repli sur l'attente : une réaction est jouée une fois puis clampée sur sa
	/// dernière frame, et y envoyer l'attente la figeait définitivement.
	const resolveReaction = useCallback(
		(state: MiloQcmState) => {
			const candidates = MILO_QCM_CLIPS[state];
			const action = findFirstAction(actions, candidates);
			const played = action?.getClip().name ?? "";
			if (action && played.toLowerCase() !== candidates[0].toLowerCase()) {
				warnClipFallbackOnce("DuelMilo3D", candidates[0], played);
			}
			if (!action && import.meta.env.DEV) {
				console.warn(
					`[DuelMilo3D] Aucun clip pour l'état "${state}" (essayés : ${MILO_QCM_CLIPS[state].join(", ")}).`,
				);
			}
			return action;
		},
		[actions],
	);

	const fadeTo = useCallback(
		(next: THREE.AnimationAction | null, once: boolean) => {
			if (!next) return;
			const prev = currentRef.current;
			/// Déjà en boucle sur cette animation : la relancer la ferait sauter à
			/// sa première frame. Si elle est à l'arrêt (clampée par un LoopOnce),
			/// il faut au contraire la remettre en boucle.
			const alreadyLooping =
				prev === next && next.isRunning() && next.loop === THREE.LoopRepeat;
			if (!once && alreadyLooping) return;

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
		const idle = idleAction();
		const action = resolveReaction(state);
		/// Rien à jouer pour cet état : on reste en attente et Milo reste
		/// disponible pour les émotes
		if (!action || action === idle) {
			oneShotRef.current = null;
			setBusy(false);
			fadeTo(idle, false);
			return;
		}
		oneShotRef.current = action;
		setBusy(true);
		fadeTo(action, true);
	}, [state, actions, resolveReaction, idleAction, fadeTo, setBusy]);

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

	/// À chaque fin de boucle d'attente, Milo passe à une autre (Idle, Idle2…)
	useEffect(
		() => alternateIdlesOnLoop(mixer, actions, () => currentRef.current, (next) => fadeTo(next, false)),
		[mixer, actions, fadeTo],
	);

	/// Milo n'apparaît qu'une fois ses shaders compilés : en parallèle quand le
	/// navigateur le permet, au lieu de figer l'écran à la première image
	useEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);
		let cancelled = false;
		const show = () => {
			if (cancelled) return;
			scene.visible = true;
			invalidate();
			onReady();
		};
		/// (compile() ne parcourt que les objets visibles : Milo l'est le temps de l'appel)
		scene.visible = true;
		const compiling = gl.compileAsync(root, camera);
		scene.visible = false;
		compiling.then(show, show);
		return () => {
			cancelled = true;
		};
	}, [scene, invalidate, onReady, gl, camera, root]);

	useFrame(() => {
		/// Garde-fou : plus aucune animation active veut dire Milo figé sur sa
		/// dernière frame — et, s'il restait une réaction en cours, plus aucune
		/// émote acceptée. On repart de l'attente.
		const current = currentRef.current;
		if (current && !current.isRunning()) {
			if (oneShotRef.current) {
				oneShotRef.current = null;
				setBusy(false);
			}
			fadeTo(idleAction(), false);
		}
		invalidate();
	});

	const rotationY = facing === "left" ? -0.35 : 0.35;

	return (
		<group ref={group} position={[0, -FOCUS_Y, 0]} rotation={[0, rotationY, 0]}>
			<primitive object={scene} />
		</group>
	);
}

/** Éclairage du Milo des duels (partagé avec la carte des amis) */
export const DuelMiloLights: React.FC = () => (
	<>
		<ambientLight intensity={1.5} color="#fff1e2" />
		<hemisphereLight args={["#ffffff", "#c4693a", 0.7]} />
		<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fffaf3" />
		<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
	</>
);

const DuelMilo3D: React.FC<DuelMilo3DProps> = ({ className = "", onReady, mountDelayMs = 0, maxDpr = 2, ...modelProps }) => {
	const [canMount, setCanMount] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const onReadyRef = useRef(onReady);
	useEffect(() => {
		onReadyRef.current = onReady;
	});
	const handleReady = useCallback(() => {
		setIsReady(true);
		onReadyRef.current?.();
	}, []);

	/// Comme pour le QCM : on monte le canvas après le premier affichage
	useEffect(() => {
		let idleId = 0;
		let rafId = 0;
		const start = () => setCanMount(true);
		const schedule = () => {
			if (typeof requestIdleCallback === "function") {
				idleId = requestIdleCallback(start, { timeout: 600 });
			} else {
				rafId = requestAnimationFrame(() => {
					rafId = requestAnimationFrame(start);
				});
			}
		};
		/// (démonté avant la fin de l'attente : la 3D n'est jamais lancée)
		const delayId = mountDelayMs > 0 ? window.setTimeout(schedule, mountDelayMs) : 0;
		if (!delayId) schedule();
		return () => {
			window.clearTimeout(delayId);
			if (idleId && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [mountDelayMs]);

	return (
		<div className={`duel-milo-3d ${isReady ? "is-ready" : ""} ${className}`} aria-hidden="true">
			{canMount && (
				<Canvas aria-hidden="true"
					dpr={[1, maxDpr]}
					camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
					gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
					style={{ background: "transparent" }}
				>
					<DuelMiloLights />
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
