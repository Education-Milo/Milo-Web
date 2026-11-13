import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import Canvas from "@shared/components/SafeCanvas.component";
import { Environment, Html, useAnimations, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	alternateIdlesOnLoop,
	applyAngelCircleGlow,
	applyEquippedAccessories,
	findAction,
	MILO_MODEL_PATH,
	prepareMiloScene,
	updateAngelCircleGlow,
} from "@features/my-milo/utils/miloModel";
import { CLASSROOM_MODEL } from "@features/milo-scene/utils/classroomAssets";
import {
	MILO_REST_YAW,
	MILO_SCALE,
	MILO_SPOT,
	NATURAL_WALK_SPEED,
	createEntrance,
	isEntering,
	type Entrance,
	type EntrancePhase,
} from "@features/milo-scene/utils/classroomEntrance";
import {
	ClassroomDoorway,
	EntranceDirector,
	LandingDust,
} from "@features/milo-scene/components/ClassroomEntrance.component";

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

/// Halo des objets du bureau : un rayonnement doux qui déborde de leurs bords
/// (côté du halo / côté de l'objet). Au survol, il s'allume franchement et
/// l'objet se soulève un peu : on comprend qu'on peut le prendre.
const GLOW_SPREAD = 1.75;
const GLOW_IDLE = { base: 0.3, swing: 0.16 };

/** Texture du halo : un carré flou de la couleur voulue, transparent autour */
function makeGlowTexture(color: string) {
	const size = 256;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const inset = (size * (1 - 1 / GLOW_SPREAD)) / 2;
		ctx.shadowColor = color;
		ctx.shadowBlur = inset * 0.95;
		ctx.fillStyle = color;
		/// (deux passes : un halo plus dense près du bord de l'objet)
		for (let i = 0; i < 2; i++) ctx.fillRect(inset, inset, size - 2 * inset, size - 2 * inset);
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

/// Pendant l'écriture, la caméra descend un peu : le tableau remonte à l'écran
const EDIT_CAMERA_DROP = 0.12;

/// Les Html projetés restent sous l'interface (barres, fenêtres)
const HTML_Z_RANGE: [number, number] = [4, 0];

interface MiloModelProps {
	modelPath: string;
	activeAnimation: string;
	/** Entrée en classe : Milo arrive par la porte et bondit à sa place */
	entrance: Entrance;
}

/// Réactions jouées par l'easter egg (clic sur Milo)
const EASTER_EGG_CLIPS = ["67", "HatLook", "Hello"];
/// Pose « ta-da » jouée quand Milo atterrit à sa place
const ENTRANCE_CLIP = "Arrival";
const MILO_SPOT_ARRAY = MILO_SPOT.toArray();
const MILO_UNSPOT_ARRAY = MILO_SPOT.clone().negate().toArray();
const MILO_REST_ROTATION: [number, number, number] = [0, MILO_REST_YAW, 0];
/// Quand Milo atterrit, la poussière de craie tombe du haut du tableau (juste
/// sous le cadre, devant l'ardoise)
const BOARD_DUST = { left: -4.4, right: 3.7, y: 1.95, z: 0.66 };

function MiloModel({ modelPath, activeAnimation, entrance }: MiloModelProps) {
	const group = useRef<THREE.Group>(null);
	/// Déplace Milo pendant l'entrée ; à sa place, il ne change rien
	const mover = useRef<THREE.Group>(null);
	/// Copie dédiée à la salle de classe : la scène du .glb est partagée avec
	/// les autres écrans, on ne doit pas y laisser la pose posée ici.
	const { scene, animations } = useMiloInstance(modelPath);
	const { actions, mixer } = useAnimations(animations, group);
	/// Action réellement jouée : ce n'est plus forcément `activeAnimation`
	/// quand Milo alterne entre ses attentes (Idle, Idle2…)
	const currentAction = useRef<THREE.AnimationAction | null>(null);
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

	/// Lance une animation en boucle, en fondu depuis celle qui joue
	const loopTo = useCallback((nextAction: THREE.AnimationAction, fade = 0.5) => {
		const prevAction = currentAction.current;
		nextAction.reset();
		nextAction.setLoop(THREE.LoopRepeat, Infinity);
		nextAction.play();
		if (prevAction && prevAction !== nextAction) {
			prevAction.crossFadeTo(nextAction, fade, true);
		} else {
			nextAction.fadeIn(fade);
		}
		currentAction.current = nextAction;
	}, []);

	/// Easter egg : un clic sur Milo joue une réaction au hasard, puis il
	/// reprend ce qu'il faisait. Volontairement discret : pas de curseur
	/// « main » ni d'indication, c'est une surprise à découvrir.
	const activeRef = useRef(activeAnimation);
	activeRef.current = activeAnimation;
	const reacting = useRef<THREE.AnimationAction | null>(null);
	/// Pose d'atterrissage de l'entrée, en cours
	const entranceClip = useRef<THREE.AnimationAction | null>(null);

	useEffect(() => {
		if (!actions || !activeAnimation) return;
		/// Pendant l'entrée, c'est elle qui choisit les clips (marche, bond, pose) :
		/// Milo reprendra l'animation demandée une fois posé
		if (entrance.phase === "walking" || entrance.phase === "leaping") return;
		if (entranceClip.current && reacting.current === entranceClip.current) return;
		const nextAction = actions[activeAnimation];
		if (nextAction) loopTo(nextAction);
	}, [actions, activeAnimation, loopTo, entrance]);

	useEffect(() => {
		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (event.action !== reacting.current) return;
			reacting.current = null;
			const back = actions[activeRef.current];
			if (back) loopTo(back);
		};
		mixer.addEventListener("finished", onFinished);
		return () => mixer.removeEventListener("finished", onFinished);
	}, [mixer, actions, loopTo]);

	const playEasterEgg = useCallback(() => {
		if (reacting.current || isEntering(entrance.phase)) return;
		const pool = EASTER_EGG_CLIPS.map((name) => findAction(actions, name)).filter(
			(action): action is THREE.AnimationAction => Boolean(action),
		);
		if (pool.length === 0) return;
		const action = pool[Math.floor(Math.random() * pool.length)];
		const prev = currentAction.current;
		action.reset();
		action.setLoop(THREE.LoopOnce, 1);
		action.clampWhenFinished = true;
		action.play();
		if (prev && prev !== action) prev.crossFadeTo(action, 0.3, true);
		currentAction.current = action;
		reacting.current = action;
	}, [actions, entrance]);

	/// Atterrissage : la pose « ta-da », puis l'animation demandée (cf. « finished »)
	const playEntranceClip = useCallback(() => {
		const arrival = findAction(actions, ENTRANCE_CLIP);
		if (!arrival) {
			const back = actions[activeRef.current];
			if (back) loopTo(back, 0.25);
			return;
		}
		const prev = currentAction.current;
		arrival.reset();
		arrival.setLoop(THREE.LoopOnce, 1);
		arrival.clampWhenFinished = true;
		arrival.setEffectiveTimeScale(1);
		arrival.setEffectiveWeight(1);
		arrival.play();
		if (prev && prev !== arrival) arrival.crossFadeFrom(prev, 0.18, false);
		currentAction.current = arrival;
		reacting.current = arrival;
		entranceClip.current = arrival;
	}, [actions, loopTo]);

	/// L'entrée déplace Milo et change ses clips au fil des étapes
	const entrancePhase = useRef<EntrancePhase | null>(null);
	useFrame(() => {
		const m = mover.current;
		if (m) {
			m.position.copy(entrance.position);
			m.rotation.y = entrance.yaw - MILO_REST_YAW;
			const k = entrance.squash;
			m.scale.set(1 + k * 0.5, 1 - k, 1 + k * 0.5);
		}
		const phase = entrance.phase;
		const previous = entrancePhase.current;
		if (phase !== previous) {
			entrancePhase.current = phase;
			if (phase === "walking") {
				const walk = findAction(actions, "Walk");
				if (walk) {
					reacting.current = null;
					loopTo(walk, 0.25);
				}
			} else if (phase === "leaping" || (phase === "landed" && previous !== null && previous !== "leaping")) {
				/// (intro passée : il est aussitôt à sa place, la pose aussi)
				playEntranceClip();
			}
		}
		/// La cadence des pas suit sa vitesse : il court sans glisser
		if (phase === "walking" && currentAction.current) {
			currentAction.current.setEffectiveTimeScale(Math.max(entrance.speed / NATURAL_WALK_SPEED, 0.3));
		}
	});

	/// À chaque fin de boucle d'attente, Milo passe à une autre (Idle, Idle2…)
	useEffect(
		() => alternateIdlesOnLoop(mixer, actions, () => currentAction.current, loopTo),
		[mixer, actions, loopTo],
	);

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
		<group ref={mover} position={MILO_SPOT_ARRAY}>
			<group position={MILO_UNSPOT_ARRAY}>
				<group
					ref={group}
					onClick={(e) => {
						e.stopPropagation();
						playEasterEgg();
					}}
				>
					<primitive object={scene} scale={MILO_SCALE} position={MILO_SPOT_ARRAY} rotation={MILO_REST_ROTATION} />
				</group>
			</group>
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

/// ── Ambiance jour / nuit ──
/// La salle est bakée : sa lumière est dans les textures. La nuit a son propre
/// bake (mêmes UV, mêmes atlas) ; le shader mélange les deux selon `value`
/// (0 = jour, 1 = nuit). Milo, lui, est éclairé en temps réel : ses lumières
/// suivent le même mélange.
interface NightMix {
	value: number;
	/** Les textures de nuit sont branchées sur les matériaux */
	ready: boolean;
}

/// Clé : nom de l'image de bake dans classroom2.glb
const NIGHT_MAPS = {
	Bake_Salle: "/classroom/Bake_Salle_nuit.webp",
	Bake_Mobilier: "/classroom/Bake_Mobilier_nuit.webp",
	Bake_Objets: "/classroom/Bake_Objets_nuit.webp",
} as const;
type BakeName = keyof typeof NIGHT_MAPS;
const isBakeName = (name: string): name is BakeName => name in NIGHT_MAPS;

/// Vitesse de la transition jour ↔ nuit (amortissement)
const NIGHT_FADE = 1.6;

function NightBake({ modelPath, mix }: { modelPath: string; mix: NightMix }) {
	const { scene } = useGLTF(modelPath);
	const maps = useTexture(NIGHT_MAPS);

	useLayoutEffect(() => {
		const patched: THREE.MeshBasicMaterial[] = [];
		scene.traverse((child) => {
			const mesh = child as THREE.Mesh;
			if (!mesh.isMesh) return;
			const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
			for (const material of materials) {
				if (!(material instanceof THREE.MeshBasicMaterial) || !material.map) continue;
				const name = material.map.name;
				if (!isBakeName(name) || patched.includes(material)) continue;
				const day = material.map;
				/// Le tableau lit le même atlas que les objets mais sur un autre jeu
				/// d'UV : chaque matériau a sa propre copie de la texture de nuit
				const night = maps[name].clone();
				/// Mêmes conventions que la texture du GLB : sinon image retournée,
				/// couleurs délavées ou mauvais jeu d'UV
				night.flipY = day.flipY;
				night.channel = day.channel;
				night.colorSpace = day.colorSpace;
				night.anisotropy = day.anisotropy;
				night.needsUpdate = true;
				material.onBeforeCompile = (shader) => {
					shader.uniforms.nightMap = { value: night };
					shader.uniforms.nightMix = mix;
					shader.fragmentShader = shader.fragmentShader
						.replace(
							"#include <map_pars_fragment>",
							"#include <map_pars_fragment>\nuniform sampler2D nightMap;\nuniform float nightMix;",
						)
						.replace(
							"#include <map_fragment>",
							`#ifdef USE_MAP
	diffuseColor *= mix( texture2D( map, vMapUv ), texture2D( nightMap, vMapUv ), nightMix );
#endif`,
						);
				};
				material.customProgramCacheKey = () => "classroom-night-bake";
				material.needsUpdate = true;
				patched.push(material);
			}
		});
		mix.ready = true;
		return () => {
			mix.ready = false;
			for (const material of patched) {
				material.onBeforeCompile = THREE.Material.prototype.onBeforeCompile;
				material.customProgramCacheKey = THREE.Material.prototype.customProgramCacheKey;
				material.needsUpdate = true;
			}
		};
	}, [scene, maps, mix]);

	return null;
}

/// Textures de nuit absentes ou illisibles : la salle reste en jour, au lieu
/// de faire tomber toute la scène 3D
class NightBakeBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error: unknown) {
		console.warn("[classroom] textures de nuit indisponibles, la salle reste en jour", error);
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

/// Amène le mélange vers la cible, une fois les textures de nuit branchées
const NightMixDriver: React.FC<{ mix: NightMix; target: number }> = ({ mix, target }) => {
	useFrame((_, delta) => {
		/// Sans textures de nuit, le mélange reste où il est (0 de jour, la
		/// valeur de départ si on arrive de nuit et que la scène charge encore)
		if (!mix.ready) return;
		mix.value =
			Math.abs(target - mix.value) < 0.002 ? target : THREE.MathUtils.damp(mix.value, target, NIGHT_FADE, delta);
	});
	return null;
};

/// Lumières de Milo : [jour, nuit], accordées aux bakes de la salle.
/// Jour (midi) : le soleil entre par la fenêtre (à gauche, en hauteur), ciel
/// légèrement bleuté en ambiance. Nuit (soirée) : la lumière vient des
/// plafonniers, chaude mais douce (plus chaude, Milo virait au rouge), un peu
/// de bleu lunaire de côté.
const LIGHT_LOOKS = {
	ambient: { intensity: [0.6, 0.4], color: ["#d6d3cf", "#b3aaa4"] },
	hemi: { intensity: [0.45, 0.26], color: ["#eef4ff", "#ffe8d0"] },
	sun: { intensity: [2.6, 1.15], color: ["#fff4e6", "#ffe9d2"] },
	fill: { intensity: [0.35, 0.22], color: ["#fdfbf9", "#a6b6e6"] },
	environment: [1, 0.38],
} as const;
/// Position de la lumière principale : fenêtre (jour) → plafonniers (nuit)
const SUN_POSITION = [new THREE.Vector3(-6.6, 9.2, 4.1), new THREE.Vector3(1, 12, 3)] as const;

type LightLook = { intensity: readonly [number, number]; color: readonly [string, string] };
const colorPair = (look: LightLook) => [new THREE.Color(look.color[0]), new THREE.Color(look.color[1])] as const;

const ClassroomLighting: React.FC<{ mix: NightMix }> = ({ mix }) => {
	const sunRef = useRef<THREE.DirectionalLight>(null);
	const ambientRef = useRef<THREE.AmbientLight>(null);
	const hemiRef = useRef<THREE.HemisphereLight>(null);
	const fillRef = useRef<THREE.DirectionalLight>(null);
	const colors = useMemo(
		() => ({
			ambient: colorPair(LIGHT_LOOKS.ambient),
			hemi: colorPair(LIGHT_LOOKS.hemi),
			sun: colorPair(LIGHT_LOOKS.sun),
			fill: colorPair(LIGHT_LOOKS.fill),
		}),
		[],
	);
	const lastMix = useRef(-1);

	useFrame(({ scene }) => {
		const t = mix.value;
		if (t === lastMix.current) return;
		lastMix.current = t;
		const lights: [THREE.Light | null, LightLook, readonly [THREE.Color, THREE.Color]][] = [
			[ambientRef.current, LIGHT_LOOKS.ambient, colors.ambient],
			[hemiRef.current, LIGHT_LOOKS.hemi, colors.hemi],
			[sunRef.current, LIGHT_LOOKS.sun, colors.sun],
			[fillRef.current, LIGHT_LOOKS.fill, colors.fill],
		];
		for (const [light, look, [day, night]] of lights) {
			if (!light) continue;
			light.intensity = THREE.MathUtils.lerp(look.intensity[0], look.intensity[1], t);
			light.color.lerpColors(day, night, t);
		}
		sunRef.current?.position.lerpVectors(SUN_POSITION[0], SUN_POSITION[1], t);
		scene.environmentIntensity = THREE.MathUtils.lerp(LIGHT_LOOKS.environment[0], LIGHT_LOOKS.environment[1], t);
	});
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
			{/* Valeurs de départ (jour) : ClassroomLighting les recale à chaque changement d'ambiance */}
			<ambientLight ref={ambientRef} intensity={0.6} color="#d6d3cf" />
			<hemisphereLight ref={hemiRef} args={["#eef4ff", "#d9c7a7", 0.45]} />
			<directionalLight ref={sunRef} position={SUN_POSITION[0]} intensity={2.6} color="#fff4e6" castShadow />
			<directionalLight ref={fillRef} position={[-5, 6, 6]} intensity={0.35} color="#fdfbf9" />
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
	/** L'autre objet du bureau est en main : celui-ci ne réagit plus. Sinon,
	 *  un clic à côté de la feuille tombait sur le post-it resté derrière,
	 *  ce qui reposait la feuille pour ouvrir les notes (et inversement). */
	locked?: boolean;
	children: React.ReactNode;
}> = ({ config, isHeld, onPick, label, bumpKey, locked = false, children }) => {
	const groupRef = useRef<THREE.Group>(null);
	const glowRef = useRef<THREE.Mesh>(null);
	const paperRef = useRef<THREE.Mesh>(null);
	const [isHovered, setIsHovered] = useState(false);
	const noRaycast = useCallback(() => null, []);
	const { camera, size } = useThree();
	const progress = useRef(0);
	const bump = useRef(0);
	/// Survol amorti (0 : posé, 1 : survolé)
	const hover = useRef(0);
	const px = config.size * PX_PER_UNIT;
	const glowTexture = useMemo(() => makeGlowTexture(config.glowColor), [config.glowColor]);
	useEffect(() => () => glowTexture.dispose(), [glowTexture]);

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
		hover.current = THREE.MathUtils.damp(hover.current, isHovered && !isHeld && !locked ? 1 : 0, 10, delta);
		const h = hover.current;

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
		group.position.y += Math.sin(p * Math.PI) * 0.22 + hop * 0.08 + h * 0.035;
		group.quaternion.slerpQuaternions(pose.deskQuat, pose.heldQuat, t);
		group.scale.setScalar(THREE.MathUtils.lerp(config.desk.scale, config.hold.scale, t) * (1 + hop * 0.12 + h * 0.04));

		// Soulevé, il passe devant le décor (sinon il traverse les bureaux)
		const lifted = p > 0.02;
		for (const mesh of [paperRef.current, glowRef.current]) {
			if (!mesh) continue;
			(mesh.material as THREE.Material).depthTest = !lifted;
			mesh.renderOrder = lifted ? 10 : 0;
		}

		// Posé, un halo respire doucement pour inviter à cliquer ; au survol, il
		// s'allume, s'élargit et pulse
		const glow = glowRef.current;
		if (glow) {
			const material = glow.material as THREE.MeshBasicMaterial;
			const clock = state.clock.elapsedTime;
			const idle = GLOW_IDLE.base + GLOW_IDLE.swing * Math.sin(clock * 2.2);
			const goal = isHeld || locked ? 0 : isHovered ? 1 : Math.max(idle, bump.current);
			material.opacity = THREE.MathUtils.damp(material.opacity, goal, 8, delta);
			glow.scale.setScalar(1 + h * (0.08 + 0.035 * Math.sin(clock * 5)));
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
				<planeGeometry args={[config.size * GLOW_SPREAD, config.size * GLOW_SPREAD]} />
				<meshBasicMaterial
					map={glowTexture}
					transparent
					opacity={0}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					toneMapped={false}
					side={THREE.DoubleSide}
				/>
			</mesh>
			<mesh
				ref={paperRef}
				name={label}
				onPointerOver={(e) => {
					if (isHeld || locked) return;
					e.stopPropagation();
					setIsHovered(true);
					document.body.style.cursor = "pointer";
				}}
				onPointerOut={() => {
					setIsHovered(false);
					document.body.style.cursor = "auto";
				}}
				onClick={(e) => {
					if (isHeld || locked) return;
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
/** Cadrage face au tableau, reculé si l'écran est étroit pour qu'il tienne en largeur */
function boardFraming(width: number, height: number, position: THREE.Vector3, look: THREE.Vector3, drop = 0) {
	const aspect = width / Math.max(height, 1);
	const halfTan = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
	// Le bord gauche de la zone d'écriture (x ≈ -3.6) doit rester dans le champ
	const fitZ = BOARD_CENTER[2] + 3.9 / (halfTan * aspect);
	// Au-delà, la caméra sortirait de la salle : on se décale plutôt vers le tableau
	const boardZ = Math.min(Math.max(BASE_CAMERA_Z, fitZ), MAX_CAMERA_Z);
	const halfWidth = halfTan * (boardZ - BOARD_CENTER[2]) * aspect;
	const boardX = Math.min(0, Math.max(BOARD_CENTER[0], BOARD_LEFT_EDGE + halfWidth));
	position.set(boardX, -drop, boardZ);
	look.set(boardX, -drop, 0);
}

/// (la caméra repart du point que visait l'entrée en classe)
const CameraRig: React.FC<{ isEditing: boolean; from: THREE.Vector3 }> = ({ isEditing, from }) => {
	const { camera, size } = useThree();
	const lookAt = useRef(from.clone());
	const goalPos = useMemo(() => new THREE.Vector3(), []);
	const goalLook = useMemo(() => new THREE.Vector3(), []);

	useFrame((_, delta) => {
		boardFraming(size.width, size.height, goalPos, goalLook, isEditing ? EDIT_CAMERA_DROP : 0);
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
	/** L'entrée de Milo démarre quand l'écran de chargement s'efface */
	introRunning: boolean;
	introDone: boolean;
	onIntroDone: () => void;
	/** Milo est arrivé à sa place : le tableau et l'interface apparaissent */
	onLanded: () => void;
	/** Change quand l'élève passe l'intro */
	skipSignal: number;
	/** Mouvements réduits : Milo est déjà à sa place, la caméra au bureau */
	reducedMotion: boolean;
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
	/** Ambiance visée : 0 = jour, 1 = nuit (cf. useDayNight) */
	nightTarget: number;
}

const ClassroomScene3D: React.FC<ClassroomScene3DProps> = ({
	activeAnimation,
	introRunning,
	introDone,
	onIntroDone,
	onLanded,
	skipSignal,
	reducedMotion,
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
	nightTarget,
}) => {
	/// Les textures de nuit sont chargées avec la salle, de jour comme de nuit :
	/// leur envoi au GPU (4096², mipmaps) et la compilation du shader se font
	/// derrière l'écran de chargement. Chargées à la volée, elles figeaient le
	/// site ~2 s au premier passage en nuit.
	const [mix] = useState<NightMix>(() => ({ value: nightTarget, ready: false }));
	/// Entrée de Milo par la porte (lue par Milo, la porte et la caméra)
	const [entrance] = useState<Entrance>(() => createEntrance(reducedMotion));

	return (
		<Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 2, 12], fov: CAMERA_FOV }} className="cls-canvas">
			<NightMixDriver mix={mix} target={nightTarget} />
			<Suspense fallback={null}>
				{/* En premier : chaque image, l'entrée avance avant que Milo et la porte ne la lisent */}
				{!introDone && (
					<EntranceDirector
						entrance={entrance}
						running={introRunning}
						skipSignal={skipSignal}
						framing={boardFraming}
						onLanded={onLanded}
						onDone={onIntroDone}
					/>
				)}
				<ClassroomLighting mix={mix} />
				<Environment preset="park" />
				<Classroom modelPath={CLASSROOM_MODEL} />
				<NightBakeBoundary>
					<NightBake modelPath={CLASSROOM_MODEL} mix={mix} />
				</NightBakeBoundary>
				<ClassroomDoorway entrance={entrance} mix={mix} />
				<MiloModel modelPath={MILO_MODEL_PATH} activeAnimation={activeAnimation} entrance={entrance} />
				<LandingDust entrance={entrance} line={BOARD_DUST} />
				<Board visible={boardVisible}>{board}</Board>
				<DeskItem config={SHEET} isHeld={isEditing} locked={isNotesOpen} onPick={onSheetClick} label="feuille">
					{sheet}
				</DeskItem>
				<DeskItem
					config={POSTIT}
					isHeld={isNotesOpen}
					locked={isEditing}
					onPick={onNotesClick}
					label="post-it"
					bumpKey={notesBump}
				>
					{notes}
				</DeskItem>
				{introDone && <CameraRig isEditing={isEditing || isNotesOpen} from={entrance.look} />}
				<SceneReadySignal onReady={onReady} />
			</Suspense>
		</Canvas>
	);
};

export default ClassroomScene3D;
