import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
	arrivalParking as parking,
	frameStep,
	type MiloSchoolBridge,
} from "@features/home/components/miloSchool/miloSchool.bridge";

/// Arrivée de l'accueil : à chaque visite, la scène entre par la droite.
/// La maison d'abord, puis le jardin, la pancarte, le réverbère, la boîte aux
/// lettres, et Milo en dernier, qui salue en arrivant. Chacun file vers la
/// gauche, dépasse un peu sa place en freinant et y revient ; les objets
/// plantés dans l'herbe se penchent dans la course et se balancent à l'arrêt.
/// Le ciel et la lisière d'arbres glissent à peine : on sent la profondeur.

export interface ArrivalTiming {
	/** Départ (s), compté depuis l'apparition de la scène */
	delay: number;
	/** Durée du trajet (s) */
	duration: number;
	/** Part du trajet complet (1 : arrive de hors champ ; moins : parallaxe du fond) */
	travel?: number;
	/** Dépassement de la place avant de s'y poser (0 : aucun) */
	overshoot?: number;
}

export const ARRIVAL = {
	sky: { delay: 0, duration: 1.8, travel: 0.12, overshoot: 0 },
	treeLine: { delay: 0, duration: 1.6, travel: 0.3, overshoot: 0 },
	house: { delay: 0, duration: 1.05 },
	river: { delay: 0.08, duration: 1.05 },
	trees: { delay: 0.1, duration: 1.1 },
	path: { delay: 0.14, duration: 1 },
	garden: { delay: 0.18, duration: 1 },
	board: { delay: 0.32, duration: 1 },
	lamp: { delay: 0.42, duration: 1 },
	mailbox: { delay: 0.5, duration: 1 },
	critters: { delay: 0.55, duration: 1.1 },
	milo: { delay: 0.68, duration: 1 },
} as const satisfies Record<string, ArrivalTiming>;

/// Milo est posé : sa bulle peut s'afficher
const MILO_LANDS = ARRIVAL.milo.delay + ARRIVAL.milo.duration;
const ARRIVAL_END = Math.max(...Object.values(ARRIVAL).map((t: ArrivalTiming) => t.delay + t.duration));

/// Départ hors champ : la largeur vue par la caméra, plus une marge pour ce
/// qui est large ou en retrait (les arbres, la rivière)
const OFFSCREEN_MARGIN = 6;
const MIN_SPAN = 4;
const DEFAULT_OVERSHOOT = 0.8;

/// Balancement (ressort amorti) : l'objet penche en arrière pendant la course,
/// bascule en avant en freinant, puis se redresse
const LEAN_PER_SPEED = 0.018;
const MAX_LEAN = 0.13;
const LEAN_STIFFNESS = 140;
const LEAN_DAMPING = 10;

/** Freinage avec un léger dépassement (`overshoot` = 0 : simple ralenti) */
function easeOutBack(t: number, overshoot: number) {
	const q = t - 1;
	return 1 + (overshoot + 1) * q * q * q + overshoot * q * q;
}

/** Fait avancer l'horloge de l'arrivée (à placer avant les éléments qui arrivent) */
export const ArrivalClock: React.FC<{ bridge: MiloSchoolBridge; reducedMotion: boolean }> = ({
	bridge,
	reducedMotion,
}) => {
	useFrame(({ invalidate }, delta) => {
		if (bridge.arrival >= ARRIVAL_END) return;
		bridge.arrival = reducedMotion ? ARRIVAL_END : Math.min(bridge.arrival + frameStep(delta), ARRIVAL_END);
		/// (mouvements réduits : la scène ne se redessine qu'à la demande)
		if (reducedMotion) invalidate();
		if (!bridge.arrived && bridge.arrival >= MILO_LANDS) {
			bridge.arrived = true;
			bridge.onArrived?.();
		}
	});
	return null;
};

interface ArriveProps {
	bridge: MiloSchoolBridge;
	timing: ArrivalTiming;
	/** Point au sol (x, z) autour duquel l'objet se balance ; sans lui, il glisse sans pencher */
	sway?: readonly [number, number];
	/** Appelé une fois l'objet arrivé à sa place */
	onLand?: () => void;
	children: React.ReactNode;
}

/** Fait entrer son contenu par la droite, à chaque nouvelle page d'accueil */
export const Arrive: React.FC<ArriveProps> = ({ bridge, timing, sway, onLand, children }) => {
	const group = useRef<THREE.Group>(null);
	const run = useRef({
		bridge: null as MiloSchoolBridge | null,
		distance: 0,
		x: 0,
		lean: 0,
		spin: 0,
		landed: false,
		settled: false,
		epoch: parking.epoch,
		/// Visite quittée : l'objet reste au départ jusqu'à la suivante
		parkedFor: null as MiloSchoolBridge | null,
	});
	const [px, pz] = sway ?? [0, 0];
	const { delay, duration, travel = 1, overshoot = DEFAULT_OVERSHOOT } = timing;

	useFrame((_, delta) => {
		const g = group.current;
		if (!g) return;
		const r = run.current;
		/// Nouvelle visite : on repart de hors champ (la largeur du cadre est
		/// déjà connue, la caméra se règle avant)
		if (r.bridge !== bridge) {
			r.bridge = bridge;
			r.distance = (Math.max(bridge.span, MIN_SPAN) + OFFSCREEN_MARGIN) * travel;
			r.x = r.distance;
			r.lean = 0;
			r.spin = 0;
			r.landed = false;
			r.settled = false;
		}
		if (r.epoch !== parking.epoch) {
			r.epoch = parking.epoch;
			r.parkedFor = bridge;
			r.settled = false;
			r.lean = 0;
			r.spin = 0;
		}
		if (r.settled) return;

		const parked = r.parkedFor === bridge;
		const t = parked ? 0 : THREE.MathUtils.clamp((bridge.arrival - delay) / duration, 0, 1);
		const x = r.distance * (1 - easeOutBack(t, overshoot));
		const dt = frameStep(delta);
		if (sway && dt > 0 && !parked) {
			/// Vers la gauche (vitesse négative) le haut traîne à droite ; en
			/// freinant, il part en avant
			const velocity = (x - r.x) / dt;
			const target = THREE.MathUtils.clamp(velocity * LEAN_PER_SPEED, -MAX_LEAN, MAX_LEAN);
			r.spin += (LEAN_STIFFNESS * (target - r.lean) - LEAN_DAMPING * r.spin) * dt;
			r.lean += r.spin * dt;
		}
		r.x = x;

		if (t >= 1) {
			if (!r.landed) {
				r.landed = true;
				onLand?.();
			}
			if (Math.abs(r.lean) < 5e-4 && Math.abs(r.spin) < 5e-3) {
				r.lean = 0;
				r.settled = true;
			}
		}
		g.position.set(px + x, 0, pz);
		g.rotation.z = r.lean;
	});

	/// Montée à sa place : le contenu peut s'y mesurer (Milo se cale sur sa
	/// boîte englobante, que fausserait un parent déplacé). Chaque image
	/// replace le groupe avant d'être dessinée : il n'apparaît jamais là avant
	/// d'être parti de la droite.
	return (
		<group ref={group} position={[px, 0, pz]}>
			<group position={[-px, 0, -pz]}>{children}</group>
		</group>
	);
};
