import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot, extend, type ReconcilerRoot } from "@react-three/fiber";
import * as THREE from "three";
import { DuelMiloLights, MiloModel, type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import {
	DUEL_MILO_CAMERA_DISTANCE,
	DUEL_MILO_FIT_HEIGHT,
	DUEL_MILO_FOCUS_Y,
	DUEL_MILO_FOV,
} from "@features/duels/utils/duelMiloFrame";
import { cameraDistanceFor } from "@features/my-milo/utils/miloModel";
import { isWebGLAvailable } from "@shared/utils/webgl";

/// Milo 3D PERSISTANT : une scène par « canal », créée une fois puis déplacée
/// d'un endroit à l'autre de la page.
///
/// Créer une scène 3D (contexte WebGL, copie du modèle, shaders) fige l'écran
/// un instant. Ici, chaque canal (les cartes d'amis, la bulle de Milo…) crée
/// la sienne une seule fois ; sa toile passe ensuite d'un hôte à l'autre :
/// changer de tenue ne coûte presque rien, réafficher Milo est immédiat.
/// Sans hôte, la scène est mise en pause (aucun rendu) mais reste prête.
/// Deux canaux peuvent être affichés en même temps (carte d'ami + bulle).

extend(THREE as unknown as Parameters<typeof extend>[0]);

export type SharedMiloChannel = "friends" | "buddy" | "shop";
type Facing = "left" | "right" | "front";

interface Shared {
	wrapper: HTMLDivElement;
	root: ReconcilerRoot<HTMLCanvasElement>;
	/** Hôte qui affiche la toile en ce moment */
	host: HTMLElement | null;
	size: { width: number; height: number; top: number; left: number };
	/** Le modèle est chargé, cadré et ses shaders compilés */
	modelReady: boolean;
	/** Prévenu une fois le modèle prêt (premier affichage) */
	onModelReady: (() => void) | null;
	/** Prévenu quand Milo commence ou finit une animation ponctuelle */
	onBusy: ((busy: boolean) => void) | null;
	/** Fonctions stables passées au modèle (il relance son chargement si elles changent) */
	handleReady: () => void;
	handleBusy: (busy: boolean) => void;
}

const scenes = new Map<SharedMiloChannel, Shared>();

const getShared = (channel: SharedMiloChannel): Shared => {
	const existing = scenes.get(channel);
	if (existing) return existing;
	const wrapper = document.createElement("div");
	wrapper.style.cssText = "position:absolute;inset:0;";
	const canvas = document.createElement("canvas");
	canvas.style.cssText = "display:block;width:100%;height:100%;";
	wrapper.appendChild(canvas);
	const created: Shared = {
		wrapper,
		root: createRoot(canvas),
		host: null,
		size: { width: 1, height: 1, top: 0, left: 0 },
		modelReady: false,
		onModelReady: null,
		onBusy: null,
		handleReady: () => {
			created.modelReady = true;
			created.onModelReady?.();
		},
		handleBusy: (busy) => created.onBusy?.(busy),
	};
	scenes.set(channel, created);
	return created;
};

/// Réglages constants : R3F compare ce qu'on lui repasse à chaque mise à
/// jour, et un nouvel objet caméra recréerait la caméra (Milo serait recadré
/// et ses shaders recompilés à chaque mise à jour)
/// Cadrages : le haut du corps (cartes d'amis, bulle), ou Milo en entier,
/// de la pointe du chapeau aux chaussures (cabine d'essayage de la boutique)
const FULL_FRAME_TOP = DUEL_MILO_FIT_HEIGHT / 2 + 0.4;
const FULL_FRAME_BOTTOM = -DUEL_MILO_FIT_HEIGHT / 2 - 0.15;
const FRAMINGS = {
	bust: {
		camera: { position: [0, 0, DUEL_MILO_CAMERA_DISTANCE] as [number, number, number], fov: DUEL_MILO_FOV },
		focusY: DUEL_MILO_FOCUS_Y,
	},
	full: {
		camera: {
			position: [0, 0, cameraDistanceFor(FULL_FRAME_TOP - FULL_FRAME_BOTTOM, DUEL_MILO_FOV)] as [number, number, number],
			fov: DUEL_MILO_FOV,
		},
		focusY: (FULL_FRAME_TOP + FULL_FRAME_BOTTOM) / 2,
	},
};
const CHANNEL_FRAMING: Record<SharedMiloChannel, keyof typeof FRAMINGS> = { friends: "bust", buddy: "bust", shop: "full" };
const DPR: [number, number] = [1, 1.5];
const GL = { alpha: true, antialias: true, powerPreference: "high-performance" as const };

interface SceneProps {
	equippedMeshNames: string[];
	dance: DuelDance | null;
	facing: Facing;
	spinRef?: { current: number };
}

/** Configure la scène (taille, boucle de rendu) et y rend Milo avec ces props */
async function renderShared(channel: SharedMiloChannel, props: SceneProps, paused = false) {
	const s = getShared(channel);
	const framing = FRAMINGS[CHANNEL_FRAMING[channel]];
	await s.root.configure({
		size: s.size,
		dpr: DPR,
		frameloop: paused ? "never" : "always",
		camera: framing.camera,
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
					facing={props.facing}
					focusY={framing.focusY}
					spinRef={props.spinRef}
					onReady={s.handleReady}
					onBusyChange={s.handleBusy}
				/>
			</Suspense>
		</>,
	);
}

interface SharedMilo3DProps {
	channel: SharedMiloChannel;
	equippedMeshNames: string[];
	/// Animation à jouer une fois (son numéro doit toujours croître : la scène
	/// persiste, un numéro déjà vu serait ignoré)
	dance: DuelDance | null;
	facing?: Facing;
	/// Milo est affiché ICI, avec la bonne tenue
	onReady?: () => void;
	/// Milo commence (true) ou finit (false) une animation ponctuelle
	onBusyChange?: (busy: boolean) => void;
	/// Rotation ajoutée (radians), lue à chaque image : pour tourner Milo à la souris
	spinRef?: { current: number };
	/// Attente avant de créer la scène, la toute première fois (la création
	/// fige l'écran un instant : mieux vaut qu'elle suive une animation d'arrivée)
	firstMountDelayMs?: number;
	className?: string;
}

const SharedMilo3D: React.FC<SharedMilo3DProps> = ({
	channel,
	equippedMeshNames,
	dance,
	facing = "right",
	onReady,
	onBusyChange,
	spinRef,
	firstMountDelayMs = 0,
	className = "",
}) => {
	const hostRef = useRef<HTMLDivElement>(null);
	const [attached, setAttached] = useState(false);
	const [ready, setReady] = useState(false);
	const latest = useRef({ equippedMeshNames, dance, facing, spinRef, onReady, onBusyChange });
	useLayoutEffect(() => {
		latest.current = { equippedMeshNames, dance, facing, spinRef, onReady, onBusyChange };
	});

	/// Accroche la toile du canal à cet hôte (après l'attente, la première fois)
	useLayoutEffect(() => {
		const host = hostRef.current;
		if (!host || !isWebGLAvailable()) return;
		const s = getShared(channel);
		let resize: ResizeObserver | null = null;
		let frame = 0;
		const firstTime = !s.modelReady && !s.host;
		const attach = () => {
			s.host = host;
			s.onBusy = (busy) => latest.current.onBusyChange?.(busy);
			host.appendChild(s.wrapper);
			const measure = () => {
				const rect = host.getBoundingClientRect();
				if (rect.width < 1 || rect.height < 1) return;
				s.size = { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
				void renderShared(channel, latest.current);
			};
			resize = new ResizeObserver(measure);
			resize.observe(host);
			measure();
			setAttached(true);
			/// Prête : on laisse passer deux images (la nouvelle tenue est dessinée)
			/// avant d'afficher la toile, sinon on verrait un instant l'ancienne
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
			/// Un autre hôte a déjà repris la toile : on ne la lui retire pas
			if (s.host === host) {
				s.host = null;
				s.onModelReady = null;
				s.onBusy = null;
				s.wrapper.remove();
				void renderShared(channel, latest.current, true);
			}
		};
	}, [channel, firstMountDelayMs]);

	/// Nouvelle tenue, nouvelle animation : la scène est rendue à nouveau
	useEffect(() => {
		if (!attached || getShared(channel).host !== hostRef.current) return;
		void renderShared(channel, { equippedMeshNames, dance, facing, spinRef });
	}, [attached, channel, equippedMeshNames, dance, facing, spinRef]);

	return <div ref={hostRef} className={`duel-milo-3d${ready ? " is-ready" : ""} ${className}`.trim()} aria-hidden="true" />;
};

export default SharedMilo3D;
