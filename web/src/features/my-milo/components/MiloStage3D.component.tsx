import React, {
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Sparkles, useAnimations, useGLTF } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { Loader } from "lucide-react";
import * as THREE from "three";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import {
	MILO_MODEL_PATH,
	applyEquippedAccessories,
	cameraDistanceFor,
	findAction,
	fitMiloToHeight,
	getBodyBox,
	prepareMiloScene,
} from "@features/my-milo/utils/miloModel";

/// --- Cadrage --------------------------------------------------------------
/// Hauteur du corps entier de Milo en unités monde, une fois mis à l'échelle
const FIT_HEIGHT = 2.1;
/// Haut du cadre, au-dessus des oreilles (le corps tient entre -1.05 et +1.05).
/// La marge restante laisse la place aux chapeaux hauts.
const FRAME_TOP = 1.28;
/// Hauteur visible : Milo en pied occupe ~84 % du cadre, plus une bande sous
/// les pieds pour son ombre
const FRAME_HEIGHT = 2.5;
/// Focale longue : moins de déformation de perspective sur un plan en pied
const CAMERA_FOV = 22;

const FOCUS_Y = FRAME_TOP - FRAME_HEIGHT / 2;
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);
/// Écart entre les pieds et le plan d'ombre. Les pieds sont mesurés sur la
/// pose de repos ; cette marge garantit qu'ils restent au-dessus du plan
/// quelle que soit l'animation, sinon ils passent derrière et l'ombre
/// disparaît.
const GROUND_MARGIN = 0.05;

/// --- Animations -----------------------------------------------------------
const IDLE_CLIP = "Idle";
const ARRIVAL_CLIP = "Arrival";
const CROSSFADE = 0.35;
/// Clips joués spontanément entre deux boucles d'attente, pour que Milo ne
/// reste jamais figé sur son idle. Uniquement des réactions positives : la
/// page est une vitrine, pas un exercice.
const BREAK_CLIPS = ["Hello", "Thinking", "Explaining", "Success"];
/// Fenêtre de temps (s) entre deux clips spontanés
const BREAK_DELAY_MIN = 7;
const BREAK_DELAY_MAX = 15;

/// Balancement lent du buste : assez pour que Milo ne soit jamais figé, sans
/// le décoller du sol ni réagir au curseur
const SWAY_YAW = 0.06;

/// --- Arrivée --------------------------------------------------------------
/// Milo entre par la gauche et glisse jusqu'au centre de la cabine, comme si
/// on l'amenait se changer. Vitesse de rattrapage : 4 correspond au `delta * 4`
/// de la version d'origine, mais sans dépendre de la fréquence d'affichage.
const ENTER_LAMBDA = 4;
/// Demi-largeur du corps, ajoutée à la demi-largeur visible pour que le départ
/// soit franchement hors cadre
const BODY_HALF_WIDTH = 0.7;

const randomBreakClip = () => BREAK_CLIPS[Math.floor(Math.random() * BREAK_CLIPS.length)];
const randomBreakDelay = () =>
	BREAK_DELAY_MIN + Math.random() * (BREAK_DELAY_MAX - BREAK_DELAY_MIN);

/** Clip à jouer une fois, identifié par un compteur pour rejouer le même. */
export interface MiloReaction {
	clip: string;
	nonce: number;
}

interface MiloActorProps {
	reaction: MiloReaction;
	/// Mouvement réduit demandé par le système : Milo joue ses animations mais
	/// ne se balance plus
	calm: boolean;
	onReady: () => void;
}

function MiloActor({ reaction, calm, onReady }: MiloActorProps) {
	const frame = useRef<THREE.Group>(null);
	const body = useRef<THREE.Group>(null);
	const shadow = useRef<THREE.Group>(null);
	const { scene, animations } = useGLTF(MILO_MODEL_PATH);
	const { actions, mixer } = useAnimations(animations, frame);

	const { equippedMeshNames } = useEquippedMeshNames();

	/// Action en boucle en cours, et clip "one-shot" s'il y en a un
	const currentRef = useRef<THREE.AnimationAction | null>(null);
	const oneShotRef = useRef<THREE.AnimationAction | null>(null);
	/// Temps restant (s) avant le prochain clip spontané
	const breakCountdown = useRef(randomBreakDelay());
	/// Progression de l'arrivée en scène, 0 → 1
	const enterRef = useRef(0);

	/// Exécuté dès la phase de rendu, donc avant le premier frame : évite la
	/// frame en T-pose avec tous les accessoires visibles
	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	/// Cadrage : indépendant de la pose, calculé une fois le modèle chargé
	useLayoutEffect(() => {
		if (!scene) return;
		fitMiloToHeight(scene, FIT_HEIGHT);

		/// fitMiloToHeight centre Y et Z mais laisse Milo décalé de
		/// 0.35 × échelle sur X (la position de départ qu'elle applique avant
		/// de mesurer n'est pas reprise dans son calcul final). On finit donc
		/// le centrage ici, plutôt que de corriger l'utilitaire : les deux
		/// autres vues 3D compensent ce décalage avec leur propre OFFSET_X.
		const box = getBodyBox(scene);
		scene.position.x -= box.getCenter(new THREE.Vector3()).x;

		/// Le plan d'ombre se cale sur les pieds réels du modèle, et non sur
		/// une hauteur supposée
		if (shadow.current) shadow.current.position.y = box.min.y - GROUND_MARGIN;

		scene.visible = true;
		onReady();
	}, [scene, onReady]);

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames]);

	const idleAction = useCallback(
		() => findAction(actions, IDLE_CLIP) ?? findAction(actions, Object.keys(actions)[0] ?? ""),
		[actions],
	);

	/// Bascule vers une animation : fondu enchaîné depuis la précédente, sans
	/// warp (les clips n'ont pas la même durée)
	const fadeTo = useCallback((next: THREE.AnimationAction | null, once: boolean) => {
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

		if (prev && prev !== next) next.crossFadeFrom(prev, CROSSFADE, false);
		else if (!prev) next.fadeIn(CROSSFADE);

		currentRef.current = next;
	}, []);

	/// Joue un clip une fois puis revient à l'attente. Un nom absent du modèle
	/// ne doit jamais laisser Milo figé : on retombe sur l'idle.
	const playOnce = useCallback(
		(clipName: string) => {
			const action = findAction(actions, clipName);
			if (!action) {
				if (import.meta.env.DEV) {
					console.warn(
						`[MiloStage3D] Animation "${clipName}" introuvable. Clips disponibles : ${Object.keys(actions).join(", ")}`,
					);
				}
				return;
			}
			oneShotRef.current = action;
			breakCountdown.current = randomBreakDelay();
			fadeTo(action, true);
		},
		[actions, fadeTo],
	);

	/// Entrée en scène, puis attente en boucle
	useEffect(() => {
		if (!actions || Object.keys(actions).length === 0) return;
		const arrival = findAction(actions, ARRIVAL_CLIP);
		if (arrival) {
			oneShotRef.current = arrival;
			fadeTo(arrival, true);
		} else {
			fadeTo(idleAction(), false);
		}
	}, [actions, fadeTo, idleAction]);

	/// Fin d'un clip one-shot : retour à l'attente
	useEffect(() => {
		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== oneShotRef.current) return;
			oneShotRef.current = null;
			breakCountdown.current = randomBreakDelay();
			fadeTo(idleAction(), false);
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
		};
	}, [mixer, fadeTo, idleAction]);

	/// Réaction à un équipement : Milo regarde ce qu'il vient d'enfiler
	useEffect(() => {
		if (reaction.nonce === 0) return;
		playOnce(reaction.clip);
	}, [reaction, playOnce]);

	useFrame((state, delta) => {
		const group = body.current;
		if (!group) return;

		/// Arrivée par la gauche. Le point de départ se calcule sur la largeur
		/// visible : Milo démarre hors cadre quelle que soit la taille de la
		/// carte. Passé l'arrivée, il reste posé au sol, sans flottement.
		const enter = calm
			? 1
			: (enterRef.current = THREE.MathUtils.damp(enterRef.current, 1, ENTER_LAMBDA, delta));
		const startX = -(state.viewport.width / 2 + BODY_HALF_WIDTH);
		group.position.x = THREE.MathUtils.lerp(startX, 0, enter);

		if (calm) {
			group.rotation.y = 0;
			return;
		}

		group.rotation.y = Math.sin(state.clock.elapsedTime * 0.37) * SWAY_YAW * enter;

		/// Clip spontané, quand rien d'autre ne joue
		if (!oneShotRef.current) {
			breakCountdown.current -= delta;
			if (breakCountdown.current <= 0) playOnce(randomBreakClip());
		}
	});

	return (
		<group ref={frame} position={[0, -FOCUS_Y, 0]}>
			<group ref={body}>
				<primitive object={scene} />
			</group>
			{/* Ombre de contact. `far` ne couvre que les pattes : au-delà, le
				corps entier se projetterait en un gros pavé sombre détaché du
				sol. Elle vit dans le groupe de cadrage, pas dans celui qui
				bouge, pour rester plaquée au sol. */}
			<ContactShadows
				ref={shadow}
				scale={2.4}
				resolution={512}
				blur={2.4}
				opacity={0.38}
				far={0.9}
				color="#4A3F35"
			/>
		</group>
	);
}

interface MiloStage3DProps {
	reaction: MiloReaction;
}

const MiloStage3D: React.FC<MiloStage3DProps> = ({ reaction }) => {
	const [isReady, setIsReady] = useState(false);
	const calm = useReducedMotion() ?? false;
	const handleReady = useCallback(() => setIsReady(true), []);

	return (
		<div className={`milo-stage${isReady ? " is-ready" : ""}`}>
			<Canvas
				className="milo-stage-canvas"
				dpr={[1, 2]}
				camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
				gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
				style={{ background: "transparent" }}
			>
				{/* Même rig que les autres Milo de l'app, plus un contre-jour qui
					détache la silhouette du fond clair de la carte */}
				<ambientLight intensity={1.35} color="#fff1e2" />
				<hemisphereLight args={["#ffffff", "#c4693a", 0.7]} />
				<directionalLight position={[3, 5, 4]} intensity={2.1} color="#fffaf3" />
				<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
				<directionalLight position={[-2, 3, -4]} intensity={1.1} color="#ffd2a8" />
				<Suspense fallback={null}>
					<MiloActor reaction={reaction} calm={calm} onReady={handleReady} />
					{!calm && (
						<Sparkles
							count={18}
							scale={[1.8, 2.6, 1.4]}
							position={[0, 0.1, -0.2]}
							size={2.6}
							speed={0.35}
							opacity={0.45}
							color="#E28743"
						/>
					)}
				</Suspense>
			</Canvas>
			{!isReady && (
				<div className="milo-stage-loading">
					<Loader size={26} className="locker-spin" />
				</div>
			)}
		</div>
	);
};

useGLTF.preload(MILO_MODEL_PATH);

export default MiloStage3D;
