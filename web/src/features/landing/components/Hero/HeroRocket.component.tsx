import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { heroState } from "@features/landing/lib/heroState";

/// Fusée du hero : le socle de Milo se transforme en étage de fusée pendant
/// la sortie du hero (heroState.launch, piloté par la timeline GSAP).
/// 0 → 0.3 : les ailerons et la tuyère sortent, les flammes s'allument, la
/// fusée tremble et s'élève un peu. 0.3 → 1 : envol (le DOM emporte ensuite
/// toute la toile vers le haut, la 3D n'a qu'à rester dans son cadre).

const COLORS = {
	milo: "#FF541D",
	braise: "#C73A0C",
	creme: "#F6EBDF",
	nozzle: "#4A3428",
	pompon: "#FCB218",
	flame: "#FF7A2E",
};

/// Bas du socle (cf. Pedestal dans HeroToys : y = -1.18, hauteur 0.2)
const BASE_Y = -1.28;
/// Élévation maximale pendant l'allumage : la toile coupe au-delà
const HOVER = 0.2;
const FINS = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => angle + Math.PI / 6);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
/// Petit dépassement à la sortie des ailerons (back.out)
const backOut = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/// Flamme : cône pointé vers le bas, couleur pleine et additive (sans éclairage)
const FlameCone: React.FC<{ radius: number; height: number; color: string; opacity: number }> = ({ radius, height, color, opacity }) => (
	<mesh position={[0, -height / 2, 0]} rotation={[Math.PI, 0, 0]}>
		<coneGeometry args={[radius, height, 24, 1, true]} />
		<meshBasicMaterial
			color={color}
			transparent
			opacity={opacity}
			blending={THREE.AdditiveBlending}
			depthWrite={false}
			side={THREE.DoubleSide}
			toneMapped={false}
		/>
	</mesh>
);

interface LaunchRigProps {
	reducedMotion: boolean;
	children: React.ReactNode;
}

const LaunchRig: React.FC<LaunchRigProps> = ({ reducedMotion, children }) => {
	const rig = useRef<THREE.Group>(null);
	const booster = useRef<THREE.Group>(null);
	const flames = useRef<THREE.Group>(null);
	const light = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		if (!rig.current || !booster.current || !flames.current || !light.current) return;
		const launch = reducedMotion ? 0 : heroState.launch;

		// Au repos : rien à calculer, la fusée reste rangée
		if (launch <= 0.0001) {
			rig.current.position.set(0, 0, 0);
			rig.current.rotation.z = 0;
			booster.current.visible = false;
			flames.current.visible = false;
			light.current.intensity = 0;
			return;
		}

		const ignite = clamp01(launch / 0.3);
		const lift = clamp01((launch - 0.3) / 0.7);
		const t = state.clock.elapsedTime;

		// Grondement : fort à l'allumage, plus léger une fois lancée
		const rumble = (ignite * (1 - lift) * 0.014 + lift * 0.006) * (reducedMotion ? 0 : 1);
		rig.current.position.set(
			Math.sin(t * 61) * rumble,
			smooth(ignite) * HOVER * 0.75 + smooth(lift) * HOVER * 0.25,
			0,
		);
		rig.current.rotation.z = Math.sin(t * 47) * rumble * 1.6;

		booster.current.visible = true;
		booster.current.scale.setScalar(Math.max(0.001, backOut(clamp01(ignite * 1.6))));

		const flicker = 1 + Math.sin(t * 43) * 0.08 + Math.sin(t * 71) * 0.05;
		const power = smooth(clamp01((ignite - 0.25) / 0.75));
		flames.current.visible = power > 0.01;
		flames.current.scale.set(power * (1 + Math.sin(t * 37) * 0.05), power * flicker * (1 + lift * 0.1), power);
		light.current.intensity = power * 5 * flicker;
	});

	return (
		<group ref={rig}>
			{children}

			<group ref={booster} position={[0, BASE_Y, 0]} visible={false}>
				{/* Tuyère */}
				<mesh position={[0, -0.08, 0]}>
					<cylinderGeometry args={[0.32, 0.42, 0.16, 48]} />
					<meshPhysicalMaterial color={COLORS.nozzle} metalness={0.6} roughness={0.35} clearcoat={0.5} />
				</mesh>
				<mesh position={[0, -0.165, 0]} rotation={[Math.PI / 2, 0, 0]}>
					<torusGeometry args={[0.42, 0.025, 12, 64]} />
					<meshPhysicalMaterial color={COLORS.braise} roughness={0.4} clearcoat={0.8} />
				</mesh>
				{/* Ailerons */}
				{FINS.map((angle) => (
					<group key={angle} rotation={[0, angle, 0]}>
						<mesh position={[0.86, -0.06, 0]} rotation={[0, 0, -0.35]}>
							<boxGeometry args={[0.2, 0.34, 0.06]} />
							<meshPhysicalMaterial color={COLORS.milo} roughness={0.38} clearcoat={0.8} clearcoatRoughness={0.25} />
						</mesh>
					</group>
				))}
			</group>

			{/* Flammes et lueur sous la tuyère */}
			<group ref={flames} position={[0, BASE_Y - 0.16, 0]} visible={false}>
				<FlameCone radius={0.3} height={0.3} color={COLORS.flame} opacity={0.75} />
				<FlameCone radius={0.21} height={0.22} color={COLORS.pompon} opacity={0.85} />
				<FlameCone radius={0.11} height={0.13} color="#FFF6D6" opacity={0.95} />
			</group>
			<pointLight ref={light} position={[0, BASE_Y - 0.25, 0.6]} color={COLORS.flame} intensity={0} distance={3.5} decay={1.6} />
		</group>
	);
};

export default LaunchRig;
