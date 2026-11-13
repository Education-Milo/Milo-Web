import * as THREE from "three";

/// Entrée en classe : à chaque arrivée dans la salle, la porte du fond s'ouvre
/// sur le jardin de l'école (celui de l'accueil), Milo entre, file dans l'allée
/// de droite et bondit en pirouette jusqu'à sa place devant le tableau. La
/// caméra part du fond de la classe et le suit jusqu'au bureau de l'élève.
///
/// Ici : le trajet et le minutage, sans rendu. Le temps `t` avance dans la
/// scène 3D ; tout le reste (Milo, la porte, la caméra) se déduit de lui, si
/// bien que passer l'intro revient à sauter à l'atterrissage.

/** Milo à sa place devant le tableau (pose de la salle de classe) */
export const MILO_SPOT = new THREE.Vector3(2.2, -2.3, 1.4);
export const MILO_REST_YAW = -0.4;
export const MILO_SCALE = 0.45;
/// Le parquet. À sa place, Milo est un peu plus haut (ses pieds sont cachés
/// par le bureau de l'élève) : son bond l'y dépose.
const FLOOR_Y = -2.5;
/// Clip « Walk » à vitesse normale : 3,6 unités du modèle par seconde. Sa
/// cadence suit la vitesse de marche : les pieds ne glissent pas.
export const NATURAL_WALK_SPEED = 3.6 * MILO_SCALE;

/// Trajet (x, z) : du jardin, par la porte, dans l'allée de droite, jusque
/// devant les tables du premier rang
const PATH = new THREE.CatmullRomCurve3(
	[
		[8.9, 10.65],
		[6.2, 10.55],
		[5.6, 9.4],
		[5.55, 6.2],
		[5.25, 3.4],
		[4.5, 2.55],
	].map(([x, z]) => new THREE.Vector3(x, FLOOR_Y, z)),
	false,
	"centripetal",
);
const PATH_LENGTH = PATH.getLength();

const T = {
	/// La porte s'ouvre (un petit rebond : elle claque contre le mur)
	doorOpens: 0.15,
	doorOpening: 0.55,
	/// Milo attend dans le jardin, puis accélère jusqu'à sa vitesse de croisière
	walkStart: 0.3,
	accel: 0.35,
	cruise: 4.4,
	/// La porte se referme derrière lui, une fois qu'il est bien entré
	doorClosesAfter: 4.4,
	doorClosing: 0.42,
	/// Le bond jusqu'à sa place
	leap: 0.62,
	leapHeight: 0.95,
	/// Il se pose, la caméra arrive au bureau de l'élève
	settle: 0.65,
};

const WALK_DURATION = (PATH_LENGTH + (T.cruise * T.accel) / 2) / T.cruise;
export const TAKEOFF_AT = T.walkStart + WALK_DURATION;
export const LAND_AT = TAKEOFF_AT + T.leap;
export const ENTRANCE_END = LAND_AT + T.settle;

/** Distance parcourue au bout de `t` secondes de marche (départ en douceur) */
function walkedAt(t: number) {
	if (t <= 0) return 0;
	if (t < T.accel) return (T.cruise * t * t) / (2 * T.accel);
	return (T.cruise * T.accel) / 2 + T.cruise * (t - T.accel);
}
function walkTimeFor(distance: number) {
	const accelDistance = (T.cruise * T.accel) / 2;
	if (distance <= accelDistance) return Math.sqrt((2 * T.accel * distance) / T.cruise);
	return T.accel + (distance - accelDistance) / T.cruise;
}
const DOOR_CLOSES_AT = T.walkStart + walkTimeFor(T.doorClosesAfter);

export type EntrancePhase = "waiting" | "walking" | "leaping" | "landed" | "done";

export interface Entrance {
	/** Secondes écoulées depuis le début de l'entrée */
	t: number;
	/** Mouvements réduits : tout est déjà en place, rien ne bouge */
	instant: boolean;
	/** Intro passée par l'élève : pas de secousse à l'atterrissage */
	skipped: boolean;
	phase: EntrancePhase;
	/** Position de Milo (monde) et son orientation */
	position: THREE.Vector3;
	yaw: number;
	/** Vitesse de marche (unités / s), pour la cadence des pas */
	speed: number;
	/** Écrasement à l'atterrissage (0 : aucun) */
	squash: number;
	/** Ouverture de la porte (0 : fermée, 1 : grande ouverte) */
	door: number;
	/** Dernier point visé par la caméra : la caméra de la classe en repart */
	look: THREE.Vector3;
}

const tmp = { tangent: new THREE.Vector3(), takeoff: new THREE.Vector3() };
PATH.getPointAt(1, tmp.takeoff);
PATH.getTangentAt(1, tmp.tangent);
const TAKEOFF_YAW = Math.atan2(tmp.tangent.x, tmp.tangent.z);

const easeOutBack = (x: number, s = 1.2) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;
const easeInCubic = (x: number) => x * x * x;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const clamp01 = (x: number) => THREE.MathUtils.clamp(x, 0, 1);
/// Angle ramené dans [-π, π]
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/// Pirouette en l'air : de la direction de la course jusqu'à faire face à
/// l'élève, avec un tour complet en plus, dans le même sens
const SPIN = (() => {
	const turn = wrap(MILO_REST_YAW - TAKEOFF_YAW);
	return turn + Math.sign(turn || 1) * Math.PI * 2;
})();

/** Porte : ouverture rebondie, puis elle se referme d'un coup et tremble un peu */
function doorAt(t: number) {
	if (t >= DOOR_CLOSES_AT) {
		const c = (t - DOOR_CLOSES_AT) / T.doorClosing;
		if (c < 1) return 1 - easeInCubic(c);
		/// Elle claque contre le chambranle et rebondit à peine
		const after = t - DOOR_CLOSES_AT - T.doorClosing;
		return Math.max(0, Math.sin(after * 26) * 0.05 * Math.exp(-after * 9));
	}
	return easeOutBack(clamp01((t - T.doorOpens) / T.doorOpening));
}

/** Met à jour Milo et la porte d'après `entrance.t` */
export function sampleEntrance(e: Entrance) {
	const t = e.t;
	e.door = doorAt(t);
	e.squash = 0;
	e.speed = 0;

	if (t < T.walkStart) {
		e.phase = "waiting";
		PATH.getPointAt(0, e.position);
		PATH.getTangentAt(0, tmp.tangent);
		e.yaw = Math.atan2(tmp.tangent.x, tmp.tangent.z);
	} else if (t < TAKEOFF_AT) {
		e.phase = "walking";
		const walking = t - T.walkStart;
		const u = clamp01(walkedAt(walking) / PATH_LENGTH);
		PATH.getPointAt(u, e.position);
		PATH.getTangentAt(u, tmp.tangent);
		e.yaw = Math.atan2(tmp.tangent.x, tmp.tangent.z);
		e.speed = walking < T.accel ? (T.cruise * walking) / T.accel : T.cruise;
	} else if (t < LAND_AT) {
		e.phase = "leaping";
		const s = (t - TAKEOFF_AT) / T.leap;
		e.position.lerpVectors(tmp.takeoff, MILO_SPOT, s);
		e.position.y += T.leapHeight * 4 * s * (1 - s);
		e.yaw = TAKEOFF_YAW + SPIN * easeInOutCubic(s);
	} else {
		e.phase = t < ENTRANCE_END ? "landed" : "done";
		e.position.copy(MILO_SPOT);
		e.yaw = MILO_REST_YAW;
		/// Il s'écrase un peu en touchant le sol, puis reprend sa forme
		const since = t - LAND_AT;
		if (!e.instant && !e.skipped && since < 0.5) e.squash = 0.11 * Math.cos(since * 22) * Math.exp(-since * 8);
	}
}

export function createEntrance(instant: boolean): Entrance {
	const entrance: Entrance = {
		t: instant ? ENTRANCE_END : 0,
		instant,
		skipped: false,
		phase: "waiting",
		position: new THREE.Vector3(),
		yaw: 0,
		speed: 0,
		squash: 0,
		door: 0,
		look: new THREE.Vector3(),
	};
	sampleEntrance(entrance);
	return entrance;
}

/** L'élève passe l'intro : Milo est aussitôt à sa place, la caméra file au bureau */
export function skipEntrance(e: Entrance) {
	if (e.t >= LAND_AT) return;
	e.t = LAND_AT;
	e.skipped = true;
}

/** Milo est dans la scène mais l'entrée le pilote encore (marche, bond) */
export const isEntering = (phase: EntrancePhase) => phase === "waiting" || phase === "walking" || phase === "leaping";
