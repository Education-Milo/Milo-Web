import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
	MILO_MODEL_PATH,
	applyEquippedAccessories,
	findAction,
	fitMiloToHeight,
	prepareMiloScene,
} from "@features/my-milo/utils/miloModel";
import { heroState } from "@features/landing/lib/heroState";

/// Hauteur du corps de Milo en unités monde
export const MILO_FIT_HEIGHT = 2.1;
/// La toque de diplômé, comme sur le logo de la charte
const EQUIPPED = ["diplomhat"];
/// Teinte vert Forêt de la toque (accent de la charte)
const HAT_COLOR = "#2B4520"; // --milo-vert (shared/styles/brand.css)
const HAT_MATERIAL = "black.001";
/// Milo est tourné de trois quarts, vers le texte du hero
const BASE_ROTATION_Y = -0.3;
/// Animations jouées au clic sur Milo
const CLICK_CLIPS = ["Hello", "HatLook", "Explaining", "Thinking"];

interface HeroMiloProps {
	reducedMotion: boolean;
	onReady: () => void;
}

const HeroMilo: React.FC<HeroMiloProps> = ({ reducedMotion, onReady }) => {
	const group = useRef<THREE.Group>(null);
	const pivot = useRef<THREE.Group>(null);
	const { scene: source, animations } = useGLTF(MILO_MODEL_PATH);

	/// Copie dédiée : la scène du .glb est mise en cache et partagée avec les
	/// autres écrans, on ne veut pas leur transmettre la toque ni sa teinte.
	const scene = useMemo(() => {
		const copy = cloneSkinned(source);
		prepareMiloScene(copy);
		copy.getObjectByName("diplomhat")?.traverse((child) => {
			const mesh = child as THREE.Mesh;
			const material = mesh.material as THREE.MeshStandardMaterial | undefined;
			if (mesh.isMesh && material?.name === HAT_MATERIAL) {
				mesh.material = material.clone();
				(mesh.material as THREE.MeshStandardMaterial).color.set(HAT_COLOR);
			}
		});
		return copy;
	}, [source]);

	const { actions, mixer } = useAnimations(animations, group);
	const current = useRef<THREE.AnimationAction | null>(null);
	const drag = useRef<{ x: number; startX: number } | null>(null);
	const spin = useRef(0);

	useLayoutEffect(() => {
		fitMiloToHeight(scene, MILO_FIT_HEIGHT);
		applyEquippedAccessories(scene, EQUIPPED);
	}, [scene]);

	const playOnce = (name: string) => {
		const action = findAction(actions, name);
		if (!action) return;
		action.reset();
		action.setLoop(THREE.LoopOnce, 1);
		action.clampWhenFinished = true;
		action.play();
		if (current.current && current.current !== action) current.current.crossFadeTo(action, 0.35, false);
		current.current = action;
	};

	// "Hello" à l'arrivée, puis "Idle" en boucle après chaque animation
	useEffect(() => {
		const idle = findAction(actions, "Idle");
		const onFinished = (event: { action: THREE.AnimationAction }) => {
			if (!idle || event.action === idle) return;
			idle.reset().play();
			event.action.crossFadeTo(idle, 0.5, false);
			current.current = idle;
		};
		mixer.addEventListener("finished", onFinished);

		if (!reducedMotion && findAction(actions, "Hello")) playOnce("Hello");
		else if (idle) {
			idle.play();
			current.current = idle;
		}
		// useAnimations fait avancer le mixer à chaque frame : on le fige si besoin
		mixer.timeScale = reducedMotion ? 0 : 1;
		mixer.update(0);
		scene.visible = true;
		onReady();

		return () => {
			mixer.removeEventListener("finished", onFinished);
			mixer.stopAllAction();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- lancé une seule fois par scène
	}, [actions, mixer, scene]);

	// Glisser pour faire tourner Milo, cliquer pour une animation
	useEffect(() => {
		const onMove = (e: PointerEvent) => {
			if (!drag.current) return;
			spin.current += (e.clientX - drag.current.x) * 0.012;
			drag.current.x = e.clientX;
		};
		const onUp = (e: PointerEvent) => {
			if (!drag.current) return;
			if (Math.abs(e.clientX - drag.current.startX) < 4) {
				playOnce(CLICK_CLIPS[Math.floor(Math.random() * CLICK_CLIPS.length)]);
			}
			drag.current = null;
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- playOnce lit les actions via la closure courante
	}, [actions]);

	useFrame(() => {
		if (!pivot.current) return;
		if (!drag.current) spin.current *= 0.94;
		const target = BASE_ROTATION_Y + heroState.pointerX * 0.6 + spin.current;
		pivot.current.rotation.y += (target - pivot.current.rotation.y) * 0.08;
	});

	return (
		<group
			ref={pivot}
			position={[0, -0.05, 0]}
			onPointerDown={(e) => {
				e.stopPropagation();
				drag.current = { x: e.clientX, startX: e.clientX };
			}}
			onPointerOver={() => (document.body.style.cursor = "pointer")}
			onPointerOut={() => (document.body.style.cursor = "")}
		>
			<group ref={group}>
				<primitive object={scene} />
			</group>
		</group>
	);
};

useGLTF.preload(MILO_MODEL_PATH);

export default HeroMilo;
