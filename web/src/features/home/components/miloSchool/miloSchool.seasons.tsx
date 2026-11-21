import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/// Plan de l'école utile à la déco (passé par MiloSchoolYard, qui le définit :
/// l'importer d'ici créerait une boucle entre les deux fichiers)
export interface SchoolPlan {
	left: number;
	right: number;
	roof: { eaveY: number; eaveZ: number; ridgeY: number; ridgeZ: number; overhang: number };
}

/// Déco de saison de l'accueil (cf. home/utils/homeTheme.ts pour choisir la
/// saison). Pour Noël : la neige qui tombe, la neige sur le toit, la cheminée,
/// les arbres et les buissons, un bonhomme de neige et une guirlande
/// lumineuse sous le toit.
///
/// Pensée pour les petits ordinateurs : chaque élément est UN appel de dessin
/// (maillages instanciés ou fusionnés), les flocons sont des points, et rien
/// ne bouge avec « réduire les animations ».

/* ================================================================ NEIGE QUI TOMBE */

/// Volume où tombent les flocons : devant l'école, jusqu'à la caméra
const SNOW_AREA = { x0: -7, x1: 8.5, y0: 0, y1: 6.8, z0: -1.5, z1: 6.5 };

/** Flocon : un rond flou blanc */
function flakeTexture() {
	const size = 32;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, "rgba(255,255,255,1)");
		g.addColorStop(0.45, "rgba(255,255,255,0.85)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

export const Snowfall: React.FC<{ count: number; night: number; animate: boolean }> = ({ count, night, animate }) => {
	const points = useRef<THREE.Points>(null);
	const texture = useMemo(flakeTexture, []);
	const flakes = useMemo(() => {
		const positions = new Float32Array(count * 3);
		const speed = new Float32Array(count);
		const phase = new Float32Array(count);
		const { x0, x1, y0, y1, z0, z1 } = SNOW_AREA;
		for (let i = 0; i < count; i++) {
			positions[i * 3] = x0 + Math.random() * (x1 - x0);
			positions[i * 3 + 1] = y0 + Math.random() * (y1 - y0);
			positions[i * 3 + 2] = z0 + Math.random() * (z1 - z0);
			speed[i] = 0.35 + Math.random() * 0.45;
			phase[i] = Math.random() * Math.PI * 2;
		}
		return { positions, speed, phase };
	}, [count]);
	useEffect(() => () => texture.dispose(), [texture]);
	/// La nuit, des flocons bleutés et un peu moins blancs
	const color = useMemo(() => new THREE.Color("#FFFFFF").lerp(new THREE.Color("#C9D4FF"), night), [night]);

	useFrame(({ clock }, delta) => {
		const p = points.current;
		if (!p || !animate) return;
		const dt = Math.min(delta, 0.1);
		const t = clock.elapsedTime;
		const { positions, speed, phase } = flakes;
		const { x0, x1, y0, y1 } = SNOW_AREA;
		for (let i = 0; i < count; i++) {
			const k = i * 3;
			/// Il tombe en se balançant un peu ; arrivé au sol, il repart d'en haut
			positions[k + 1] -= speed[i] * dt;
			positions[k] += Math.sin(t * 0.7 + phase[i]) * 0.18 * dt;
			if (positions[k + 1] < y0) {
				positions[k + 1] = y1;
				positions[k] = x0 + Math.random() * (x1 - x0);
			}
		}
		(p.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
	});

	return (
		<points ref={points} frustumCulled={false}>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[flakes.positions, 3]} />
			</bufferGeometry>
			<pointsMaterial
				map={texture}
				color={color}
				size={0.085}
				sizeAttenuation
				transparent
				opacity={0.92}
				depthWrite={false}
				toneMapped={false}
			/>
		</points>
	);
};

/* ================================================================ NEIGE POSÉE */

const SNOW_WHITE = "#F6F9FD";
/// Un soupçon de lumière propre : la neige reste blanche à l'ombre (sous le
/// bord du toit, au pied des buissons) au lieu de virer au gris
const SNOW_GLOW = { emissive: "#DCE6F4", emissiveIntensity: 0.16 } as const;

/** Plusieurs bosses de neige (ellipsoïdes aplatis) en un seul appel de dessin */
const SnowLumps: React.FC<{ lumps: { position: [number, number, number]; scale: [number, number, number] }[]; castShadow?: boolean }> = ({
	lumps,
	castShadow = false,
}) => {
	const mesh = useRef<THREE.InstancedMesh>(null);
	useEffect(() => {
		const m = mesh.current;
		if (!m) return;
		const matrix = new THREE.Matrix4();
		lumps.forEach((lump, i) => {
			matrix.makeScale(...lump.scale);
			matrix.setPosition(...lump.position);
			m.setMatrixAt(i, matrix);
		});
		m.instanceMatrix.needsUpdate = true;
		m.computeBoundingSphere();
	}, [lumps]);
	return (
		<instancedMesh ref={mesh} args={[undefined, undefined, lumps.length]} castShadow={castShadow} receiveShadow>
			<sphereGeometry args={[1, 14, 10]} />
			<meshStandardMaterial color={SNOW_WHITE} roughness={0.95} {...SNOW_GLOW} />
		</instancedMesh>
	);
};

/** Neige sur le toit (une couche qui suit la pente, et un bourrelet qui
 *  déborde au bord) et sur la cheminée */
export const RoofSnow: React.FC<{ school: SchoolPlan }> = ({ school }) => {
	const { left, right, roof } = school;
	const width = right - left + roof.overhang * 2;
	const rise = roof.ridgeY - roof.eaveY;
	const run = roof.eaveZ - roof.ridgeZ;
	const length = Math.hypot(rise, run);
	const angle = Math.atan2(rise, run);
	/// Bourrelet le long du bord du toit : des bosses de tailles variées
	const lumps = useMemo(() => {
		const list: { position: [number, number, number]; scale: [number, number, number] }[] = [];
		const x0 = left - roof.overhang + 0.12;
		const x1 = right + roof.overhang - 0.12;
		const n = 22;
		for (let i = 0; i < n; i++) {
			const x = x0 + ((x1 - x0) * i) / (n - 1);
			const s = 0.13 + ((i * 7) % 5) * 0.012;
			list.push({ position: [x, roof.eaveY + 0.06, roof.eaveZ + 0.02], scale: [s * 1.6, s * 0.75, s] });
		}
		/// Cheminée : un tas de neige sur le chapeau
		list.push({ position: [3.4, 4.6, -1.25], scale: [0.27, 0.09, 0.27] });
		return list;
	}, [left, right, roof]);
	return (
		<group>
			<group position={[(left + right) / 2, (roof.eaveY + roof.ridgeY) / 2, (roof.eaveZ + roof.ridgeZ) / 2]} rotation-x={-(Math.PI / 2 - angle)}>
				{/* Juste au-dessus des tuiles, un peu plus courte : les tuiles se
				    devinent au faîte */}
				<mesh position={[0, -length * 0.04, 0.08]} receiveShadow>
					<boxGeometry args={[width + 0.06, length * 0.9, 0.08]} />
					<meshStandardMaterial color={SNOW_WHITE} roughness={0.95} {...SNOW_GLOW} />
				</mesh>
			</group>
			<SnowLumps lumps={lumps} />
		</group>
	);
};

/// Arbres et buissons du jardin (mêmes valeurs que Trees et Garden)
const TREES = [
	{ x: -5.4, z: -1.4, h: 2.1, size: 1.25 },
	{ x: 6.7, z: -1.8, h: 2.3, size: 1.35 },
];
const BUSHES = [
	{ x: -2.3, z: 0.34, size: 0.48 },
	{ x: 1.78, z: 0.34, size: 0.4 },
	{ x: 4.2, z: 0.4, size: 0.6 },
	{ x: 5.6, z: 0.9, size: 0.75 },
];

/** Neige sur le haut des arbres (feuillage) */
export const TreeSnow: React.FC = () => {
	const lumps = useMemo(
		() =>
			TREES.flatMap(({ x, z, h, size }) => {
				const top = h + size * 0.35 + size * 0.66;
				return [
					{ position: [x, top, z] as [number, number, number], scale: [size * 0.62, size * 0.2, size * 0.55] as [number, number, number] },
					{
						position: [x - size * 0.42, top - size * 0.3, z + size * 0.1] as [number, number, number],
						scale: [size * 0.34, size * 0.12, size * 0.3] as [number, number, number],
					},
					{
						position: [x + size * 0.45, top - size * 0.22, z] as [number, number, number],
						scale: [size * 0.32, size * 0.11, size * 0.28] as [number, number, number],
					},
				];
			}),
		[],
	);
	return <SnowLumps lumps={lumps} />;
};

/** Neige sur le dessus des buissons */
export const BushSnow: React.FC = () => {
	const lumps = useMemo(
		() =>
			BUSHES.map(({ x, z, size }) => ({
				position: [x, size * 1.1, z] as [number, number, number],
				scale: [size * 0.52, size * 0.17, size * 0.44] as [number, number, number],
			})),
		[],
	);
	return <SnowLumps lumps={lumps} />;
};

/* ================================================================ BONHOMME DE NEIGE */

/// Sur la pelouse, entre le chemin et la pancarte des missions (sans la
/// cacher), un peu plus petit que Milo : tourné vers l'élève
const SNOWMAN_SPOT = { x: 1.5, z: 3.0, yaw: -0.25, scale: 0.82 };

/** Géométrie posée (déplacée, tournée, mise à l'échelle) avant fusion */
function placed(geometry: THREE.BufferGeometry, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
	const matrix = new THREE.Matrix4().compose(
		new THREE.Vector3(...position),
		new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
		new THREE.Vector3(...scale),
	);
	return geometry.applyMatrix4(matrix);
}

/// Bonhomme de neige : trois boules, une carotte, des yeux et des boutons de
/// charbon, une écharpe rouge, un chapeau et deux bras en branches. Les pièces
/// d'une même matière sont fusionnées : cinq appels de dessin en tout.
export const Snowman: React.FC = () => {
	const parts = useMemo(() => {
		const sphere = (r: number, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
		const snow = mergeGeometries([
			placed(sphere(0.36), [0, 0.31, 0], [0, 0, 0], [1, 0.92, 1]),
			placed(sphere(0.26), [0, 0.78, 0]),
			placed(sphere(0.19), [0, 1.14, 0]),
		]);
		const coal = mergeGeometries([
			/// yeux
			placed(sphere(0.024, 8, 6), [-0.065, 1.2, 0.165]),
			placed(sphere(0.024, 8, 6), [0.065, 1.2, 0.165]),
			/// boutons
			placed(sphere(0.028, 8, 6), [0, 0.86, 0.245]),
			placed(sphere(0.028, 8, 6), [0, 0.75, 0.258]),
			placed(sphere(0.028, 8, 6), [0, 0.64, 0.24]),
			/// chapeau : bord et haut
			placed(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 20), [0, 1.3, 0], [-0.12, 0, 0.06]),
			placed(new THREE.CylinderGeometry(0.13, 0.135, 0.22, 20), [0, 1.42, -0.015], [-0.12, 0, 0.06]),
		]);
		const carrot = placed(new THREE.ConeGeometry(0.035, 0.2, 10), [0, 1.13, 0.28], [Math.PI / 2, 0, 0]);
		const scarf = mergeGeometries([
			placed(new THREE.TorusGeometry(0.19, 0.045, 8, 20), [0, 0.96, 0], [Math.PI / 2 - 0.08, 0, 0]),
			placed(new THREE.BoxGeometry(0.07, 0.24, 0.035), [0.1, 0.84, 0.2], [0.15, 0, 0.2]),
		]);
		const wood = mergeGeometries([
			placed(new THREE.CylinderGeometry(0.014, 0.02, 0.5, 6), [-0.42, 0.9, 0], [0, 0, 1.0]),
			placed(new THREE.CylinderGeometry(0.01, 0.014, 0.14, 6), [-0.55, 1.04, 0], [0, 0, 0.2]),
			placed(new THREE.CylinderGeometry(0.014, 0.02, 0.5, 6), [0.42, 0.92, 0], [0, 0, -1.15]),
			placed(new THREE.CylinderGeometry(0.01, 0.014, 0.14, 6), [0.56, 1.06, 0], [0, 0, -0.35]),
		]);
		return { snow, coal, carrot, scarf, wood };
	}, []);
	useEffect(() => () => Object.values(parts).forEach((g) => g.dispose()), [parts]);
	return (
		<group position={[SNOWMAN_SPOT.x, 0, SNOWMAN_SPOT.z]} rotation-y={SNOWMAN_SPOT.yaw} scale={SNOWMAN_SPOT.scale}>
			<mesh geometry={parts.snow} castShadow receiveShadow>
				<meshStandardMaterial color={SNOW_WHITE} roughness={0.95} {...SNOW_GLOW} />
			</mesh>
			<mesh geometry={parts.coal}>
				<meshStandardMaterial color="#2A1810" roughness={0.7} />
			</mesh>
			<mesh geometry={parts.carrot}>
				<meshStandardMaterial color="#F07A1E" roughness={0.6} />
			</mesh>
			<mesh geometry={parts.scarf}>
				<meshStandardMaterial color="#D9342B" roughness={0.85} />
			</mesh>
			<mesh geometry={parts.wood}>
				<meshStandardMaterial color="#6B3E1F" roughness={0.9} />
			</mesh>
		</group>
	);
};

/* ================================================================ GUIRLANDE */

const BULB_COLORS = ["#FF4D4D", "#FFD34D", "#4DD97A", "#4DA6FF"].map((c) => new THREE.Color(c));
const BULBS = 30;
/// Un crochet toutes les 5 ampoules : le fil pend un peu entre deux
const BULBS_PER_SPAN = 5;

/** Guirlande lumineuse sous le bord du toit : le fil et ses ampoules
 *  (instanciées), qui scintillent doucement l'une après l'autre */
export const ChristmasLights: React.FC<{ school: SchoolPlan; night: number; animate: boolean }> = ({ school, night, animate }) => {
	const bulbs = useRef<THREE.InstancedMesh>(null);
	const { left, right, roof } = school;
	const { points, wire } = useMemo(() => {
		const x0 = left - roof.overhang + 0.15;
		const x1 = right + roof.overhang - 0.15;
		const list: THREE.Vector3[] = [];
		for (let i = 0; i < BULBS; i++) {
			const u = i / (BULBS - 1);
			const span = (i % BULBS_PER_SPAN) / BULBS_PER_SPAN;
			const sag = Math.sin(span * Math.PI) * 0.12;
			list.push(new THREE.Vector3(x0 + (x1 - x0) * u, roof.eaveY - 0.12 - sag, roof.eaveZ + 0.09));
		}
		const curve = new THREE.CatmullRomCurve3(list);
		return { points: list, wire: new THREE.TubeGeometry(curve, BULBS * 4, 0.008, 4, false) };
	}, [left, right, roof]);
	useEffect(() => () => wire.dispose(), [wire]);

	useEffect(() => {
		const m = bulbs.current;
		if (!m) return;
		const matrix = new THREE.Matrix4();
		points.forEach((p, i) => {
			matrix.makeScale(1, 1.25, 1);
			matrix.setPosition(p.x, p.y - 0.035, p.z);
			m.setMatrixAt(i, matrix);
			m.setColorAt(i, BULB_COLORS[i % BULB_COLORS.length]);
		});
		m.instanceMatrix.needsUpdate = true;
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
		m.computeBoundingSphere();
	}, [points]);

	/// Scintillement : chaque ampoule pulse à son rythme (plus vif la nuit)
	const color = useMemo(() => new THREE.Color(), []);
	useFrame(({ clock }) => {
		const m = bulbs.current;
		if (!m || !animate) return;
		const t = clock.elapsedTime;
		for (let i = 0; i < BULBS; i++) {
			const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7));
			color.copy(BULB_COLORS[i % BULB_COLORS.length]).multiplyScalar(pulse * (0.85 + night * 0.3));
			m.setColorAt(i, color);
		}
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	});

	return (
		<group>
			<mesh geometry={wire}>
				<meshStandardMaterial color="#1F3A22" roughness={0.8} />
			</mesh>
			<instancedMesh ref={bulbs} args={[undefined, undefined, BULBS]}>
				<sphereGeometry args={[0.042, 10, 8]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>
		</group>
	);
};
