import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cameraDistanceFor } from "@features/my-milo/utils/miloModel";
import HeroMilo from "@features/landing/components/Hero/HeroMilo.component";
import HeroToys, { Pedestal } from "@features/landing/components/Hero/HeroToys.component";
import { heroState } from "@features/landing/lib/heroState";

/// Focale et cadrage : la toile déborde du cadre (136 % × 120 %), on cadre
/// donc plus large pour que Milo garde sa taille et que les jouets respirent.
const CAMERA_FOV = 24;
const FRAME_HEIGHT = 3.3;
const CAMERA_DISTANCE = cameraDistanceFor(FRAME_HEIGHT, CAMERA_FOV);

/// Reflets doux sur les jouets vernis, sans charger de fichier HDR
const StudioEnvironment: React.FC = () => {
	const { gl, scene } = useThree();
	useEffect(() => {
		const pmrem = new THREE.PMREMGenerator(gl);
		const room = new RoomEnvironment();
		const target = pmrem.fromScene(room, 0.04);
		scene.environment = target.texture;
		scene.environmentIntensity = 0.55;
		return () => {
			scene.environment = null;
			target.dispose();
			room.dispose();
			pmrem.dispose();
		};
	}, [gl, scene]);
	return null;
};

/// Légère inclinaison de toute la scène selon la souris
const SceneRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const ref = useRef<THREE.Group>(null);
	useFrame(() => {
		if (!ref.current) return;
		ref.current.rotation.x += (heroState.pointerY * 0.08 - ref.current.rotation.x) * 0.05;
	});
	return <group ref={ref}>{children}</group>;
};

interface HeroScene3DProps {
	reducedMotion: boolean;
	onReady: () => void;
}

const HeroScene3D: React.FC<HeroScene3DProps> = ({ reducedMotion, onReady }) => {
	const wrapper = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(true);

	// La scène ne tourne que lorsqu'elle est à l'écran
	useEffect(() => {
		const el = wrapper.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={wrapper} className="lp-hero__canvas" aria-hidden="true">
			<Canvas
				frameloop={visible ? "always" : "never"}
				dpr={[1, 2]}
				camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
				gl={{ alpha: true, antialias: true }}
				onPointerMissed={() => (document.body.style.cursor = "")}
			>
				<StudioEnvironment />
				<ambientLight intensity={1.3} color="#fff1e2" />
				<hemisphereLight args={["#ffffff", "#c4693a", 0.6]} />
				<directionalLight position={[3, 5, 4]} intensity={2.2} color="#fffaf3" />
				<directionalLight position={[-4, 2, 2]} intensity={0.7} color="#ffd9b8" />
				<SceneRoot>
					<Suspense fallback={null}>
						<HeroMilo reducedMotion={reducedMotion} onReady={onReady} />
					</Suspense>
					<Pedestal />
					<HeroToys reducedMotion={reducedMotion} />
				</SceneRoot>
			</Canvas>
		</div>
	);
};

export default HeroScene3D;
