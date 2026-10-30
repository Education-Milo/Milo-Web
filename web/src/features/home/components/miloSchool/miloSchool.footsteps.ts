import * as THREE from "three";

/// Les pas de Milo : à chaque pas sur la pelouse, une gerbe de brins d'herbe
/// projetée en arrière par la pointe du pied, quelques brins qui sautent sous
/// le talon et une poussière très fine (sur la marche en pierre, seulement la
/// poussière).
///
/// Volontairement léger, pour les ordinateurs sans carte graphique : un seul
/// nuage de points (un appel de dessin), quelques dizaines de particules
/// recyclées, mises à jour sur le processeur, et rien du tout à dessiner
/// quand Milo ne marche pas.

const MAX_PARTICLES = 128;
const GRASS = 0;
const DUST = 1;

/// Plus foncés (et quelques-uns plus clairs) que la pelouse : sinon les brins
/// se confondent avec elle
const GRASS_COLORS = ["#3F8A2A", "#2F6E22", "#4C9A30", "#58A831", "#9CCB3A", "#C9EC8E"].map((hex) => new THREE.Color(hex));
const DUST_COLOR = new THREE.Color("#FFF8EA");
const STONE_DUST_COLOR = new THREE.Color("#F2EADC");

const GRAVITY = 4.2;

const vertexShader = /* glsl */ `
	attribute vec3 aColor;
	attribute float aSize;
	attribute float aAlpha;
	attribute float aKind;
	attribute float aAngle;
	uniform float uViewportHalfHeight;
	varying vec3 vColor;
	varying float vAlpha;
	varying float vKind;
	varying float vAngle;
	void main() {
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_Position = projectionMatrix * mvPosition;
		/// Taille en unités du monde, convertie en pixels
		gl_PointSize = aSize * projectionMatrix[1][1] * uViewportHalfHeight / max(-mvPosition.z, 0.001);
		vColor = aColor;
		vAlpha = aAlpha;
		vKind = aKind;
		vAngle = aAngle;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uLight;
	varying vec3 vColor;
	varying float vAlpha;
	varying float vKind;
	varying float vAngle;
	void main() {
		vec2 p = gl_PointCoord * 2.0 - 1.0;
		float alpha;
		if (vKind < 0.5) {
			/// Brin d'herbe : une petite feuille effilée, qui tourne en l'air
			float c = cos(vAngle);
			float s = sin(vAngle);
			vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
			float halfWidth = 0.07 + 0.27 * (0.5 - 0.5 * q.y);
			alpha = (1.0 - smoothstep(halfWidth - 0.07, halfWidth, abs(q.x))) * (1.0 - smoothstep(0.82, 0.98, abs(q.y)));
		} else {
			/// Poussière : une tache ronde et douce
			float d = 1.0 - clamp(length(p), 0.0, 1.0);
			alpha = d * d;
		}
		alpha *= vAlpha;
		if (alpha < 0.01) discard;
		gl_FragColor = vec4(vColor * uLight, alpha);
		#include <tonemapping_fragment>
		#include <colorspace_fragment>
	}
`;

export type FootGround = "grass" | "stone";

const random = (min: number, max: number) => min + Math.random() * (max - min);

export class MiloFootsteps {
	readonly points: THREE.Points;
	private readonly geometry = new THREE.BufferGeometry();
	private readonly material: THREE.ShaderMaterial;
	private readonly position = new Float32Array(MAX_PARTICLES * 3);
	private readonly velocity = new Float32Array(MAX_PARTICLES * 3);
	private readonly color = new Float32Array(MAX_PARTICLES * 3);
	private readonly size = new Float32Array(MAX_PARTICLES);
	private readonly alpha = new Float32Array(MAX_PARTICLES);
	private readonly kind = new Float32Array(MAX_PARTICLES);
	private readonly angle = new Float32Array(MAX_PARTICLES);
	private readonly spin = new Float32Array(MAX_PARTICLES);
	private readonly age = new Float32Array(MAX_PARTICLES);
	private readonly life = new Float32Array(MAX_PARTICLES);
	private readonly startSize = new Float32Array(MAX_PARTICLES);
	private readonly endSize = new Float32Array(MAX_PARTICLES);
	private readonly startAlpha = new Float32Array(MAX_PARTICLES);
	private next = 0;
	private alive = 0;

	constructor() {
		const attribute = (array: Float32Array, itemSize: number) =>
			new THREE.BufferAttribute(array, itemSize).setUsage(THREE.DynamicDrawUsage);
		this.geometry.setAttribute("position", attribute(this.position, 3));
		this.geometry.setAttribute("aColor", attribute(this.color, 3));
		this.geometry.setAttribute("aSize", attribute(this.size, 1));
		this.geometry.setAttribute("aAlpha", attribute(this.alpha, 1));
		this.geometry.setAttribute("aKind", attribute(this.kind, 1));
		this.geometry.setAttribute("aAngle", attribute(this.angle, 1));
		this.material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: { uViewportHalfHeight: { value: 400 }, uLight: { value: 1 } },
			transparent: true,
			depthWrite: false,
		});
		this.points = new THREE.Points(this.geometry, this.material);
		/// Les particules bougent sans cesse : pas de boîte englobante à tenir à jour
		this.points.frustumCulled = false;
		this.points.visible = false;
		this.points.renderOrder = 2;
	}

	/** Un pas : poussière et brins sous le talon, gerbe d'herbe projetée en arrière par la pointe */
	step(heel: THREE.Vector3, toe: THREE.Vector3, backX: number, backZ: number, ground: FootGround) {
		const dustCount = ground === "stone" ? 3 : 2;
		for (let i = 0; i < dustCount; i++) {
			const k = this.spawn(DUST, heel, 0.05, ground === "stone" ? STONE_DUST_COLOR : DUST_COLOR);
			const a = Math.random() * Math.PI * 2;
			const speed = random(0.08, 0.2);
			this.velocity[k * 3] = Math.cos(a) * speed + backX * 0.08;
			this.velocity[k * 3 + 1] = random(0.08, 0.18);
			this.velocity[k * 3 + 2] = Math.sin(a) * speed + backZ * 0.08;
			this.life[k] = random(0.6, 0.85);
			this.startSize[k] = random(0.08, 0.11);
			this.endSize[k] = random(0.24, 0.32);
			this.startAlpha[k] = ground === "stone" ? 0.55 : 0.5;
		}
		if (ground !== "grass") return;
		/// Sous le talon : quelques brins qui sautent sur place
		for (let i = 0; i < 3; i++) {
			this.blade(heel, 0.07, backX, backZ, random(-0.05, 0.15), 0.3, random(0.45, 0.8), random(0.05, 0.07));
		}
		/// Sous la pointe : la gerbe, projetée en arrière et en l'air
		const count = 7 + Math.floor(Math.random() * 3);
		for (let i = 0; i < count; i++) {
			this.blade(toe, 0.05, backX, backZ, random(0.3, 0.75), 0.38, random(0.95, 1.55), random(0.065, 0.1));
		}
	}

	/** Un brin d'herbe, lancé vers l'arrière (`back`), de côté (± `side`) et vers le haut (`up`) */
	private blade(
		at: THREE.Vector3,
		jitter: number,
		backX: number,
		backZ: number,
		back: number,
		side: number,
		up: number,
		size: number,
	) {
		const k = this.spawn(GRASS, at, jitter, GRASS_COLORS[Math.floor(Math.random() * GRASS_COLORS.length)]);
		const lateral = random(-side, side);
		/// Perpendiculaire au sens de la marche, dans le plan du sol
		this.velocity[k * 3] = backX * back - backZ * lateral;
		this.velocity[k * 3 + 1] = up;
		this.velocity[k * 3 + 2] = backZ * back + backX * lateral;
		this.life[k] = random(0.55, 0.8);
		this.startSize[k] = size;
		this.endSize[k] = size;
		this.startAlpha[k] = 1;
		this.angle[k] = Math.random() * Math.PI * 2;
		this.spin[k] = random(-10, 10);
	}

	/** Avance les particules d'un pas de temps ; à appeler à chaque image */
	update(dt: number, viewportHalfHeight: number, light: number) {
		this.material.uniforms.uViewportHalfHeight.value = viewportHalfHeight;
		this.material.uniforms.uLight.value = light;
		if (this.alive === 0) {
			this.points.visible = false;
			return;
		}
		let alive = 0;
		for (let k = 0; k < MAX_PARTICLES; k++) {
			if (this.life[k] <= 0) continue;
			this.age[k] += dt;
			const t = this.age[k] / this.life[k];
			if (t >= 1) {
				this.life[k] = 0;
				this.alpha[k] = 0;
				this.size[k] = 0;
				continue;
			}
			alive++;
			const i = k * 3;
			if (this.kind[k] === GRASS) {
				this.velocity[i + 1] -= GRAVITY * dt;
				this.angle[k] += this.spin[k] * dt;
				/// Le brin retombe dans l'herbe : il s'efface à la fin
				this.alpha[k] = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
			} else {
				/// La poussière ralentit, gonfle et se dissipe
				const drag = Math.exp(-2.6 * dt);
				this.velocity[i] *= drag;
				this.velocity[i + 1] *= drag;
				this.velocity[i + 2] *= drag;
				this.alpha[k] = this.startAlpha[k] * (1 - t) ** 1.6;
			}
			this.size[k] = THREE.MathUtils.lerp(this.startSize[k], this.endSize[k], 1 - (1 - t) ** 2);
			this.position[i] += this.velocity[i] * dt;
			this.position[i + 1] = Math.max(this.position[i + 1] + this.velocity[i + 1] * dt, 0.005);
			this.position[i + 2] += this.velocity[i + 2] * dt;
		}
		this.alive = alive;
		this.points.visible = true;
		const attributes = this.geometry.attributes;
		attributes.position.needsUpdate = true;
		attributes.aSize.needsUpdate = true;
		attributes.aAlpha.needsUpdate = true;
		attributes.aAngle.needsUpdate = true;
	}

	/** Efface tout (retour sur l'accueil, Milo remis à sa place) */
	clear() {
		this.life.fill(0);
		this.alpha.fill(0);
		this.size.fill(0);
		this.alive = 0;
		this.points.visible = false;
	}

	dispose() {
		this.geometry.dispose();
		this.material.dispose();
	}

	/** Prend la place de la plus ancienne particule (déjà éteinte, le plus souvent) */
	private spawn(kind: number, at: THREE.Vector3, jitter: number, color: THREE.Color) {
		const k = this.next;
		this.next = (this.next + 1) % MAX_PARTICLES;
		const i = k * 3;
		this.position[i] = at.x + random(-jitter, jitter);
		this.position[i + 1] = at.y + 0.015;
		this.position[i + 2] = at.z + random(-jitter, jitter);
		this.color[i] = color.r;
		this.color[i + 1] = color.g;
		this.color[i + 2] = color.b;
		this.kind[k] = kind;
		this.age[k] = 0;
		this.angle[k] = 0;
		this.spin[k] = 0;
		this.alpha[k] = 0;
		this.size[k] = 0;
		this.alive++;
		const attributes = this.geometry.attributes;
		attributes.aColor.needsUpdate = true;
		attributes.aKind.needsUpdate = true;
		return k;
	}
}
