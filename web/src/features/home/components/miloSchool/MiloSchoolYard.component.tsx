import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
	frameStep,
	partHandlers,
	type MiloSchoolBridge,
	type MissionsSummary,
} from "@features/home/components/miloSchool/miloSchool.bridge";
import { useHoverOutline } from "@features/home/components/miloSchool/miloSchool.outline";
import {
	cloudsTexture,
	countBadgeTexture,
	glowTexture,
	grassTexture,
	letterTexture,
	lightSpillTexture,
	mailboxSideTexture,
	missionsBoardTexture,
	moonTexture,
	plasterTexture,
	riverFlowTexture,
	roofTexture,
	signTexture,
	skyTexture,
	starsTexture,
	stoneTexture,
	wingTexture,
} from "@features/home/components/miloSchool/miloSchool.textures";

/// Devant la salle de classe : la façade de l'école, sa porte (celle de la
/// vraie salle de classe), l'herbe, le chemin de pierres, les buissons, le
/// ciel du jour ou de la nuit. Tout est construit en code : quelques Ko, et la
/// porte s'anime sans fichier 3D supplémentaire.

/* ============================================================== PLAN */

/// Unités monde : Milo mesure 1,7 ; le sol est à y = 0, la façade à z = 0.
export const SCHOOL = {
	left: -3,
	right: 4.5,
	wallHeight: 3.05,
	wallDepth: 0.22,
	door: { x: 0.75, width: 1.1, height: 2.3 },
	windows: [
		{ x: -1.65, view: { offset: [0.1, 0.3], repeat: [0.42, 0.34] } },
		{ x: 3.1, view: { offset: [0.46, 0.33], repeat: [0.42, 0.34] } },
	],
	window: { width: 1.2, height: 1.2, sill: 0.95 },
	sign: { y: 2.73, width: 1.9, height: 0.44 },
	roof: { eaveY: 3.17, eaveZ: 0.5, ridgeY: 4.3, ridgeZ: -1.9, overhang: 0.35 },
	/// Pancarte des missions et boîte aux lettres, sur la pelouse à droite
	board: { x: 2.55, z: 2.15, yaw: -0.18 },
	mailbox: { x: 4.1, z: 1.5, yaw: 0.75 },
	/// Réverbère de jardin entre les deux : la nuit, il les éclaire
	gardenLamp: { x: 3.42, z: 2.05 },
} as const;

const DOOR_OPEN_ANGLE = 1.6;

const ASSETS = {
	door: "/classroom/exterieur/porte.webp",
	insideDay: "/classroom/exterieur/interieur_jour.webp",
	insideNight: "/classroom/exterieur/interieur_nuit.webp",
	trees: "/classroom/exterieur/arbres.webp",
} as const;

/// Téléchargées dès le chargement de l'appli : l'accueil s'affiche sans attente
useLoader.preload(THREE.TextureLoader, Object.values(ASSETS));

const C = {
	trim: "#FFF7EC",
	wood: "#8B4A1E",
	woodDark: "#5E2E12",
	shutter: "#3A5A2C",
	shutterDark: "#2B4520",
	pot: "#C8582A",
	metal: "#2A1810",
	stone: "#D9CBB4",
	gable: "#F7DDBF",
	trunk: "#7A4A2A",
};

const FLOWER_COLORS = ["#FF5A5A", "#FFD34D", "#FF8FC2", "#FFFFFF", "#FF8A4C", "#B98CFF"];
const LEAF_COLORS = ["#4E8F3A", "#5FA046", "#3F7A30", "#6DB24F"];

/** Textures créées une fois par instance de la scène, libérées au démontage */
function useOwnedTextures<T extends Record<string, THREE.Texture>>(create: () => T): T {
	const [textures] = useState(create);
	useEffect(() => () => Object.values(textures).forEach((texture) => texture.dispose()), [textures]);
	return textures;
}

function skyWeights(night: number) {
	const day = THREE.MathUtils.clamp(1 - night * 2, 0, 1);
	const deep = THREE.MathUtils.clamp(night * 2 - 1, 0, 1);
	return { day, dusk: 1 - day - deep, night: deep };
}

/* ============================================================== CIEL */

const Sky: React.FC<{ night: number; animate: boolean }> = ({ night, animate }) => {
	const t = useOwnedTextures(() => ({
		day: skyTexture("day"),
		dusk: skyTexture("dusk"),
		night: skyTexture("night"),
		stars: starsTexture(),
		clouds: cloudsTexture(),
		glow: glowTexture(),
		moon: moonTexture(),
	}));
	const starsMat = useRef<THREE.MeshBasicMaterial>(null);
	const weights = skyWeights(night);

	useFrame(({ clock }, delta) => {
		if (!animate) return;
		t.clouds.offset.x = (t.clouds.offset.x + frameStep(delta) * 0.0035) % 1;
		if (starsMat.current) {
			starsMat.current.opacity = weights.night * (0.8 + 0.2 * Math.sin(clock.elapsedTime * 1.7));
		}
	});

	return (
		<group>
			{(["day", "dusk", "night"] as const).map((kind, i) => (
				<mesh key={kind} position={[0.75, 8, -12 + i * 0.01]} renderOrder={-10 + i}>
					<planeGeometry args={[64, 32]} />
					<meshBasicMaterial
						map={t[kind]}
						transparent={i > 0}
						opacity={i === 0 ? 1 : weights[kind] + (kind === "night" ? 0 : weights.night)}
						depthWrite={false}
						toneMapped={false}
						fog={false}
					/>
				</mesh>
			))}
			<mesh position={[0.75, 9, -11.9]} renderOrder={-6}>
				<planeGeometry args={[64, 16]} />
				<meshBasicMaterial
					ref={starsMat}
					map={t.stars}
					transparent
					opacity={weights.night}
					depthWrite={false}
					toneMapped={false}
				/>
			</mesh>
			{/* Soleil le jour, croissant de lune la nuit, au-dessus du toit, à gauche */}
			<sprite position={[3.6, 7.4, -11.5]} scale={[3.2, 3.2, 1]} renderOrder={-5}>
				<spriteMaterial
					map={t.glow}
					color={night > 0.5 ? "#C9D4FF" : "#FFF0B0"}
					transparent
					opacity={0.85 - Math.abs(night - 0.5) * 0.4}
					depthWrite={false}
					toneMapped={false}
				/>
			</sprite>
			<mesh position={[3.6, 7.4, -11.4]} renderOrder={-4}>
				<circleGeometry args={[0.55, 32]} />
				<meshBasicMaterial color="#FFE27A" transparent opacity={1 - weights.night} depthWrite={false} toneMapped={false} />
			</mesh>
			<sprite position={[3.6, 7.4, -11.35]} scale={[1.5, 1.5, 1]} renderOrder={-3}>
				<spriteMaterial map={t.moon} transparent opacity={weights.night} depthWrite={false} toneMapped={false} />
			</sprite>
			<mesh position={[0.75, 7.6, -11.2]} renderOrder={-2}>
				<planeGeometry args={[64, 10]} />
				<meshBasicMaterial
					map={t.clouds}
					transparent
					opacity={0.95 - weights.night * 0.75}
					color={night > 0.5 ? "#8E96C8" : "#FFFFFF"}
					depthWrite={false}
					toneMapped={false}
				/>
			</mesh>
		</group>
	);
};

/* ============================================================== JARDIN */

/** La lisière d'arbres vue depuis les fenêtres de la classe, au loin */
const TreeLine: React.FC<{ night: number }> = ({ night }) => {
	const texture = useLoader(THREE.TextureLoader, ASSETS.trees);
	useMemo(() => {
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		texture.repeat.x = 1.6;
	}, [texture]);
	const tint = useMemo(() => new THREE.Color("#FFFFFF").lerp(new THREE.Color("#3C4A7A"), night * 0.8), [night]);
	return (
		<mesh position={[0.75, 2.3, -9]} renderOrder={-1}>
			<planeGeometry args={[48, 5.6]} />
			<meshBasicMaterial map={texture} color={tint} transparent depthWrite={false} toneMapped={false} />
		</mesh>
	);
};

const Lawn: React.FC = () => {
	const t = useOwnedTextures(() => ({ grass: grassTexture() }));
	return (
		<mesh rotation-x={-Math.PI / 2} position={[0.75, 0, 3]} receiveShadow>
			<planeGeometry args={[64, 26]} />
			<meshStandardMaterial map={t.grass} roughness={1} />
		</mesh>
	);
};

/** Chemin de pierres plates jusqu'à la marche de la porte */
const Path: React.FC = () => {
	const stones = useMemo(
		() =>
			[
				[0.05, 3.9, 0.36, 0.3],
				[0.25, 3.05, 0.34, -0.4],
				[0.48, 2.25, 0.32, 0.2],
				[0.68, 1.5, 0.3, -0.2],
				[0.82, 0.88, 0.28, 0.5],
			] as const,
		[],
	);
	return (
		<group>
			{stones.map(([x, z, r, rot], i) => (
				<mesh key={i} position={[x, 0.025, z]} rotation-y={rot} scale={[1, 1, 0.72]} receiveShadow>
					<cylinderGeometry args={[r, r * 1.04, 0.05, 20]} />
					<meshStandardMaterial color={i % 2 ? "#E3D6C1" : C.stone} roughness={0.95} />
				</mesh>
			))}
		</group>
	);
};

interface Blob {
	position: [number, number, number];
	scale: number;
	color: string;
}

/** Boules instanciées (buissons, fleurs, feuillage) : un seul appel de dessin */
const Blobs: React.FC<{ blobs: Blob[]; detail?: number; castShadow?: boolean; roughness?: number }> = ({
	blobs,
	detail = 2,
	castShadow = false,
	roughness = 0.85,
}) => {
	const mesh = useRef<THREE.InstancedMesh>(null);
	useEffect(() => {
		const m = mesh.current;
		if (!m) return;
		const matrix = new THREE.Matrix4();
		const color = new THREE.Color();
		blobs.forEach((blob, i) => {
			matrix.makeScale(blob.scale, blob.scale * 0.92, blob.scale);
			matrix.setPosition(...blob.position);
			m.setMatrixAt(i, matrix);
			m.setColorAt(i, color.set(blob.color));
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
		m.computeBoundingSphere();
	}, [blobs]);
	return (
		<instancedMesh ref={mesh} args={[undefined, undefined, blobs.length]} castShadow={castShadow} receiveShadow>
			<icosahedronGeometry args={[1, detail]} />
			<meshStandardMaterial roughness={roughness} />
		</instancedMesh>
	);
};

function rand(seed: number) {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

/** Un buisson : 5 à 7 boules de vert ; des fleurs piquées dessus */
function bush(cx: number, cz: number, size: number, seed: number, flowers = 6): { leaves: Blob[]; petals: Blob[] } {
	const r = rand(seed);
	const leaves: Blob[] = [];
	const petals: Blob[] = [];
	const count = 5 + Math.round(r() * 2);
	for (let i = 0; i < count; i++) {
		const a = (i / count) * Math.PI * 2 + r();
		const d = i === 0 ? 0 : size * (0.45 + r() * 0.35);
		const s = size * (i === 0 ? 0.62 : 0.4 + r() * 0.2);
		leaves.push({
			position: [cx + Math.cos(a) * d, s * 0.8 + (i === 0 ? size * 0.1 : 0), cz + Math.sin(a) * d * 0.6],
			scale: s,
			color: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
		});
	}
	for (let i = 0; i < flowers; i++) {
		const a = r() * Math.PI * 2;
		const d = size * (0.2 + r() * 0.6);
		petals.push({
			position: [cx + Math.cos(a) * d, size * (0.55 + r() * 0.55), cz + Math.sin(a) * d * 0.5 + size * 0.35],
			scale: 0.05 + r() * 0.025,
			color: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)],
		});
	}
	return { leaves, petals };
}

const Garden: React.FC = () => {
	const { leaves, petals } = useMemo(() => {
		const parts = [
			bush(-2.3, 0.34, 0.48, 3, 5),
			bush(1.78, 0.34, 0.4, 7, 4),
			bush(4.2, 0.4, 0.6, 11, 5),
			bush(5.6, 0.9, 0.75, 23, 7),
		];
		return {
			leaves: parts.flatMap((p) => p.leaves),
			petals: parts.flatMap((p) => p.petals),
		};
	}, []);
	return (
		<group>
			<Blobs blobs={leaves} castShadow roughness={0.9} />
			<Blobs blobs={petals} detail={1} roughness={0.6} />
		</group>
	);
};

/** Arbres de chaque côté de l'école ; le feuillage se balance doucement */
const Trees: React.FC<{ animate: boolean }> = ({ animate }) => {
	const crowns = useRef<THREE.Group[]>([]);
	const trees = useMemo(
		() =>
			[
				{ x: -5.4, z: -1.4, h: 2.1, size: 1.25, seed: 5 },
				{ x: 6.7, z: -1.8, h: 2.3, size: 1.35, seed: 9 },
			].map((tree) => {
				const r = rand(tree.seed);
				const blobs: Blob[] = Array.from({ length: 9 }, (_, i) => {
					const a = (i / 9) * Math.PI * 2;
					const d = i === 0 ? 0 : tree.size * (0.45 + r() * 0.3);
					return {
						position: [Math.cos(a) * d, (r() - 0.3) * tree.size * 0.6, Math.sin(a) * d * 0.7] as [number, number, number],
						scale: tree.size * (i === 0 ? 0.85 : 0.5 + r() * 0.2),
						color: LEAF_COLORS[i % LEAF_COLORS.length],
					};
				});
				return { ...tree, blobs };
			}),
		[],
	);
	useFrame(({ clock }) => {
		if (!animate) return;
		crowns.current.forEach((crown, i) => {
			if (crown) crown.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i * 2) * 0.025;
		});
	});
	return (
		<group>
			{trees.map((tree, i) => (
				<group key={i} position={[tree.x, 0, tree.z]}>
					<mesh position={[0, tree.h / 2, 0]} castShadow>
						<cylinderGeometry args={[0.13, 0.2, tree.h, 10]} />
						<meshStandardMaterial color={C.trunk} roughness={0.9} />
					</mesh>
					<group
						ref={(group) => {
							if (group) crowns.current[i] = group;
						}}
						position={[0, tree.h + tree.size * 0.35, 0]}
					>
						<Blobs blobs={tree.blobs} castShadow roughness={0.9} />
					</group>
				</group>
			))}
		</group>
	);
};

/** Deux papillons le jour, des lucioles la nuit */
const Critters: React.FC<{ night: number; animate: boolean }> = ({ night, animate }) => {
	const t = useOwnedTextures(() => ({ orange: wingTexture("#FF8A4C"), yellow: wingTexture("#FFD34D") }));
	const flies = useRef<THREE.Group[]>([]);
	const wings = useRef<THREE.Group[]>([]);
	const paths = useMemo(
		() => [
			{ c: new THREE.Vector3(-2.4, 0.9, 1.1), rx: 0.9, rz: 0.5, speed: 0.6, phase: 0 },
			{ c: new THREE.Vector3(2.4, 1.0, 1.3), rx: 1.1, rz: 0.6, speed: 0.5, phase: 2 },
		],
		[],
	);
	const prev = useMemo(() => paths.map(() => new THREE.Vector3()), [paths]);

	useFrame(({ clock }) => {
		const time = clock.elapsedTime;
		paths.forEach((p, i) => {
			const fly = flies.current[i];
			if (!fly) return;
			const a = animate ? time * p.speed + p.phase : p.phase;
			fly.position.set(
				p.c.x + Math.sin(a) * p.rx,
				p.c.y + Math.sin(a * 2.3) * 0.18,
				p.c.z + Math.cos(a * 0.8) * p.rz,
			);
			const dx = fly.position.x - prev[i].x;
			const dz = fly.position.z - prev[i].z;
			if (Math.abs(dx) + Math.abs(dz) > 1e-4) fly.rotation.y = Math.atan2(dx, dz);
			prev[i].copy(fly.position);
			const flap = animate ? Math.sin(time * 22 + i) * 0.9 : 0.4;
			const left = wings.current[i * 2];
			const right = wings.current[i * 2 + 1];
			if (left) left.rotation.z = 0.25 + flap;
			if (right) right.rotation.z = -0.25 - flap;
		});
	});

	const dayOpacity = THREE.MathUtils.clamp(1 - night * 1.6, 0, 1);
	return (
		<group>
			{dayOpacity > 0.05 &&
				paths.map((_, i) => (
					<group
						key={i}
						ref={(group) => {
							if (group) flies.current[i] = group;
						}}
						scale={0.85}
					>
						<mesh rotation-x={Math.PI / 2}>
							<capsuleGeometry args={[0.012, 0.09, 4, 6]} />
							<meshBasicMaterial color="#2A1810" />
						</mesh>
						{/* Deux ailes à plat, articulées sur le corps (axe avant-arrière) */}
						{[1, -1].map((side, k) => (
							<group
								key={side}
								ref={(group) => {
									if (group) wings.current[i * 2 + k] = group;
								}}
							>
								<mesh position={[side * 0.08, 0, 0]} rotation-x={-Math.PI / 2} scale={[side, 1, 1]}>
									<planeGeometry args={[0.16, 0.16]} />
									<meshBasicMaterial
										map={i ? t.yellow : t.orange}
										side={THREE.DoubleSide}
										transparent
										alphaTest={0.4}
										opacity={dayOpacity}
									/>
								</mesh>
							</group>
						))}
					</group>
				))}
			{animate && night > 0.25 && (
				<Sparkles
					count={26}
					scale={[9, 1.4, 3]}
					position={[0.75, 0.75, 1.3]}
					size={3.2}
					speed={0.35}
					opacity={Math.min(1, (night - 0.25) * 1.6)}
					color="#FFE58A"
				/>
			)}
		</group>
	);
};

/* ============================================================== RIVIÈRE */

/// Une petite rivière qui sort de la lisière d'arbres, longe la gauche de
/// l'école et file vers le bord gauche de l'écran (points en x, z)
const RIVER_POINTS: [number, number][] = [
	[-4.0, -9.5],
	[-4.55, -5],
	[-4.15, -1.8],
	[-3.35, 0.5],
	[-2.6, 2.4],
	[-2.75, 4.5],
	[-3.9, 7],
	[-5.4, 10],
];
const RIVER_WIDTH = 0.82;

/** Ruban plat le long d'une courbe : chaque côté décalé de `width / 2` */
function ribbon(curve: THREE.CatmullRomCurve3, width: (t: number) => number, y: number, segments: number) {
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	const point = new THREE.Vector3();
	const tangent = new THREE.Vector3();
	const side = new THREE.Vector3();
	const length = curve.getLength();
	for (let i = 0; i <= segments; i++) {
		const t = i / segments;
		curve.getPointAt(t, point);
		curve.getTangentAt(t, tangent);
		side.set(-tangent.z, 0, tangent.x).normalize();
		const half = width(t) / 2;
		for (const sign of [-1, 1]) {
			positions.push(point.x + side.x * half * sign, y, point.z + side.z * half * sign);
			uvs.push(sign < 0 ? 0 : 1, (t * length) / 2.2);
		}
		if (i < segments) {
			const a = i * 2;
			/// Faces tournées vers le ciel
			indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

const River: React.FC<{ night: number; animate: boolean }> = ({ night, animate }) => {
	const t = useOwnedTextures(() => ({ flow: riverFlowTexture() }));
	const parts = useMemo(() => {
		const curve = new THREE.CatmullRomCurve3(RIVER_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)));
		/// Largeur qui respire un peu le long du cours
		const width = (u: number) => RIVER_WIDTH * (0.9 + Math.sin(u * 19) * 0.08 + Math.sin(u * 7 + 1) * 0.06);
		const water = ribbon(curve, width, 0.014, 160);
		const bank = ribbon(curve, (u) => width(u) + 0.3, 0.007, 160);

		/// Galets le long des deux rives, quelques roseaux
		const r = rand(71);
		const pebbles: Blob[] = [];
		const reeds: { position: [number, number, number]; height: number; lean: number }[] = [];
		const point = new THREE.Vector3();
		const tangent = new THREE.Vector3();
		const steps = 70;
		for (let i = 0; i <= steps; i++) {
			const u = i / steps;
			curve.getPointAt(u, point);
			curve.getTangentAt(u, tangent);
			const sideX = -tangent.z;
			const sideZ = tangent.x;
			for (const sign of [-1, 1]) {
				if (r() < 0.35) continue;
				const offset = (width(u) / 2 + 0.06 + r() * 0.1) * sign;
				pebbles.push({
					position: [point.x + sideX * offset, 0.03, point.z + sideZ * offset],
					scale: 0.05 + r() * 0.07,
					color: ["#B9B2A5", "#CFC6B5", "#9E978A", "#D9CFBE"][Math.floor(r() * 4)],
				});
			}
			if (i % 9 === 4) {
				const sign = r() > 0.5 ? 1 : -1;
				const offset = (width(u) / 2 + 0.12) * sign;
				for (let k = 0; k < 4; k++) {
					reeds.push({
						position: [point.x + sideX * offset + (r() - 0.5) * 0.14, 0, point.z + sideZ * offset + (r() - 0.5) * 0.14],
						height: 0.32 + r() * 0.28,
						lean: (r() - 0.5) * 0.3,
					});
				}
			}
		}
		return { water, bank, pebbles, reeds };
	}, []);
	useEffect(
		() => () => {
			parts.water.dispose();
			parts.bank.dispose();
		},
		[parts],
	);

	const reedsRef = useRef<THREE.InstancedMesh>(null);
	useEffect(() => {
		const mesh = reedsRef.current;
		if (!mesh) return;
		const matrix = new THREE.Matrix4();
		const rotation = new THREE.Quaternion();
		const scale = new THREE.Vector3();
		const position = new THREE.Vector3();
		parts.reeds.forEach((reed, i) => {
			rotation.setFromEuler(new THREE.Euler(reed.lean, 0, reed.lean * 0.6));
			scale.set(1, reed.height, 1);
			position.set(reed.position[0], reed.height / 2, reed.position[2]);
			matrix.compose(position, rotation, scale);
			mesh.setMatrixAt(i, matrix);
		});
		mesh.instanceMatrix.needsUpdate = true;
		mesh.computeBoundingSphere();
	}, [parts]);

	useFrame((_, delta) => {
		if (!animate) return;
		/// Le courant descend vers l'avant de la scène
		t.flow.offset.y = (t.flow.offset.y - frameStep(delta) * 0.32) % 1;
	});

	const waterColor = useMemo(() => new THREE.Color("#5DB7E6").lerp(new THREE.Color("#2C5C93"), night * 0.75), [night]);
	return (
		<group>
			<mesh geometry={parts.bank} receiveShadow>
				<meshStandardMaterial color="#B69A6B" roughness={1} />
			</mesh>
			<mesh geometry={parts.water} receiveShadow>
				<meshStandardMaterial
					color={waterColor}
					map={t.flow}
					roughness={0.18}
					metalness={0.05}
					emissive="#1E4F7A"
					emissiveIntensity={0.12 + night * 0.25}
				/>
			</mesh>
			<Blobs blobs={parts.pebbles} detail={1} roughness={0.85} />
			<instancedMesh ref={reedsRef} args={[undefined, undefined, parts.reeds.length]} castShadow>
				<coneGeometry args={[0.018, 1, 5]} />
				<meshStandardMaterial color="#5E9A3C" roughness={0.8} />
			</instancedMesh>
		</group>
	);
};

/* ============================================================== ÉCOLE */

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
	return {
		position: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] as [number, number, number],
		args: [x1 - x0, y1 - y0, z1 - z0] as [number, number, number],
	};
}

const Walls: React.FC = () => {
	const t = useOwnedTextures(() => ({ plaster: plasterTexture(), stone: stoneTexture() }));
	const { left, right, wallHeight: h, wallDepth: d, door } = SCHOOL;
	const dl = door.x - door.width / 2;
	const dr = door.x + door.width / 2;
	/// Le mur est percé à l'emplacement de la porte : Milo y disparaît vraiment
	const pieces = [box(left, dl, 0, h, -d, 0), box(dr, right, 0, h, -d, 0), box(dl, dr, door.height, h, -d, 0)];
	const plinth = [box(left - 0.02, dl, 0, 0.36, -d, 0.05), box(dr, right + 0.02, 0, 0.36, -d, 0.05)];
	const sideDepth = 4.4;
	return (
		<group>
			{pieces.map((piece, i) => (
				<mesh key={i} position={piece.position} castShadow receiveShadow>
					<boxGeometry args={piece.args} />
					<meshStandardMaterial map={t.plaster} roughness={0.95} />
				</mesh>
			))}
			{plinth.map((piece, i) => (
				<mesh key={i} position={piece.position} receiveShadow>
					<boxGeometry args={piece.args} />
					<meshStandardMaterial map={t.stone} roughness={1} />
				</mesh>
			))}
			{/* Murs de côté, visibles en perspective */}
			{[left, right].map((x, i) => (
				<mesh key={i} position={[x + (i ? -d / 2 : d / 2), h / 2, -sideDepth / 2 - 0.01]} castShadow receiveShadow>
					<boxGeometry args={[d, h, sideDepth]} />
					<meshStandardMaterial map={t.plaster} roughness={0.95} />
				</mesh>
			))}
			{/* Chaînages d'angle et corniche, d'un blanc cassé */}
			{[left, right].map((x, i) => (
				<mesh key={i} position={[x + (i ? -0.1 : 0.1), h / 2, 0.025]} castShadow>
					<boxGeometry args={[0.2, h, 0.07]} />
					<meshStandardMaterial color={C.trim} roughness={0.8} />
				</mesh>
			))}
			<mesh position={[(left + right) / 2, h + 0.06, 0.02]} castShadow>
				<boxGeometry args={[right - left + 0.3, 0.16, 0.34]} />
				<meshStandardMaterial color={C.trim} roughness={0.8} />
			</mesh>
		</group>
	);
};

const Roof: React.FC = () => {
	const t = useOwnedTextures(() => ({ tiles: roofTexture() }));
	const { left, right, roof } = SCHOOL;
	const width = right - left + roof.overhang * 2;
	const rise = roof.ridgeY - roof.eaveY;
	const run = roof.eaveZ - roof.ridgeZ;
	const length = Math.hypot(rise, run);
	const angle = Math.atan2(rise, run);
	const gable = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(roof.eaveZ - 0.25, roof.eaveY - 0.12);
		shape.lineTo(roof.ridgeZ, roof.ridgeY - 0.1);
		shape.lineTo(roof.ridgeZ * 2 - roof.eaveZ, roof.eaveY - 0.12);
		shape.closePath();
		return new THREE.ShapeGeometry(shape);
	}, [roof]);
	useEffect(() => () => gable.dispose(), [gable]);
	return (
		<group>
			<mesh
				position={[(left + right) / 2, (roof.eaveY + roof.ridgeY) / 2, (roof.eaveZ + roof.ridgeZ) / 2]}
				rotation-x={-(Math.PI / 2 - angle)}
				castShadow
				receiveShadow
			>
				<boxGeometry args={[width, length, 0.08]} />
				<meshStandardMaterial map={t.tiles} roughness={0.8} />
			</mesh>
			{/* Bordure blanche le long du bas du toit */}
			<mesh position={[(left + right) / 2, roof.eaveY - 0.02, roof.eaveZ - 0.02]} rotation-x={angle}>
				<boxGeometry args={[width + 0.04, 0.1, 0.12]} />
				<meshStandardMaterial color={C.trim} roughness={0.7} />
			</mesh>
			{/* Pignons sous le toit, à chaque bout. Même orientation des deux côtés :
			    le triangle est dessiné dans le plan (z, y) ; tourné dans l'autre sens,
			    il basculerait vers l'avant, devant la façade. */}
			{[left - 0.001, right + 0.001].map((x, i) => (
				<mesh key={i} geometry={gable} position={[x, 0, 0]} rotation-y={-Math.PI / 2}>
					<meshStandardMaterial color={C.gable} side={THREE.DoubleSide} roughness={0.95} />
				</mesh>
			))}
			{/* Cheminée */}
			<group position={[3.4, 0, -1.25]}>
				<mesh position={[0, 4.05, 0]} castShadow>
					<boxGeometry args={[0.36, 0.9, 0.36]} />
					<meshStandardMaterial color="#B5512A" roughness={0.9} />
				</mesh>
				<mesh position={[0, 4.53, 0]} castShadow>
					<boxGeometry args={[0.46, 0.1, 0.46]} />
					<meshStandardMaterial color={C.trim} roughness={0.8} />
				</mesh>
			</group>
		</group>
	);
};

/** Image de la vraie salle de classe (jour / nuit), prête pour fenêtres et porte */
function useClassroomViews() {
	const [day, night] = useLoader(THREE.TextureLoader, [ASSETS.insideDay, ASSETS.insideNight]);
	useMemo(() => {
		for (const texture of [day, night]) texture.colorSpace = THREE.SRGBColorSpace;
	}, [day, night]);
	return { day, night };
}

const Windows: React.FC<{ night: number }> = ({ night }) => {
	const views = useClassroomViews();
	const t = useOwnedTextures(() => ({ glow: glowTexture() }));
	/// Chaque fenêtre montre son coin de la classe
	const crops = useMemo(
		() =>
			SCHOOL.windows.map((w) =>
				(["day", "night"] as const).map((kind) => {
					const texture = views[kind].clone();
					texture.offset.set(w.view.offset[0], w.view.offset[1]);
					texture.repeat.set(w.view.repeat[0], w.view.repeat[1]);
					texture.needsUpdate = true;
					return texture;
				}),
			),
		[views],
	);
	useEffect(() => () => crops.flat().forEach((texture) => texture.dispose()), [crops]);

	const { width: w, height: h, sill } = SCHOOL.window;
	const cy = sill + h / 2;
	const glass = new THREE.Color("#E6ECEE").lerp(new THREE.Color("#FFFFFF"), night);
	return (
		<group>
			{SCHOOL.windows.map((win, i) => (
				<group key={i} position={[win.x, cy, 0]}>
					{/* Vitre : la classe derrière, éclairée la nuit */}
					<mesh position={[0, 0, 0.005]}>
						<planeGeometry args={[w, h]} />
						<meshBasicMaterial map={night > 0.5 ? crops[i][1] : crops[i][0]} color={glass} toneMapped={false} />
					</mesh>
					<mesh position={[0, 0, 0.012]}>
						<planeGeometry args={[w, h]} />
						<meshBasicMaterial color="#DDEEFF" transparent opacity={0.16 * (1 - night)} depthWrite={false} />
					</mesh>
					<sprite position={[0, 0, 0.3]} scale={[w * 2.4, h * 2.2, 1]}>
						<spriteMaterial
							map={t.glow}
							color="#FFC46A"
							transparent
							opacity={night * 0.45}
							depthWrite={false}
							blending={THREE.AdditiveBlending}
						/>
					</sprite>
					{/* Encadrement et croisillons */}
					{[
						box(-w / 2 - 0.08, w / 2 + 0.08, h / 2, h / 2 + 0.09, 0, 0.08),
						box(-w / 2 - 0.08, -w / 2, -h / 2, h / 2, 0, 0.08),
						box(w / 2, w / 2 + 0.08, -h / 2, h / 2, 0, 0.08),
						box(-0.03, 0.03, -h / 2, h / 2, 0, 0.05),
						box(-w / 2, w / 2, -0.03, 0.03, 0, 0.05),
					].map((piece, k) => (
						<mesh key={k} position={piece.position} castShadow>
							<boxGeometry args={piece.args} />
							<meshStandardMaterial color={C.trim} roughness={0.7} />
						</mesh>
					))}
					{/* Appui de fenêtre et jardinière fleurie */}
					<mesh position={[0, -h / 2 - 0.04, 0.09]} castShadow>
						<boxGeometry args={[w + 0.34, 0.08, 0.2]} />
						<meshStandardMaterial color={C.trim} roughness={0.7} />
					</mesh>
					<RoundedBox args={[w + 0.06, 0.24, 0.26]} radius={0.05} position={[0, -h / 2 - 0.2, 0.17]} castShadow>
						<meshStandardMaterial color={C.pot} roughness={0.8} />
					</RoundedBox>
					<WindowFlowers width={w} y={-h / 2 - 0.05} seed={i * 13 + 5} />
					{/* Volets verts */}
					{[-1, 1].map((side) => (
						<group key={side} position={[side * (w / 2 + 0.31), 0, 0.045]}>
							<RoundedBox args={[0.44, h + 0.06, 0.06]} radius={0.02} castShadow>
								<meshStandardMaterial color={C.shutter} roughness={0.75} />
							</RoundedBox>
							{[-0.32, 0, 0.32].map((y) => (
								<mesh key={y} position={[0, y * h, 0.035]}>
									<boxGeometry args={[0.33, 0.03, 0.01]} />
									<meshStandardMaterial color={C.shutterDark} roughness={0.8} />
								</mesh>
							))}
						</group>
					))}
				</group>
			))}
		</group>
	);
};

const WindowFlowers: React.FC<{ width: number; y: number; seed: number }> = ({ width, y, seed }) => {
	const { leaves, petals } = useMemo(() => {
		const r = rand(seed);
		const leaves: Blob[] = [];
		const petals: Blob[] = [];
		for (let i = 0; i < 7; i++) {
			const x = -width / 2 + 0.1 + (i / 6) * (width - 0.2);
			leaves.push({ position: [x, y + 0.02, 0.2], scale: 0.1 + r() * 0.03, color: LEAF_COLORS[i % 4] });
			petals.push({
				position: [x + (r() - 0.5) * 0.08, y + 0.1 + r() * 0.06, 0.24],
				scale: 0.055 + r() * 0.02,
				color: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)],
			});
		}
		return { leaves, petals };
	}, [width, y, seed]);
	return (
		<group>
			<Blobs blobs={leaves} detail={1} />
			<Blobs blobs={petals} detail={1} roughness={0.6} />
		</group>
	);
};

const Sign: React.FC = () => {
	const t = useOwnedTextures(() => ({ sign: signTexture("Classe de Milo") }));
	const { door, sign } = SCHOOL;
	const w = sign.width;
	const h = sign.height;
	return (
		<group position={[door.x, sign.y, 0.03]}>
			<mesh position={[0, 0, 0.03]}>
				<planeGeometry args={[w, h]} />
				<meshStandardMaterial map={t.sign} roughness={0.9} />
			</mesh>
			{[
				box(-w / 2 - 0.06, w / 2 + 0.06, h / 2, h / 2 + 0.06, 0, 0.06),
				box(-w / 2 - 0.06, w / 2 + 0.06, -h / 2 - 0.06, -h / 2, 0, 0.06),
				box(-w / 2 - 0.06, -w / 2, -h / 2, h / 2, 0, 0.06),
				box(w / 2, w / 2 + 0.06, -h / 2, h / 2, 0, 0.06),
			].map((piece, k) => (
				<mesh key={k} position={piece.position} castShadow>
					<boxGeometry args={piece.args} />
					<meshStandardMaterial color={C.wood} roughness={0.7} />
				</mesh>
			))}
		</group>
	);
};

/** Lanterne à gauche de la porte : discrète le jour, chaleureuse la nuit */
interface LanternProps {
	x: number;
	y?: number;
	night: number;
	animate: boolean;
	/** Intensité de nuit de la lumière projetée */
	strength?: number;
	/** Recul de la lumière devant le mur (pour éclairer ce qui est devant) */
	reach?: number;
	phase?: number;
}

/** Lanterne murale : discrète le jour, chaleureuse la nuit */
const Lantern: React.FC<LanternProps> = ({ x, y = 1.95, night, animate, strength = 3.2, reach = 0.35, phase = 0 }) => {
	const t = useOwnedTextures(() => ({ glow: glowTexture() }));
	const light = useRef<THREE.PointLight>(null);
	useFrame(({ clock }) => {
		if (!light.current) return;
		const time = clock.elapsedTime + phase;
		const flicker = animate ? 1 + Math.sin(time * 13) * 0.03 + Math.sin(time * 7.3) * 0.03 : 1;
		light.current.intensity = night * strength * flicker;
	});
	return (
		<group position={[x, y, 0.08]}>
			<mesh position={[0, 0.26, -0.02]}>
				<boxGeometry args={[0.05, 0.05, 0.16]} />
				<meshStandardMaterial color={C.metal} roughness={0.5} metalness={0.3} />
			</mesh>
			<mesh position={[0, 0.3, 0.08]}>
				<coneGeometry args={[0.15, 0.14, 4]} />
				<meshStandardMaterial color={C.metal} roughness={0.5} metalness={0.3} />
			</mesh>
			<mesh position={[0, 0.1, 0.08]}>
				<boxGeometry args={[0.17, 0.26, 0.17]} />
				<meshStandardMaterial
					color="#FFE7AE"
					emissive="#FFB54A"
					emissiveIntensity={0.25 + night * 2.2}
					roughness={0.3}
					transparent
					opacity={0.92}
				/>
			</mesh>
			<mesh position={[0, -0.05, 0.08]}>
				<boxGeometry args={[0.2, 0.04, 0.2]} />
				<meshStandardMaterial color={C.metal} roughness={0.5} metalness={0.3} />
			</mesh>
			<sprite position={[0, 0.1, 0.2]} scale={[1.3, 1.3, 1]}>
				<spriteMaterial
					map={t.glow}
					color="#FFB54A"
					transparent
					opacity={0.1 + night * 0.65}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</sprite>
			<pointLight
				ref={light}
				position={[0, 0.05, reach]}
				color="#FFB866"
				intensity={night * strength}
				distance={4.5}
				decay={2}
			/>
		</group>
	);
};

/** La porte de la salle de classe, son encadrement, sa marche, et la classe derrière */
const Door: React.FC<{ bridge: MiloSchoolBridge; night: number; reducedMotion: boolean }> = ({
	bridge,
	night,
	reducedMotion,
}) => {
	const doorTexture = useLoader(THREE.TextureLoader, ASSETS.door);
	const views = useClassroomViews();
	const t = useOwnedTextures(() => ({ spill: lightSpillTexture() }));
	const hinge = useRef<THREE.Group>(null);
	const spillMat = useRef<THREE.MeshBasicMaterial>(null);
	const inside = useRef<THREE.PointLight>(null);
	const spring = useRef({ value: 0, velocity: 0 });
	const outlined = useRef<THREE.Group>(null);
	useHoverOutline(outlined, () => bridge.hovered === "door" || bridge.phase === "inviting");

	/// Encadrement d'un seul tenant (un U extrudé) : un contour net, sans
	/// raccords visibles entre montants et linteau
	const frame = useMemo(() => {
		const { width: fw, height: fh } = SCHOOL.door;
		const t = 0.13;
		const shape = new THREE.Shape();
		shape.moveTo(-fw / 2 - t, 0);
		shape.lineTo(-fw / 2 - t, fh + t);
		shape.lineTo(fw / 2 + t, fh + t);
		shape.lineTo(fw / 2 + t, 0);
		shape.lineTo(fw / 2, 0);
		shape.lineTo(fw / 2, fh);
		shape.lineTo(-fw / 2, fh);
		shape.lineTo(-fw / 2, 0);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, { depth: SCHOOL.wallDepth + 0.08, bevelEnabled: false });
	}, []);
	useEffect(() => () => frame.dispose(), [frame]);

	/// Face extérieure : la poignée passe à gauche (la porte s'ouvre à droite)
	const faces = useMemo(() => {
		const front = doorTexture.clone();
		front.colorSpace = THREE.SRGBColorSpace;
		front.wrapS = THREE.RepeatWrapping;
		front.repeat.x = -1;
		front.offset.x = 1;
		front.needsUpdate = true;
		const back = doorTexture.clone();
		back.colorSpace = THREE.SRGBColorSpace;
		back.needsUpdate = true;
		const edge = new THREE.MeshStandardMaterial({ color: C.woodDark, roughness: 0.7 });
		return {
			textures: [front, back],
			materials: [
				edge,
				edge,
				edge,
				edge,
				new THREE.MeshStandardMaterial({ map: front, roughness: 0.6 }),
				new THREE.MeshStandardMaterial({ map: back, roughness: 0.6 }),
			],
		};
	}, [doorTexture]);
	useEffect(
		() => () => {
			faces.textures.forEach((texture) => texture.dispose());
			new Set(faces.materials).forEach((material) => material.dispose());
		},
		[faces],
	);

	const lastBridge = useRef(bridge);
	useFrame((_, delta) => {
		const s = spring.current;
		const target = bridge.doorOpen ? 1 : 0;
		/// Retour sur l'accueil (nouvelle page, scène conservée) : porte remise en place
		if (lastBridge.current !== bridge) {
			lastBridge.current = bridge;
			s.value = target;
			s.velocity = 0;
		}
		if (reducedMotion) {
			s.value = target;
			s.velocity = 0;
		} else {
			/// Ressort un peu mou : la porte dépasse à peine et revient. Intégré
			/// par petits pas fixes : même mouvement à 30 ou à 144 images/s
			let remaining = frameStep(delta);
			while (remaining > 0) {
				const dt = Math.min(remaining, 1 / 120);
				s.velocity += ((target - s.value) * 70 - s.velocity * 11) * dt;
				s.value += s.velocity * dt;
				remaining -= dt;
			}
		}
		const open = THREE.MathUtils.clamp(s.value, -0.05, 1.08);
		if (hinge.current) hinge.current.rotation.y = -open * DOOR_OPEN_ANGLE;
		const amount = THREE.MathUtils.clamp(open, 0, 1);
		if (spillMat.current) spillMat.current.opacity = amount * (0.22 + night * 0.55);
		if (inside.current) inside.current.intensity = amount * (1.6 + night * 4);
	});

	const { x, width: w, height: h } = SCHOOL.door;
	const d = SCHOOL.wallDepth;
	const roomDepth = 2.1;
	const lit = new THREE.Color("#FFFFFF").multiplyScalar(0.92 + night * 0.08);
	return (
		<group>
			{/* La classe, derrière la porte (image de la vraie salle) */}
			<group position={[x, 0, -d]}>
				<mesh position={[0, 1.35, -roomDepth]}>
					<planeGeometry args={[2.5, 3.1]} />
					<meshBasicMaterial map={night > 0.5 ? views.night : views.day} color={lit} toneMapped={false} />
				</mesh>
				{[-1, 1].map((side) => (
					<mesh key={side} position={[side * 0.8, 1.3, -roomDepth / 2]} rotation-y={-side * (Math.PI / 2)}>
						<planeGeometry args={[roomDepth, 2.6]} />
						<meshBasicMaterial color="#C9A983" />
					</mesh>
				))}
				<mesh position={[0, 0.002, -roomDepth / 2]} rotation-x={-Math.PI / 2}>
					<planeGeometry args={[1.6, roomDepth]} />
					<meshBasicMaterial color="#A8642D" />
				</mesh>
				<mesh position={[0, 2.6, -roomDepth / 2]} rotation-x={Math.PI / 2}>
					<planeGeometry args={[1.6, roomDepth]} />
					<meshBasicMaterial color="#E8D8C0" />
				</mesh>
				<pointLight ref={inside} position={[0, 1.7, -0.4]} color="#FFD08A" intensity={0} distance={5} decay={2} />
			</group>

			<group ref={outlined}>
				{/* Battant, articulé côté droit, qui s'ouvre vers l'intérieur */}
				<group ref={hinge} position={[x + w / 2, 0, -0.07]}>
					<mesh position={[-w / 2, h / 2, 0]} material={faces.materials} castShadow>
						<boxGeometry args={[w - 0.01, h - 0.01, 0.06]} />
					</mesh>
				</group>
				{/* Encadrement */}
				<mesh geometry={frame} position={[x, 0, -d - 0.01]} castShadow>
					<meshStandardMaterial color={C.trim} roughness={0.7} />
				</mesh>
			</group>

			{/* Marche, et l'herbe qui s'éclaire quand la porte s'ouvre */}
			<RoundedBox args={[w + 0.6, 0.12, 0.55]} radius={0.04} position={[x, 0.05, 0.22]} receiveShadow castShadow>
				<meshStandardMaterial color="#CDBFA8" roughness={0.95} />
			</RoundedBox>
			<mesh position={[x, 0.012, 1.25]} rotation-x={-Math.PI / 2}>
				<planeGeometry args={[2.6, 2.3]} />
				<meshBasicMaterial
					ref={spillMat}
					map={t.spill}
					transparent
					opacity={0}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					toneMapped={false}
				/>
			</mesh>

			{/* Zone de survol / clic : le passage de la porte */}
			<mesh position={[x, h / 2, 0.2]} visible={false} {...partHandlers(bridge, "door")}>
				<boxGeometry args={[w + 0.2, h + 0.1, 0.4]} />
			</mesh>
		</group>
	);
};


/* ============================================================== PANCARTE ET COURRIER */

/** Rapproche une valeur de sa cible, indépendamment du nombre d'images par seconde */
const approach = (value: number, target: number, speed: number, dt: number) =>
	value + (target - value) * (1 - Math.exp(-speed * dt));

/** Pastille ronde qui flotte au-dessus d'un objet (missions restantes, courrier) */
const FloatingBadge: React.FC<{
	value: string;
	position: [number, number, number];
	animate: boolean;
	phase?: number;
	/** Masquée pendant le gros plan (elle passerait devant tout) */
	hidden?: () => boolean;
}> = ({ value, position, animate, phase = 0, hidden }) => {
	const [badge] = useState(() => countBadgeTexture());
	useEffect(() => () => badge.texture.dispose(), [badge]);
	useEffect(() => badge.update(value), [badge, value]);
	const sprite = useRef<THREE.Sprite>(null);
	useFrame(({ clock }) => {
		if (!sprite.current) return;
		sprite.current.visible = !hidden?.();
		const time = clock.elapsedTime + phase;
		sprite.current.position.y = position[1] + (animate ? Math.sin(time * 2.4) * 0.05 : 0);
		const pulse = animate ? 1 + Math.max(0, Math.sin(time * 2.4)) * 0.06 : 1;
		sprite.current.scale.set(0.34 * pulse, 0.34 * pulse, 1);
	});
	if (!value) return null;
	return (
		<sprite ref={sprite} position={position} scale={[0.34, 0.34, 1]} renderOrder={5}>
			<spriteMaterial map={badge.texture} transparent depthTest={false} toneMapped={false} />
		</sprite>
	);
};

/** Petit réverbère de jardin : la nuit, il éclaire la pancarte et la boîte aux lettres */
const GardenLamp: React.FC<{ night: number; animate: boolean }> = ({ night, animate }) => {
	const t = useOwnedTextures(() => ({ glow: glowTexture() }));
	const light = useRef<THREE.PointLight>(null);
	useFrame(({ clock }) => {
		if (!light.current) return;
		const flicker = animate ? 1 + Math.sin(clock.elapsedTime * 11 + 1) * 0.025 : 1;
		light.current.intensity = night * 4.5 * flicker;
	});
	const { x, z } = SCHOOL.gardenLamp;
	return (
		<group position={[x, 0, z]}>
			<mesh position={[0, 0.06, 0]} castShadow>
				<cylinderGeometry args={[0.1, 0.13, 0.12, 12]} />
				<meshStandardMaterial color={C.metal} roughness={0.5} metalness={0.3} />
			</mesh>
			<mesh position={[0, 0.8, 0]} castShadow>
				<cylinderGeometry args={[0.03, 0.04, 1.5, 10]} />
				<meshStandardMaterial color={C.metal} roughness={0.5} metalness={0.3} />
			</mesh>
			<mesh position={[0, 1.66, 0]}>
				<sphereGeometry args={[0.13, 20, 14]} />
				<meshStandardMaterial
					color="#FFF2D0"
					emissive="#FFC064"
					emissiveIntensity={0.2 + night * 2.4}
					roughness={0.3}
				/>
			</mesh>
			<mesh position={[0, 1.81, 0]}>
				<coneGeometry args={[0.17, 0.12, 12]} />
				<meshStandardMaterial color={C.metal} roughness={0.5} metalness={0.3} />
			</mesh>
			<sprite position={[0, 1.66, 0.05]} scale={[1.2, 1.2, 1]}>
				<spriteMaterial
					map={t.glow}
					color="#FFB54A"
					transparent
					opacity={0.05 + night * 0.6}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</sprite>
			<pointLight ref={light} position={[0, 1.55, 0.25]} color="#FFC27A" intensity={night * 4.5} distance={4} decay={2} />
		</group>
	);
};

/** Pancarte en bois des missions du jour ; au clic, la liste s'affiche */
const MissionsBoard: React.FC<{ bridge: MiloSchoolBridge; missions: MissionsSummary; night: number; animate: boolean }> = ({
	bridge,
	missions,
	night,
	animate,
}) => {
	const [board] = useState(() => missionsBoardTexture({ done: missions.done, total: missions.total }));
	useEffect(() => () => board.texture.dispose(), [board]);
	useEffect(() => board.update({ done: missions.done, total: missions.total }), [board, missions.done, missions.total]);

	const sign = useRef<THREE.Group>(null);
	const face = useRef<THREE.MeshStandardMaterial>(null);
	const hover = useRef(0);
	const outlined = useRef<THREE.Group>(null);
	useHoverOutline(outlined, () => bridge.hovered === "missions");
	useFrame(({ clock }, delta) => {
		const dt = frameStep(delta);
		hover.current = approach(hover.current, bridge.hovered === "missions" ? 1 : 0, 10, dt);
		const h = hover.current;
		if (sign.current) {
			const time = clock.elapsedTime;
			/// Se balance doucement au vent, et se penche vers l'élève au survol
			sign.current.rotation.z = animate ? Math.sin(time * 1.3) * 0.012 + Math.sin(time * 9) * 0.02 * h : 0;
			/// Le haut du panneau vient vers l'élève (les poteaux restent derrière)
			sign.current.rotation.x = 0.1 * h;
			sign.current.scale.setScalar(1 + 0.06 * h);
		}
		if (face.current) face.current.emissiveIntensity = 0.1 + night * 0.45 + h * 0.3;
	});

	const { x, z, yaw } = SCHOOL.board;
	return (
		<group ref={outlined} position={[x, 0, z]} rotation-y={yaw}>
			{/* Poteaux collés au dos du panneau : il penche vers l'élève, ils ne le traversent jamais */}
			{[-0.42, 0.42].map((px) => (
				<mesh key={px} position={[px, 0.47, -0.085]} castShadow>
					<boxGeometry args={[0.09, 0.94, 0.09]} />
					<meshStandardMaterial color={C.woodDark} roughness={0.85} />
				</mesh>
			))}
			<group ref={sign} position={[0, 1.02, 0]}>
				<RoundedBox args={[1.08, 0.7, 0.07]} radius={0.03} castShadow>
					<meshStandardMaterial color={C.wood} roughness={0.8} />
				</RoundedBox>
				<mesh position={[0, 0, 0.037]}>
					<planeGeometry args={[1.0, 0.625]} />
					<meshStandardMaterial
						ref={face}
						map={board.texture}
						emissive="#FFFFFF"
						emissiveMap={board.texture}
						emissiveIntensity={0.1}
						roughness={0.85}
					/>
				</mesh>
				{/* Petit toit de tuiles au-dessus du panneau */}
				{[-1, 1].map((side) => (
					<mesh key={side} position={[side * 0.27, 0.45, 0]} rotation-z={-side * 0.42} castShadow>
						<boxGeometry args={[0.64, 0.05, 0.2]} />
						<meshStandardMaterial color="#D45A26" roughness={0.75} />
					</mesh>
				))}
			</group>
			<FloatingBadge
				value={missions.pending > 0 ? String(missions.pending) : ""}
				position={[0.5, 1.55, 0.1]}
				animate={animate}
				hidden={() => bridge.zoom > 0.02}
			/>
			<mesh position={[0, 0.85, 0.05]} visible={false} {...partHandlers(bridge, "missions")}>
				<boxGeometry args={[1.25, 1.75, 0.45]} />
			</mesh>
		</group>
	);
};

/** Boîte aux lettres : drapeau levé et pastille quand il y a des nouvelles */
const Mailbox: React.FC<{ bridge: MiloSchoolBridge; unread: number; night: number; animate: boolean }> = ({
	bridge,
	unread,
	night,
	animate,
}) => {
	const t = useOwnedTextures(() => ({ side: mailboxSideTexture(), letter: letterTexture() }));
	const door = useRef<THREE.Group>(null);
	const letter = useRef<THREE.Group>(null);
	const flag = useRef<THREE.Group>(null);
	const body = useRef<THREE.Group>(null);
	const anim = useRef({ hover: 0, flag: unread > 0 ? 1 : 0 });
	const outlined = useRef<THREE.Group>(null);
	useHoverOutline(outlined, () => bridge.hovered === "mail");

	/// Façade de la porte : rectangle surmonté d'un demi-cercle
	const doorShape = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(-0.18, 0);
		shape.lineTo(0.18, 0);
		shape.lineTo(0.18, 0.24);
		shape.absarc(0, 0.24, 0.18, 0, Math.PI, false);
		shape.lineTo(-0.18, 0);
		return new THREE.ShapeGeometry(shape, 24);
	}, []);
	useEffect(() => () => doorShape.dispose(), [doorShape]);

	useFrame(({ clock }, delta) => {
		const dt = frameStep(delta);
		const a = anim.current;
		/// Porte ouverte et lettre qui pointe : au survol, et pendant le gros plan
		a.hover = approach(a.hover, bridge.hovered === "mail" || bridge.focus === "mail" ? 1 : 0, 9, dt);
		a.flag = approach(a.flag, unread > 0 ? 1 : 0, 6, dt);
		if (door.current) door.current.rotation.x = a.hover * 1.25;
		if (letter.current) {
			letter.current.position.set(0, 0.08 + a.hover * 0.16, 0.08 + a.hover * 0.2);
			letter.current.rotation.x = -0.35 * a.hover;
			letter.current.visible = a.hover > 0.02;
		}
		/// Drapeau couché (rien de neuf) ou levé (du courrier)
		if (flag.current) flag.current.rotation.x = -Math.PI / 2 + a.flag * (Math.PI / 2);
		/// Petit sautillement de la boîte quand une lettre attend
		if (body.current) {
			const time = clock.elapsedTime;
			body.current.rotation.z = animate && unread > 0 ? Math.max(0, Math.sin(time * 3)) ** 8 * 0.06 : 0;
		}
	});

	const red = "#E8492A";
	const { x, z, yaw } = SCHOOL.mailbox;
	return (
		<group ref={outlined} position={[x, 0, z]} rotation-y={yaw}>
			<mesh position={[0, 0.5, -0.05]} castShadow>
				<boxGeometry args={[0.11, 1.0, 0.11]} />
				<meshStandardMaterial color={C.woodDark} roughness={0.85} />
			</mesh>
			<mesh position={[0, 0.98, -0.05]} castShadow>
				<boxGeometry args={[0.3, 0.05, 0.34]} />
				<meshStandardMaterial color={C.woodDark} roughness={0.85} />
			</mesh>
			<group ref={body} position={[0, 1.13, 0]}>
				<mesh castShadow>
					<boxGeometry args={[0.36, 0.24, 0.5]} />
					<meshStandardMaterial color={red} roughness={0.45} metalness={0.1} />
				</mesh>
				<mesh position={[0, 0.12, 0]} rotation-x={-Math.PI / 2} castShadow>
					<cylinderGeometry args={[0.18, 0.18, 0.5, 24, 1, false, -Math.PI / 2, Math.PI]} />
					<meshStandardMaterial color={red} roughness={0.45} metalness={0.1} />
				</mesh>
				{/* Enveloppe peinte sur le flanc visible */}
				<mesh position={[-0.181, 0.0, 0]} rotation-y={-Math.PI / 2}>
					<planeGeometry args={[0.46, 0.23]} />
					<meshStandardMaterial map={t.side} roughness={0.5} />
				</mesh>
				{/* Lettre qui sort quand on survole la boîte */}
				<group ref={letter} visible={false}>
					<mesh rotation-x={-Math.PI / 2 + 0.25}>
						<planeGeometry args={[0.28, 0.18]} />
						<meshStandardMaterial map={t.letter} side={THREE.DoubleSide} roughness={0.9} />
					</mesh>
				</group>
				{/* Porte, articulée en bas */}
				<group ref={door} position={[0, -0.12, 0.252]}>
					<mesh geometry={doorShape}>
						<meshStandardMaterial color="#D43C20" roughness={0.5} side={THREE.DoubleSide} />
					</mesh>
					<mesh position={[0, 0.3, 0.02]}>
						<sphereGeometry args={[0.025, 10, 8]} />
						<meshStandardMaterial color="#FFD34D" roughness={0.3} metalness={0.4} />
					</mesh>
				</group>
				{/* Drapeau jaune, sur le flanc */}
				<group ref={flag} position={[-0.2, -0.04, -0.12]}>
					<mesh position={[0, 0.16, 0]}>
						<boxGeometry args={[0.02, 0.32, 0.02]} />
						<meshStandardMaterial color="#5E2E12" roughness={0.6} />
					</mesh>
					<mesh position={[0, 0.27, 0.06]}>
						<boxGeometry args={[0.015, 0.1, 0.12]} />
						<meshStandardMaterial
							color="#FFD34D"
							emissive="#FFB800"
							emissiveIntensity={0.15 + night * 0.4}
							roughness={0.5}
						/>
					</mesh>
				</group>
			</group>
			<FloatingBadge
				value={unread > 0 ? String(unread) : ""}
				position={[0.05, 1.68, 0.05]}
				animate={animate}
				phase={1.3}
				hidden={() => bridge.zoom > 0.02}
			/>
			<mesh position={[0, 0.8, 0]} visible={false} {...partHandlers(bridge, "mail")}>
				<boxGeometry args={[0.75, 1.65, 0.85]} />
			</mesh>
		</group>
	);
};

/* ============================================================== ASSEMBLAGE */

export interface MiloSchoolYardProps {
	bridge: MiloSchoolBridge;
	/** 0 = jour, 1 = nuit */
	night: number;
	animate: boolean;
	reducedMotion: boolean;
	missions: MissionsSummary;
	/** Actualités pas encore lues */
	unreadNews: number;
}

/// Lanterne à gauche de la porte, juste à côté de Milo : la nuit, c'est elle
/// qui l'éclaire (sa lumière part un peu en avant du mur, vers lui)
const MILO_LAMP_X = SCHOOL.door.x - SCHOOL.door.width / 2 - 0.42;

const MiloSchoolYard: React.FC<MiloSchoolYardProps> = ({
	bridge,
	night,
	animate,
	reducedMotion,
	missions,
	unreadNews,
}) => (
	<group>
		<Sky night={night} animate={animate} />
		<TreeLine night={night} />
		<Lawn />
		<Path />
		<River night={night} animate={animate} />
		<Trees animate={animate} />
		<Garden />
		<Walls />
		<Roof />
		<Windows night={night} />
		<Sign />
		<Lantern x={SCHOOL.door.x + SCHOOL.door.width / 2 + 0.42} night={night} animate={animate} />
		<Lantern x={MILO_LAMP_X} y={2.02} night={night} animate={animate} strength={6.5} reach={0.9} phase={2.1} />
		<Door bridge={bridge} night={night} reducedMotion={reducedMotion} />
		<MissionsBoard bridge={bridge} missions={missions} night={night} animate={animate} />
		<Mailbox bridge={bridge} unread={unreadNews} night={night} animate={animate} />
		<GardenLamp night={night} animate={animate} />
		<Critters night={night} animate={animate} />
	</group>
);

export default MiloSchoolYard;
