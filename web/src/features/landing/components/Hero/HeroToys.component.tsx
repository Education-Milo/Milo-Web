import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { heroState } from "@features/landing/lib/heroState";

/// Jouets 3D procéduraux qui flottent autour de Milo (palette de la charte).
/// Ils suivent la souris, tournent plus vite au survol et s'écartent quand
/// on quitte le hero (heroState.progress).

const C = {
	creme: "#F6EBDF",
	sable: "#F1D2B2",
	mandarine: "#F4922A",
	orange: "#F36B16",
	milo: "#FF541D",
	vermillon: "#ED3C1D",
	ink: "#2A1A10",
	gold: "#F7A928",
	goldLight: "#FFC24A",
};

/// Matériau "jouet" : plastique verni
type ToyProps = { color: string; attach?: string } & Partial<THREE.MeshPhysicalMaterialParameters>;

const Toy: React.FC<ToyProps> = ({ color, ...rest }) => (
	<meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.8} clearcoatRoughness={0.25} {...rest} />
);

function useStarGeometry(outer = 0.2, inner = 0.09, depth = 0.08) {
	return useMemo(() => {
		const shape = new THREE.Shape();
		for (let i = 0; i < 10; i++) {
			const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
			const radius = i % 2 ? inner : outer;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			if (i) shape.lineTo(x, y);
			else shape.moveTo(x, y);
		}
		const geometry = new THREE.ExtrudeGeometry(shape, {
			depth,
			bevelEnabled: true,
			bevelThickness: 0.03,
			bevelSize: 0.025,
			bevelSegments: 4,
		});
		geometry.center();
		return geometry;
	}, [outer, inner, depth]);
}

const Star: React.FC = () => {
	const geometry = useStarGeometry();
	return (
		<mesh geometry={geometry}>
			<Toy color={C.mandarine} />
		</mesh>
	);
};

const Coin: React.FC = () => {
	const star = useStarGeometry(0.08, 0.035, 0.02);
	return (
		<group rotation={[Math.PI / 2, 0, 0]}>
			<mesh>
				<cylinderGeometry args={[0.2, 0.2, 0.06, 48]} />
				<Toy color={C.gold} metalness={0.55} roughness={0.3} />
			</mesh>
			<mesh>
				<cylinderGeometry args={[0.15, 0.15, 0.07, 48]} />
				<Toy color={C.goldLight} metalness={0.5} roughness={0.28} />
			</mesh>
			<mesh geometry={star} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
				<Toy color={C.milo} />
			</mesh>
		</group>
	);
};

const Pencil: React.FC = () => (
	<group>
		<mesh>
			<cylinderGeometry args={[0.07, 0.07, 0.62, 6]} />
			<Toy color={C.orange} />
		</mesh>
		<mesh position={[0, -0.39, 0]} rotation={[Math.PI, 0, 0]}>
			<coneGeometry args={[0.07, 0.16, 6]} />
			<Toy color={C.sable} clearcoat={0.2} />
		</mesh>
		<mesh position={[0, -0.46, 0]} rotation={[Math.PI, 0, 0]}>
			<coneGeometry args={[0.026, 0.06, 12]} />
			<Toy color={C.ink} />
		</mesh>
		<mesh position={[0, 0.345, 0]}>
			<cylinderGeometry args={[0.072, 0.072, 0.07, 24]} />
			<Toy color="#C9C2B8" metalness={0.8} roughness={0.25} />
		</mesh>
		<mesh position={[0, 0.42, 0]}>
			<cylinderGeometry args={[0.068, 0.068, 0.08, 24]} />
			<Toy color="#F7A6A0" />
		</mesh>
	</group>
);

const Book: React.FC<{ cover: string; y: number; rotation: number }> = ({ cover, y, rotation }) => (
	<group position={[0, y, 0]} rotation={[0, rotation, 0]}>
		<RoundedBox args={[0.62, 0.1, 0.44]} radius={0.03} smoothness={3}>
			<Toy color={cover} />
		</RoundedBox>
		<mesh position={[0.03, 0, 0]}>
			<boxGeometry args={[0.56, 0.075, 0.41]} />
			<Toy color={C.creme} clearcoat={0} roughness={0.8} />
		</mesh>
	</group>
);

const Books: React.FC = () => (
	<group>
		<Book cover={C.vermillon} y={0} rotation={0.1} />
		<Book cover={C.mandarine} y={0.11} rotation={-0.25} />
		<Book cover={C.sable} y={0.22} rotation={0.2} />
	</group>
);

/// Texture d'une lettre en Luckiest Guy (dessinée une fois la police chargée)
function useLetterTexture(letter: string, background: string, color: string) {
	const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
	useEffect(() => {
		let disposed = false;
		let created: THREE.CanvasTexture | null = null;
		document.fonts
			.load('80px "Luckiest Guy"')
			.catch(() => undefined)
			.then(() => {
				if (disposed) return;
				const canvas = document.createElement("canvas");
				canvas.width = canvas.height = 256;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				ctx.fillStyle = background;
				ctx.fillRect(0, 0, 256, 256);
				ctx.fillStyle = color;
				ctx.font = '170px "Luckiest Guy", sans-serif';
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(letter, 128, 146);
				created = new THREE.CanvasTexture(canvas);
				created.colorSpace = THREE.SRGBColorSpace;
				setTexture(created);
			});
		return () => {
			disposed = true;
			created?.dispose();
		};
	}, [letter, background, color]);
	return texture;
}

const LetterBlock: React.FC<{ letter: string; background: string; color: string }> = ({ letter, background, color }) => {
	const map = useLetterTexture(letter, background, color);
	// RoundedBoxGeometry de Three : UV par face (celles du RoundedBox de Drei ne couvrent pas la texture)
	const geometry = useMemo(() => new RoundedBoxGeometry(0.32, 0.32, 0.32, 4, 0.05), []);
	useEffect(() => () => geometry.dispose(), [geometry]);
	return (
		<mesh geometry={geometry}>
			{/* Nouveau matériau quand la texture arrive : un shader compilé sans map l'ignorerait */}
			<Toy key={map ? "textured" : "plain"} color={map ? "#ffffff" : background} map={map ?? undefined} />
		</mesh>
	);
};

const Planet: React.FC = () => (
	<group>
		<mesh>
			<sphereGeometry args={[0.17, 48, 32]} />
			<Toy color={C.sable} />
		</mesh>
		<mesh rotation={[Math.PI / 2.4, 0, 0]}>
			<torusGeometry args={[0.27, 0.025, 16, 64]} />
			<Toy color={C.milo} />
		</mesh>
	</group>
);

/// Socle sur lequel Milo se tient
export const Pedestal: React.FC = () => (
	<group position={[0, -1.18, 0]}>
		<mesh>
			<cylinderGeometry args={[0.82, 0.88, 0.2, 64]} />
			<Toy attach="material-0" color={C.milo} />
			<Toy attach="material-1" color={C.creme} clearcoat={0.3} />
			<Toy attach="material-2" color={C.milo} />
		</mesh>
		<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
			<torusGeometry args={[0.82, 0.022, 12, 96]} />
			<Toy color={C.sable} />
		</mesh>
	</group>
);

interface FloatingToyProps {
	position: [number, number, number];
	spin: [number, number, number];
	rotation?: [number, number, number];
	scale?: number;
	phase: number;
	reducedMotion: boolean;
	children: React.ReactNode;
}

/// Mouvement commun : flottaison, parallaxe souris, écartement au scroll
const FloatingToy: React.FC<FloatingToyProps> = ({ position, spin, rotation, scale = 1, phase, reducedMotion, children }) => {
	const ref = useRef<THREE.Group>(null);
	const boost = useRef(0);
	const intro = useRef(0);

	useFrame((state, delta) => {
		const object = ref.current;
		if (!object) return;
		const dt = Math.min(delta, 0.05);
		const [x, y, z] = position;
		const p = heroState.progress;
		intro.current = Math.min(1, intro.current + dt * 0.9);
		const ease = 1 - Math.pow(1 - intro.current, 3);
		const spread = 1 + p * 1.4;
		const float = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.1 + phase) * 0.07;

		object.position.set(
			x * spread * ease + heroState.pointerX * (0.15 + z * 0.3),
			(y + float) * (1 + p * 0.5) * ease - heroState.pointerY * (0.1 + z * 0.2),
			z + p * 1.5,
		);
		object.scale.setScalar(scale * ease * (1 - p * 0.3));

		boost.current *= 0.96;
		if (!reducedMotion) {
			object.rotation.x += spin[0] * dt * (1 + boost.current * 6);
			object.rotation.y += spin[1] * dt * (1 + boost.current * 6);
			object.rotation.z += spin[2] * dt;
		}
	});

	return (
		<group ref={ref} rotation={rotation} onPointerOver={() => (boost.current = 1)}>
			{children}
		</group>
	);
};

const HeroToys: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
	const common = { reducedMotion };
	return (
		<>
			<FloatingToy {...common} phase={0} position={[-1.25, 0.85, 0.2]} spin={[0.4, 1.2, 0]}>
				<Coin />
			</FloatingToy>
			<FloatingToy {...common} phase={1.3} position={[-1.35, 0.2, 0.4]} spin={[0.2, -1.4, 0]} scale={0.75}>
				<Coin />
			</FloatingToy>
			<FloatingToy {...common} phase={2.6} position={[1.2, 1.0, -0.2]} spin={[0.3, 0.9, 0.2]}>
				<Star />
			</FloatingToy>
			<FloatingToy {...common} phase={3.9} position={[-1.5, -0.5, 0.2]} spin={[0, 0.6, 0.5]} rotation={[0, 0, -0.7]}>
				<Pencil />
			</FloatingToy>
			<FloatingToy {...common} phase={5.2} position={[1.25, -1.0, 0.3]} spin={[0, 0.4, 0]} rotation={[0.3, 0.4, 0.05]}>
				<Books />
			</FloatingToy>
			<FloatingToy {...common} phase={6.5} position={[-1.2, -1.0, 0.45]} spin={[0.5, 0.7, 0.1]}>
				<LetterBlock letter="A" background={C.creme} color={C.milo} />
			</FloatingToy>
			<FloatingToy {...common} phase={7.8} position={[-0.95, -1.2, 0.7]} spin={[-0.4, 0.5, 0.2]} scale={0.75}>
				<LetterBlock letter="B" background={C.milo} color={C.creme} />
			</FloatingToy>
			<FloatingToy {...common} phase={9.1} position={[1.5, 0.25, -0.3]} spin={[0, 0.8, 0]} scale={0.85}>
				<Planet />
			</FloatingToy>
		</>
	);
};

export default HeroToys;
