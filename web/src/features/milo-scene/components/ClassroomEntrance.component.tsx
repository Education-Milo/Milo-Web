import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
	glowTexture,
	grassTexture,
	lightSpillTexture,
	skyTexture,
} from "@features/home/components/miloSchool/miloSchool.textures";
import { CLASSROOM_MODEL } from "@features/milo-scene/utils/classroomAssets";
import {
	ENTRANCE_END,
	LAND_AT,
	TAKEOFF_AT,
	sampleEntrance,
	skipEntrance,
	type Entrance,
} from "@features/milo-scene/utils/classroomEntrance";

/// Mise en scène de l'entrée en classe (voir utils/classroomEntrance) : la
/// caméra qui suit Milo, et la porte du fond qui s'ouvre sur le jardin.

/* ============================================================== CAMÉRA */

/// Positions de la caméra au fil de l'entrée : au fond de la classe, face à la
/// porte ; puis elle avance au-dessus des tables en suivant Milo, jusqu'au
/// bureau de l'élève (dernière position, calculée selon l'écran)
const CAMERA_KEYS: { t: number; position: THREE.Vector3 }[] = [
	{ t: 0, position: new THREE.Vector3(-3.4, 0.8, 12.7) },
	{ t: 1.1, position: new THREE.Vector3(-3.0, 1.5, 11.9) },
	{ t: 2.1, position: new THREE.Vector3(-1.9, 1.7, 9.6) },
	/// (assez haut pour voir Milo par-dessus les tables du premier rang quand il s'élance)
	{ t: TAKEOFF_AT, position: new THREE.Vector3(-0.9, 1.45, 7.3) },
];
/// (un peu après l'atterrissage : on voit Milo en entier quand il touche le sol)
const CAMERA_ARRIVES = LAND_AT + 0.4;
/// Ce que regarde la caméra : la porte, puis Milo (un peu devant lui), puis le tableau
const DOOR_TARGET = new THREE.Vector3(6.95, -0.9, 10.6);
const MILO_LOOK_HEIGHT = 1.45;
const MILO_LOOK_LEAD = 0.5;
/// La caméra suit sa trajectoire avec un peu d'inertie (plus fluide aux virages)
const CAMERA_DAMPING = 9;
/// Secousse quand Milo atterrit
const SHAKE = { amplitude: 0.07, duration: 0.45 };

const smoothstep = (a: number, b: number, x: number) => {
	const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};

export interface EntranceDirectorProps {
	entrance: Entrance;
	/** L'entrée démarre quand l'écran de chargement s'efface */
	running: boolean;
	/** Change quand l'élève passe l'intro */
	skipSignal: number;
	/** Cadrage final, face au tableau (le même que la caméra de la classe) */
	framing: (width: number, height: number, position: THREE.Vector3, look: THREE.Vector3) => void;
	/** Milo est à sa place : le tableau et l'interface apparaissent */
	onLanded: () => void;
	/** La caméra est au bureau : la caméra de la classe prend le relais */
	onDone: () => void;
}

/** Fait avancer l'entrée et place la caméra */
export const EntranceDirector: React.FC<EntranceDirectorProps> = ({
	entrance,
	running,
	skipSignal,
	framing,
	onLanded,
	onDone,
}) => {
	const { camera, size } = useThree();
	const state = useMemo(
		() => ({
			curve: new THREE.CatmullRomCurve3(
				[...CAMERA_KEYS.map((key) => key.position.clone()), new THREE.Vector3()],
				false,
				"centripetal",
			),
			endPosition: new THREE.Vector3(),
			endLook: new THREE.Vector3(),
			goal: new THREE.Vector3(),
			goalLook: new THREE.Vector3(),
			miloLook: new THREE.Vector3(),
			position: new THREE.Vector3(),
			placed: false,
			skipSeen: skipSignal,
			landed: false,
			done: false,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- état créé une fois
		[],
	);

	useFrame((_, delta) => {
		const s = state;
		const e = entrance;
		if (skipSignal !== s.skipSeen) {
			s.skipSeen = skipSignal;
			skipEntrance(e);
		}
		const dt = Math.min(Math.max(delta, 0), 0.1);
		if (running && e.t < ENTRANCE_END) e.t = Math.min(e.t + dt, ENTRANCE_END);
		sampleEntrance(e);

		/// Cadrage final, et trajectoire qui y mène (sans jamais passer devant :
		/// sur un écran étroit, le bureau est reculé)
		framing(size.width, size.height, s.endPosition, s.endLook);
		const points = s.curve.points;
		CAMERA_KEYS.forEach((key, i) => {
			points[i].copy(key.position);
			if (i > 0) points[i].z = Math.max(points[i].z, s.endPosition.z);
		});
		points[points.length - 1].copy(s.endPosition);

		/// Avancement sur la trajectoire : chaque position est atteinte à son heure
		const times = [...CAMERA_KEYS.map((key) => key.t), CAMERA_ARRIVES];
		let segment = times.length - 2;
		while (segment > 0 && e.t < times[segment]) segment--;
		const local = THREE.MathUtils.clamp((e.t - times[segment]) / (times[segment + 1] - times[segment]), 0, 1);
		s.curve.getPoint((segment + local) / (times.length - 1), s.goal);

		/// La porte, puis Milo, puis le tableau
		s.miloLook.set(Math.sin(e.yaw), 0, Math.cos(e.yaw)).multiplyScalar(MILO_LOOK_LEAD).add(e.position);
		s.miloLook.y += MILO_LOOK_HEIGHT;
		s.goalLook.lerpVectors(DOOR_TARGET, s.miloLook, smoothstep(0.7, 1.4, e.t));
		s.goalLook.lerp(s.endLook, smoothstep(TAKEOFF_AT - 0.2, CAMERA_ARRIVES, e.t));

		/// Première image, mouvements réduits, intro passée : la caméra s'y place
		/// (passée, elle file au bureau à grande vitesse)
		const blend = !s.placed || e.instant ? 1 : 1 - Math.exp(-(e.skipped ? 14 : CAMERA_DAMPING) * dt);
		s.placed = true;
		s.position.lerp(s.goal, blend);
		e.look.lerp(s.goalLook, blend);

		camera.position.copy(s.position);
		/// Milo atterrit : la classe tremble un instant
		const since = e.t - LAND_AT;
		if (!e.instant && !e.skipped && since > 0 && since < SHAKE.duration) {
			const fade = (1 - since / SHAKE.duration) ** 2;
			camera.position.x += Math.sin(since * 47) * SHAKE.amplitude * fade;
			camera.position.y += Math.sin(since * 61 + 1) * SHAKE.amplitude * 0.7 * fade;
		}
		camera.lookAt(e.look);

		if (!s.landed && e.t >= LAND_AT) {
			s.landed = true;
			onLanded();
		}
		if (!s.done && e.t >= ENTRANCE_END) {
			s.done = true;
			onDone();
		}
	});
	return null;
};

/* ============================================================== POUSSIÈRE DE CRAIE */

/// Quand Milo atterrit, la classe tremble : la poussière de craie accrochée
/// en haut du tableau s'en détache et retombe en pluie fine devant l'ardoise.
/// Chaque grain suit une trajectoire calculée à partir du temps écoulé : rien
/// à simuler, rien à mémoriser.
const DUST = { count: 90, duration: 1.6, gravity: 1.9, size: 0.13 };

/** Haut du tableau (monde) : d'où tombe la poussière */
export interface DustLine {
	left: number;
	right: number;
	y: number;
	z: number;
}

export const LandingDust: React.FC<{ entrance: Entrance; line: DustLine }> = ({ entrance, line }) => {
	const [glow] = useState(() => glowTexture());
	useEffect(() => () => glow.dispose(), [glow]);
	const grains = useMemo(() => {
		/// Pseudo-hasard reproductible : la même pluie à chaque entrée
		let seed = 7;
		const rand = () => {
			seed = (seed * 16807) % 2147483647;
			return (seed - 1) / 2147483646;
		};
		return Array.from({ length: DUST.count }, () => ({
			x: line.left + rand() * (line.right - line.left),
			y: line.y + rand() * 0.12,
			/// Un petit sursaut vers le haut, une dérive, et des grains qui se
			/// détachent un peu après les autres
			vx: (rand() - 0.5) * 0.35,
			vy: 0.15 + rand() * 0.55,
			delay: rand() * 0.35,
			sway: rand() * Math.PI * 2,
		}));
	}, [line]);
	const geometry = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST.count * 3), 3));
		return g;
	}, []);
	useEffect(() => () => geometry.dispose(), [geometry]);
	const points = useRef<THREE.Points>(null);
	const material = useRef<THREE.PointsMaterial>(null);
	/// Sa propre horloge, lancée à l'atterrissage : l'entrée s'arrête avant
	/// que la poussière ne soit retombée
	const clock = useRef<number | null>(null);

	useFrame((_, delta) => {
		if (clock.current === null && entrance.t >= LAND_AT && !entrance.instant && !entrance.skipped) {
			clock.current = entrance.t - LAND_AT;
		} else if (clock.current !== null) {
			clock.current += Math.min(Math.max(delta, 0), 0.1);
		}
		const since = clock.current ?? -1;
		const active = since >= 0 && since < DUST.duration;
		if (points.current) points.current.visible = active;
		if (!active) return;
		const position = geometry.attributes.position as THREE.BufferAttribute;
		grains.forEach((grain, i) => {
			/// (un grain pas encore détaché attend derrière l'ardoise, invisible)
			const s = Math.max(0, since - grain.delay);
			position.setXYZ(
				i,
				grain.x + grain.vx * s + Math.sin(s * 5 + grain.sway) * 0.04,
				grain.y + grain.vy * s - (DUST.gravity * s * s) / 2,
				s > 0 ? line.z : line.z - 1,
			);
		});
		position.needsUpdate = true;
		if (material.current) material.current.opacity = 0.85 * (1 - since / DUST.duration) ** 1.2;
	});

	return (
		<points ref={points} geometry={geometry} visible={false} frustumCulled={false}>
			<pointsMaterial
				ref={material}
				map={glow}
				color="#FFFDF2"
				size={DUST.size}
				sizeAttenuation
				transparent
				depthWrite={false}
				toneMapped={false}
			/>
		</points>
	);
};

/* ============================================================== PORTE ET JARDIN */

/// Nom du pivot ajouté à la salle (la scène du .glb est en cache : on le
/// retrouve d'une visite à l'autre)
const HINGE_NAME = "__entranceDoorHinge";
/// Battant et poignée de la porte dans classroom2.glb
const DOOR_LEAF = "Plane";
const DOOR_HANDLE = "Plane001";
/// Elle s'ouvre vers le jardin (vers l'extérieur : elle ne gêne pas Milo)
const DOOR_OPEN_ANGLE = 1.75;
/// Le jardin derrière la porte (monde) : herbe, ciel, lisière d'arbres
const GARDEN = { wallX: 7.08, farX: 17, centerZ: 10.6, floorY: -2.5 };
const TREES_TEXTURE = "/classroom/exterieur/arbres.webp";
/// Part haute de l'image gardée (le bas est un fondu transparent)
const TREES_CROP = 0.7;

/** La porte du fond, qui s'ouvre sur le jardin ensoleillé (ou nocturne) */
export const ClassroomDoorway: React.FC<{ entrance: Entrance; mix: { value: number } }> = ({ entrance, mix }) => {
	const { scene } = useGLTF(CLASSROOM_MODEL);
	const treesImage = useLoader(THREE.TextureLoader, TREES_TEXTURE);
	const [textures] = useState(() => {
		const grass = grassTexture();
		grass.repeat.set(3, 3);
		return { grass, day: skyTexture("day"), night: skyTexture("night"), spill: lightSpillTexture() };
	});
	/// La lisière d'arbres de l'accueil, sans le fondu du bas de l'image (vu
	/// par la porte, le ciel transparaissait sous les arbres, à l'horizon). Une
	/// copie : la texture d'origine est partagée avec l'accueil.
	const trees = useMemo(() => {
		const texture = treesImage.clone();
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		texture.repeat.set(1.6, TREES_CROP);
		texture.offset.set(0, 1 - TREES_CROP);
		texture.needsUpdate = true;
		return texture;
	}, [treesImage]);
	useEffect(
		() => () => {
			Object.values(textures).forEach((texture) => texture.dispose());
			trees.dispose();
		},
		[textures, trees],
	);

	const hinge = useRef<THREE.Object3D | null>(null);
	const nightSky = useRef<THREE.MeshBasicMaterial>(null);
	const grass = useRef<THREE.MeshBasicMaterial>(null);
	const treeLine = useRef<THREE.MeshBasicMaterial>(null);
	const spill = useRef<THREE.MeshBasicMaterial>(null);
	const light = useRef<THREE.PointLight>(null);
	const night = useMemo(() => ({ ground: new THREE.Color("#2E3A66"), white: new THREE.Color("#FFFFFF") }), []);

	/// Le battant et sa poignée pivotent autour de leurs gonds (côté tableau,
	/// à l'opposé de la poignée)
	useLayoutEffect(() => {
		let pivot = scene.getObjectByName(HINGE_NAME) ?? null;
		if (!pivot) {
			const leaf = scene.getObjectByName(DOOR_LEAF);
			const handle = scene.getObjectByName(DOOR_HANDLE);
			if (!leaf) return;
			scene.updateMatrixWorld(true);
			const box = new THREE.Box3().setFromObject(leaf);
			const center = box.getCenter(new THREE.Vector3());
			const handleZ = handle ? new THREE.Box3().setFromObject(handle).getCenter(new THREE.Vector3()).z : box.max.z;
			const hingePoint = new THREE.Vector3(center.x, box.min.y, handleZ > center.z ? box.min.z : box.max.z);
			pivot = new THREE.Group();
			pivot.name = HINGE_NAME;
			/// Sens d'ouverture vers le jardin (+x), selon le côté des gonds
			pivot.userData.openSign = hingePoint.z === box.min.z ? 1 : -1;
			pivot.position.copy(scene.worldToLocal(hingePoint));
			scene.add(pivot);
			scene.updateMatrixWorld(true);
			pivot.attach(leaf);
			if (handle) pivot.attach(handle);
		}
		hinge.current = pivot;
	}, [scene]);

	useFrame(() => {
		const open = THREE.MathUtils.clamp(entrance.door, -0.2, 1.2);
		if (hinge.current) hinge.current.rotation.y = DOOR_OPEN_ANGLE * open * (hinge.current.userData.openSign ?? 1);
		const n = mix.value;
		if (nightSky.current) nightSky.current.opacity = n;
		if (grass.current) grass.current.color.lerpColors(night.white, night.ground, n * 0.9);
		if (treeLine.current) treeLine.current.color.lerpColors(night.white, night.ground, n * 0.85);
		/// La lumière du jardin entre par la porte ouverte (pâle et bleutée la nuit)
		const visible = THREE.MathUtils.clamp(open, 0, 1);
		if (spill.current) spill.current.opacity = visible * THREE.MathUtils.lerp(0.55, 0.18, n);
		if (light.current) light.current.intensity = visible * THREE.MathUtils.lerp(9, 2.5, n);
	});

	const depth = GARDEN.farX - GARDEN.wallX;
	return (
		<group>
			{/* Le jardin : herbe, ciel (jour / nuit) et la lisière d'arbres de l'accueil */}
			<mesh rotation-x={-Math.PI / 2} position={[GARDEN.wallX + depth / 2, GARDEN.floorY - 0.01, GARDEN.centerZ]}>
				<planeGeometry args={[depth, 16]} />
				<meshBasicMaterial ref={grass} map={textures.grass} toneMapped={false} />
			</mesh>
			<group position={[GARDEN.farX, 3, GARDEN.centerZ]} rotation-y={-Math.PI / 2}>
				<mesh>
					<planeGeometry args={[30, 14]} />
					<meshBasicMaterial map={textures.day} toneMapped={false} />
				</mesh>
				{/* Ciel de nuit, puis arbres, peints dans cet ordre par-dessus le ciel de
				    jour, sans écrire de profondeur : sinon le haut transparent de
				    l'image des arbres masquait le ciel de nuit */}
				<mesh position={[0, 0, 0.15]} renderOrder={1}>
					<planeGeometry args={[30, 14]} />
					<meshBasicMaterial
						ref={nightSky}
						map={textures.night}
						transparent
						opacity={0}
						depthWrite={false}
						toneMapped={false}
					/>
				</mesh>
				{/* (son pied posé sur l'herbe, à l'horizon) */}
				<mesh position={[0, GARDEN.floorY - 3 + (5 * TREES_CROP) / 2, 0.3]} renderOrder={2}>
					<planeGeometry args={[30, 5 * TREES_CROP]} />
					<meshBasicMaterial ref={treeLine} map={trees} transparent depthWrite={false} toneMapped={false} />
				</mesh>
			</group>
			{/* Flaque de lumière sur le parquet, devant la porte ouverte */}
			<group position={[GARDEN.wallX - 1.75, GARDEN.floorY + 0.012, GARDEN.centerZ]} rotation-y={-Math.PI / 2}>
				<mesh rotation-x={-Math.PI / 2}>
					<planeGeometry args={[3.2, 3.5]} />
					<meshBasicMaterial
						ref={spill}
						map={textures.spill}
						color="#FFF4DC"
						transparent
						opacity={0}
						depthWrite={false}
						blending={THREE.AdditiveBlending}
						toneMapped={false}
					/>
				</mesh>
			</group>
			{/* … et sur Milo, quand il passe la porte */}
			<pointLight
				ref={light}
				position={[GARDEN.wallX - 0.6, 0, GARDEN.centerZ]}
				color="#FFE8C0"
				intensity={0}
				distance={7}
				decay={1.6}
			/>
		</group>
	);
};
