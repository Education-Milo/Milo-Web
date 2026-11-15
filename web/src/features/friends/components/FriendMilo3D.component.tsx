import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot, extend, type ReconcilerRoot } from "@react-three/fiber";
import * as THREE from "three";
import { DuelMiloLights, MiloModel, type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import { DUEL_MILO_CAMERA_DISTANCE, DUEL_MILO_FOV } from "@features/duels/utils/duelMiloFrame";
import { isWebGLAvailable } from "@shared/utils/webgl";

/// Milo 3D des cartes d'amis : UNE seule scène pour toutes les cartes.
///
/// Créer une scène 3D (contexte WebGL, copie du modèle, shaders) fige l'écran
/// un instant. Ici elle est créée une fois, à la première carte ouverte, puis
/// sa toile passe d'une carte à l'autre : changer d'ami ne fait que changer
/// la tenue de Milo, et rouvrir une carte est immédiat. Fermée, la scène est
/// mise en pause (aucun rendu) mais reste prête.

extend(THREE as unknown as Parameters<typeof extend>[0]);

interface Shared {
	wrapper: HTMLDivElement;
	root: ReconcilerRoot<HTMLCanvasElement>;
	/** Hôte (carte) qui affiche la toile en ce moment */
	host: HTMLElement | null;
	size: { width: number; height: number; top: number; left: number };
	/** Le modèle est chargé, cadré et ses shaders compilés */
	modelReady: boolean;
	/** Prévenu une fois le modèle prêt (premier affichage) */
	onModelReady: (() => void) | null;
}

let shared: Shared | null = null;

const getShared = (): Shared => {
	if (shared) return shared;
	const wrapper = document.createElement("div");
	wrapper.style.cssText = "position:absolute;inset:0;";
	const canvas = document.createElement("canvas");
	canvas.style.cssText = "display:block;width:100%;height:100%;";
	wrapper.appendChild(canvas);
	shared = {
		wrapper,
		root: createRoot(canvas),
		host: null,
		size: { width: 1, height: 1, top: 0, left: 0 },
		modelReady: false,
		onModelReady: null,
	};
	return shared;
};

/// (fonction stable : MiloModel relance son chargement si elle change)
const handleModelReady = () => {
	if (!shared) return;
	shared.modelReady = true;
	shared.onModelReady?.();
};

/// Réglages constants : R3F compare ce qu'on lui repasse à chaque mise à
/// jour, et un nouvel objet caméra recréerait la caméra (Milo serait recadré
/// et ses shaders recompilés à chaque changement d'ami)
const CAMERA = { position: [0, 0, DUEL_MILO_CAMERA_DISTANCE] as [number, number, number], fov: DUEL_MILO_FOV };
const DPR: [number, number] = [1, 1.5];
const GL = { alpha: true, antialias: true, powerPreference: "high-performance" as const };

/** Configure la scène (taille, boucle de rendu) et y rend Milo avec ces props */
async function renderShared(props: { equippedMeshNames: string[]; dance: DuelDance | null }, paused = false) {
	const s = getShared();
	await s.root.configure({
		size: s.size,
		dpr: DPR,
		frameloop: paused ? "never" : "always",
		camera: CAMERA,
		gl: GL,
	});
	if (paused) return;
	s.root.render(
		<>
			<DuelMiloLights />
			<Suspense fallback={null}>
				<MiloModel
					equippedMeshNames={props.equippedMeshNames}
					state="waiting"
					dance={props.dance}
					facing="right"
					onReady={handleModelReady}
				/>
			</Suspense>
		</>,
	);
}

interface FriendMilo3DProps {
	equippedMeshNames: string[];
	dance: DuelDance | null;
	/// Milo est affiché sur CETTE carte, avec la bonne tenue
	onReady?: () => void;
	/// Attente avant de créer la scène, la toute première fois (la création
	/// fige l'écran un instant : mieux vaut qu'elle suive l'animation d'arrivée)
	firstMountDelayMs?: number;
	className?: string;
}

const FriendMilo3D: React.FC<FriendMilo3DProps> = ({
	equippedMeshNames,
	dance,
	onReady,
	firstMountDelayMs = 0,
	className = "",
}) => {
	const hostRef = useRef<HTMLDivElement>(null);
	const [attached, setAttached] = useState(false);
	const [ready, setReady] = useState(false);
	const latest = useRef({ equippedMeshNames, dance, onReady });
	useLayoutEffect(() => {
		latest.current = { equippedMeshNames, dance, onReady };
	});

	/// Accroche la toile partagée à cette carte (après l'attente, la première fois)
	useLayoutEffect(() => {
		const host = hostRef.current;
		if (!host || !isWebGLAvailable()) return;
		const s = getShared();
		let resize: ResizeObserver | null = null;
		let frame = 0;
		const firstTime = !s.modelReady && !s.host;
		const attach = () => {
			s.host = host;
			host.appendChild(s.wrapper);
			const measure = () => {
				const rect = host.getBoundingClientRect();
				if (rect.width < 1 || rect.height < 1) return;
				s.size = { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
				void renderShared(latest.current);
			};
			resize = new ResizeObserver(measure);
			resize.observe(host);
			measure();
			setAttached(true);
			/// Prête : on laisse passer deux images (la nouvelle tenue est dessinée)
			/// avant d'afficher la toile, sinon on verrait un instant l'ami précédent
			const reveal = () => {
				frame = requestAnimationFrame(() => {
					frame = requestAnimationFrame(() => {
						setReady(true);
						latest.current.onReady?.();
					});
				});
			};
			if (s.modelReady) reveal();
			else s.onModelReady = reveal;
		};
		const delay = firstTime ? firstMountDelayMs : 0;
		const timer = delay > 0 ? window.setTimeout(attach, delay) : 0;
		if (!timer) attach();
		return () => {
			window.clearTimeout(timer);
			cancelAnimationFrame(frame);
			resize?.disconnect();
			if (s.onModelReady && s.host === host) s.onModelReady = null;
			/// Une autre carte a déjà repris la toile (passage d'un ami à l'autre) :
			/// on ne la lui retire pas
			if (s.host === host) {
				s.host = null;
				s.wrapper.remove();
				void renderShared(latest.current, true);
			}
		};
	}, [firstMountDelayMs]);

	/// Nouvelle tenue, nouvelle danse : la scène est rendue à nouveau
	useEffect(() => {
		if (!attached || getShared().host !== hostRef.current) return;
		void renderShared({ equippedMeshNames, dance });
	}, [attached, equippedMeshNames, dance]);

	return <div ref={hostRef} className={`duel-milo-3d${ready ? " is-ready" : ""} ${className}`.trim()} aria-hidden="true" />;
};

export default FriendMilo3D;
