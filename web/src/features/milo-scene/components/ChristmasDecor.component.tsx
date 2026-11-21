import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHRISTMAS_DECOR } from "@features/milo-scene/utils/classroomTheme";

/// Déco de Noël de la salle : sapin, guirlandes, cadeaux, banderole…
///
/// Le décor vient de r_class_noel.blend (collection « Noel »), exporté à part
/// dans /classroom/noel.glb : la salle bakée et ses textures de nuit ne
/// changent pas, la déco se pose par-dessus, au même endroit que la salle.
/// Elle est éclairée en temps réel, comme Milo (jour / nuit compris).
///
/// Ce qui vit, tout en restant léger (une poignée d'appels de dessin) :
///  - les guirlandes lumineuses : un halo par ampoule, posé aux sommets des
///    objets « Lumieres_* » du .glb, qui scintille dans le shader ;
///  - l'étoile du sapin tourne et pulse ;
///  - les suspensions du plafond (« Suspension_* ») se balancent ;
///  - des flocons tombent (dans la classe, derrière la porte et les fenêtres)
///    et le jardin est enneigé.
/// Tout est calculé sur la carte graphique : rien n'est recréé à chaque image.

/// Repère du décor = repère de classroom2.glb (unités de l'export Blender)
type Box = { min: [number, number, number]; max: [number, number, number] };

/// Couleurs des ampoules, en alternance le long de chaque guirlande
const BULB_COLORS = {
	Lumieres_Sapin: ["#FFE7AE", "#FFC23D", "#FF4D5E", "#FFE7AE", "#6AB8FF"],
	default: ["#FF4040", "#FFC23D", "#43E08A", "#4DA6FF"],
} as const;
/// Diamètre d'un halo d'ampoule (unités 3D)
const BULB_SIZE = 0.2;
/// Halo de l'étoile du sapin
const STAR_GLOW = { size: 1.25, color: "#FFD45A" };
/// Taille maximale d'un halo à l'écran (pixels), quand la caméra passe tout près
const MAX_POINT_PX = 90;

/// Neige : volumes (repère du décor) et densité
const SNOW = {
	/// Toute la classe : quelques flocons seulement, pour ne pas gêner la lecture
	indoors: { box: { min: [-5.3, 0.2, -6.3], max: [8.6, 6.1, 6.3] } as Box, count: 110, size: 0.08, speed: 0.28 },
	/// Derrière les fenêtres (entre les vitres et le décor extérieur)
	windows: { box: { min: [-9.3, -1, -4.8], max: [-5.8, 6.5, 4.8] } as Box, count: 160, size: 0.07, speed: 0.6 },
	/// Le jardin derrière la porte
	garden: { box: { min: [9.2, 0, -3.5], max: [19, 7, 11] } as Box, count: 520, size: 0.09, speed: 0.75 },
};
/// Jardin enneigé : posé sur l'herbe de ClassroomDoorway (cf. GARDEN)
const SNOW_GROUND = { x: [9.08, 19], z: [-4.35, 11.65], y: -0.004, day: "#EEF3FA", night: "#46537F" };

/// Balancement des suspensions (radians, radians / s)
const SWAY = { amplitude: 0.07, speed: 1.1 };

const NO_RAYCAST = () => null;

/* ------------------------------------------------------------ AMPOULES */

const bulbVertex = /* glsl */ `
uniform float uTime;
uniform float uScale;
uniform float uNight;
uniform float uTwinkle;
attribute vec3 aColor;
attribute vec4 aParams; // phase, vitesse, taille, rang le long de la guirlande
attribute float aAmp;
varying vec3 vColor;
varying float vGlow;
void main() {
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	float tw = 0.5 + 0.5 * sin(uTime * aParams.y + aParams.x);
	tw = tw * tw * (3.0 - 2.0 * tw);
	// une vague lente court le long des guirlandes
	float wave = 0.5 + 0.5 * sin(uTime * 1.6 - aParams.w * 0.45);
	float glow = mix(1.0, (1.0 - 0.6 * aAmp + 0.6 * aAmp * tw) * (0.82 + 0.18 * wave), uTwinkle);
	vGlow = glow * mix(0.9, 1.35, uNight);
	vColor = aColor;
	gl_PointSize = min(aParams.z * uScale / max(-mv.z, 0.05) * mix(1.0, 1.2, uNight), ${MAX_POINT_PX.toFixed(1)});
	gl_Position = projectionMatrix * mv;
}`;

const bulbFragment = /* glsl */ `
varying vec3 vColor;
varying float vGlow;
void main() {
	vec2 p = gl_PointCoord * 2.0 - 1.0;
	float d = dot(p, p);
	if (d > 1.0) discard;
	float core = exp(-d * 26.0);
	float halo = exp(-d * 4.5) * (1.0 - d) * 0.6;
	vec3 color = vColor * (halo + core) + vec3(1.0, 0.96, 0.88) * core * 0.85;
	gl_FragColor = vec4(color * vGlow, 1.0);
	#include <colorspace_fragment>
}`;

/** Un halo par ampoule : sommets des « Lumieres_* », couleurs en alternance */
function buildBulbs(sources: THREE.Points[], star: THREE.Object3D | null) {
	const positions: number[] = [];
	const colors: number[] = [];
	const params: number[] = [];
	const amps: number[] = [];
	const color = new THREE.Color();
	const p = new THREE.Vector3();
	for (const points of sources) {
		const palette = BULB_COLORS[points.name as keyof typeof BULB_COLORS] ?? BULB_COLORS.default;
		const attribute = points.geometry.getAttribute("position");
		for (let i = 0; i < attribute.count; i++) {
			p.fromBufferAttribute(attribute, i).applyMatrix4(points.matrixWorld);
			positions.push(p.x, p.y, p.z);
			color.set(palette[i % palette.length]);
			colors.push(color.r, color.g, color.b);
			params.push(Math.random() * Math.PI * 2, 1.1 + Math.random() * 1.8, BULB_SIZE * (0.9 + Math.random() * 0.25), i);
			amps.push(1);
		}
	}
	if (star) {
		star.getWorldPosition(p);
		positions.push(p.x, p.y, p.z);
		color.set(STAR_GLOW.color);
		colors.push(color.r, color.g, color.b);
		params.push(0, 1.4, STAR_GLOW.size, 0);
		amps.push(0.35);
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
	geometry.setAttribute("aParams", new THREE.Float32BufferAttribute(params, 4));
	geometry.setAttribute("aAmp", new THREE.Float32BufferAttribute(amps, 1));
	geometry.computeBoundingSphere();
	const material = new THREE.ShaderMaterial({
		uniforms: { uTime: { value: 0 }, uScale: { value: 400 }, uNight: { value: 0 }, uTwinkle: { value: 1 } },
		vertexShader: bulbVertex,
		fragmentShader: bulbFragment,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});
	const bulbs = new THREE.Points(geometry, material);
	bulbs.name = "noel-ampoules";
	bulbs.renderOrder = 2;
	bulbs.raycast = NO_RAYCAST;
	return bulbs;
}

/* --------------------------------------------------------------- NEIGE */

const snowVertex = /* glsl */ `
uniform float uTime;
uniform float uScale;
attribute vec4 aFlake; // phase, vitesse de chute, balancement, taille
attribute vec2 aFall;  // bas du volume, hauteur
varying float vAlpha;
void main() {
	vec3 p = position;
	float fall = mod(p.y - aFall.x - uTime * aFlake.y, aFall.y);
	p.y = aFall.x + fall;
	p.x += sin(uTime * 0.6 * aFlake.z + aFlake.x) * 0.22;
	p.z += cos(uTime * 0.45 * aFlake.z + aFlake.x * 1.7) * 0.22;
	vec4 mv = modelViewMatrix * vec4(p, 1.0);
	float depth = max(-mv.z, 0.05);
	// apparaît en haut, s'efface en bas, et pas de gros flocon collé à la caméra
	vAlpha = smoothstep(0.0, 0.5, fall) * smoothstep(aFall.y, aFall.y - 0.7, fall) * smoothstep(0.6, 1.8, depth);
	gl_PointSize = min(aFlake.w * uScale / depth, 16.0);
	gl_Position = projectionMatrix * mv;
}`;

const snowFragment = /* glsl */ `
uniform float uNight;
varying float vAlpha;
void main() {
	vec2 p = gl_PointCoord * 2.0 - 1.0;
	float d = dot(p, p);
	if (d > 1.0) discard;
	float a = pow(1.0 - d, 1.6) * vAlpha * mix(0.95, 0.75, uNight);
	gl_FragColor = vec4(mix(vec3(1.0), vec3(0.78, 0.84, 1.0), uNight), a);
	#include <colorspace_fragment>
}`;

type SnowVolume = { box: Box; count: number; size: number; speed: number };

function buildSnow(volumes: SnowVolume[]) {
	const positions: number[] = [];
	const flakes: number[] = [];
	const falls: number[] = [];
	for (const { box, count, size, speed } of volumes) {
		const height = box.max[1] - box.min[1];
		for (let i = 0; i < count; i++) {
			positions.push(
				THREE.MathUtils.lerp(box.min[0], box.max[0], Math.random()),
				THREE.MathUtils.lerp(box.min[1], box.max[1], Math.random()),
				THREE.MathUtils.lerp(box.min[2], box.max[2], Math.random()),
			);
			flakes.push(Math.random() * Math.PI * 2, speed * (0.7 + Math.random() * 0.6), 0.6 + Math.random() * 0.8, size * (0.6 + Math.random() * 0.8));
			falls.push(box.min[1], height);
		}
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("aFlake", new THREE.Float32BufferAttribute(flakes, 4));
	geometry.setAttribute("aFall", new THREE.Float32BufferAttribute(falls, 2));
	geometry.computeBoundingSphere();
	if (geometry.boundingSphere) geometry.boundingSphere.radius += 1;
	const material = new THREE.ShaderMaterial({
		uniforms: { uTime: { value: 0 }, uScale: { value: 400 }, uNight: { value: 0 } },
		vertexShader: snowVertex,
		fragmentShader: snowFragment,
		transparent: true,
		depthWrite: false,
	});
	const snow = new THREE.Points(geometry, material);
	snow.name = "noel-neige";
	snow.renderOrder = 3;
	snow.raycast = NO_RAYCAST;
	return snow;
}

/* --------------------------------------------------------------- DÉCOR */

interface Decor {
	root: THREE.Group;
	bulbs: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
	star: THREE.Mesh | null;
	starMaterial: THREE.MeshStandardMaterial | null;
	swings: { node: THREE.Object3D; phase: number; speed: number; spin: number }[];
	dispose: () => void;
}

/**
 * Prépare le décor à partir du .glb (sans le modifier : il est en cache).
 * Les objets fixes sont fusionnés par matériau (3 appels de dessin pour
 * tout le décor) ; l'étoile et les suspensions restent à part pour bouger.
 */
function buildDecor(gltfScene: THREE.Object3D): Decor {
	gltfScene.updateMatrixWorld(true);
	const root = new THREE.Group();
	root.name = "noel";
	const lightSources: THREE.Points[] = [];
	const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
	const owned: { dispose: () => void }[] = [];
	const swings: Decor["swings"] = [];
	let star: THREE.Mesh | null = null;
	let starMaterial: THREE.MeshStandardMaterial | null = null;

	gltfScene.traverse((child) => {
		if ((child as THREE.Points).isPoints) {
			if (child.name.startsWith("Lumieres")) lightSources.push(child as THREE.Points);
			return;
		}
		const mesh = child as THREE.Mesh;
		if (!mesh.isMesh) return;
		if (mesh.name.startsWith("Etoile")) {
			star = mesh.clone();
			star.matrixAutoUpdate = true;
			mesh.matrixWorld.decompose(star.position, star.quaternion, star.scale);
			const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
			starMaterial = material.clone();
			star.material = starMaterial;
			owned.push(starMaterial);
			star.raycast = NO_RAYCAST;
			root.add(star);
			return;
		}
		if (mesh.name.startsWith("Suspension")) {
			const node = mesh.clone();
			mesh.matrixWorld.decompose(node.position, node.quaternion, node.scale);
			/// Tourne d'abord sur sa ficelle, puis se balance
			node.rotation.order = "XZY";
			node.raycast = NO_RAYCAST;
			root.add(node);
			swings.push({
				node,
				phase: Math.random() * Math.PI * 2,
				speed: SWAY.speed * (0.8 + Math.random() * 0.45),
				spin: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.3),
			});
			return;
		}
		const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
		if (materials.length !== 1) {
			const copy = mesh.clone();
			mesh.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
			copy.raycast = NO_RAYCAST;
			root.add(copy);
			return;
		}
		const geometry = mesh.geometry.clone();
		geometry.applyMatrix4(mesh.matrixWorld);
		const list = byMaterial.get(materials[0]) ?? [];
		list.push(geometry);
		byMaterial.set(materials[0], list);
	});

	for (const [material, geometries] of byMaterial) {
		const merged = geometries.length > 1 ? mergeGeometries(geometries, false) : geometries[0];
		if (merged) {
			const mesh = new THREE.Mesh(merged, material);
			mesh.raycast = NO_RAYCAST;
			root.add(mesh);
			owned.push(merged);
			if (merged !== geometries[0]) geometries.forEach((g) => g.dispose());
		} else {
			/// Attributs différents d'un objet à l'autre : on garde les morceaux
			for (const geometry of geometries) {
				const mesh = new THREE.Mesh(geometry, material);
				mesh.raycast = NO_RAYCAST;
				root.add(mesh);
				owned.push(geometry);
			}
		}
	}

	const bulbs = buildBulbs(lightSources, star) as Decor["bulbs"];
	root.add(bulbs);
	owned.push(bulbs.geometry, bulbs.material);

	return {
		root,
		bulbs,
		star,
		starMaterial,
		swings,
		dispose: () => owned.forEach((item) => item.dispose()),
	};
}

/* ----------------------------------------------------------- COMPOSANT */

interface ChristmasDecorProps {
	/** Ambiance jour / nuit de la salle (0 = jour, 1 = nuit) */
	mix: { value: number };
	/** Même place que la salle (cf. <Classroom>) */
	position: [number, number, number];
	/** Mouvements réduits : lumières allumées sans scintiller, pas de neige qui tombe */
	animated: boolean;
}

const ChristmasDecorScene: React.FC<ChristmasDecorProps> = ({ mix, position, animated }) => {
	const { scene } = useGLTF(CHRISTMAS_DECOR.model);
	const decor = useMemo(() => buildDecor(scene), [scene]);
	useEffect(() => () => decor.dispose(), [decor]);

	const twinkle = animated && CHRISTMAS_DECOR.twinkle;
	const snow = useMemo(() => {
		if (!animated) return null;
		const volumes: SnowVolume[] = [];
		if (CHRISTMAS_DECOR.snowIndoors) volumes.push(SNOW.indoors);
		if (CHRISTMAS_DECOR.snowOutdoors) volumes.push(SNOW.windows, SNOW.garden);
		return volumes.length ? buildSnow(volumes) : null;
	}, [animated]);
	useEffect(
		() => () => {
			snow?.geometry.dispose();
			(snow?.material as THREE.Material | undefined)?.dispose();
		},
		[snow],
	);

	const ground = useRef<THREE.MeshBasicMaterial>(null);
	const groundColors = useMemo(() => [new THREE.Color(SNOW_GROUND.day), new THREE.Color(SNOW_GROUND.night)] as const, []);
	const starIntensity = useRef<number | null>(null);
	const time = useRef(0);

	useFrame((state, delta) => {
		const dt = Math.min(delta, 0.1);
		if (animated) time.current += dt;
		const t = time.current;
		const night = mix.value;
		/// Pixels à l'écran pour une unité 3D à une unité de distance
		const camera = state.camera as THREE.PerspectiveCamera;
		const scale = (state.size.height * state.gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov ?? 60) / 2));

		const bulbs = decor.bulbs.material.uniforms;
		bulbs.uTime.value = t;
		bulbs.uScale.value = scale;
		bulbs.uNight.value = night;
		bulbs.uTwinkle.value = twinkle ? 1 : 0;

		if (snow) {
			const uniforms = (snow.material as THREE.ShaderMaterial).uniforms;
			uniforms.uTime.value = t;
			uniforms.uScale.value = scale;
			uniforms.uNight.value = night;
		}
		if (ground.current) ground.current.color.lerpColors(groundColors[0], groundColors[1], night * 0.9);

		if (!animated) return;
		if (decor.star) decor.star.rotation.y += dt * 0.6;
		if (decor.starMaterial) {
			if (starIntensity.current === null) starIntensity.current = decor.starMaterial.emissiveIntensity;
			decor.starMaterial.emissiveIntensity = starIntensity.current * (1 + 0.22 * Math.sin(t * 2.2));
		}
		for (const swing of decor.swings) {
			const a = t * swing.speed + swing.phase;
			swing.node.rotation.x = SWAY.amplitude * Math.sin(a);
			swing.node.rotation.z = SWAY.amplitude * 0.7 * Math.sin(a * 0.83 + 1.3);
			swing.node.rotation.y = t * swing.spin + swing.phase;
		}
	});

	return (
		<group position={position}>
			<primitive object={decor.root} />
			{snow && <primitive object={snow} />}
			{CHRISTMAS_DECOR.snowOutdoors && (
				<mesh
					rotation-x={-Math.PI / 2}
					position={[
						(SNOW_GROUND.x[0] + SNOW_GROUND.x[1]) / 2,
						SNOW_GROUND.y,
						(SNOW_GROUND.z[0] + SNOW_GROUND.z[1]) / 2,
					]}
					raycast={NO_RAYCAST}
				>
					<planeGeometry args={[SNOW_GROUND.x[1] - SNOW_GROUND.x[0], SNOW_GROUND.z[1] - SNOW_GROUND.z[0]]} />
					<meshBasicMaterial ref={ground} color={SNOW_GROUND.day} toneMapped={false} />
				</mesh>
			)}
		</group>
	);
};

/// Fichier de déco absent ou illisible : la salle reste telle quelle, au lieu
/// de faire tomber toute la scène 3D
class ChristmasDecorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error: unknown) {
		console.warn("[classroom] déco de Noël indisponible, la salle reste sans déco", error);
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

const ChristmasDecor: React.FC<ChristmasDecorProps> = (props) => (
	<ChristmasDecorBoundary>
		<ChristmasDecorScene {...props} />
	</ChristmasDecorBoundary>
);

export default ChristmasDecor;
