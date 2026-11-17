import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CosmeticType } from "@features/cosmetics/store/cosmetics.model";
import { makeCloudTexture, smootherstep } from "@features/my-milo/utils/miloPoof";

/// Effets de la loge, à l'endroit du corps où va l'objet :
/// - on équipe : une gerbe d'étincelles et un éclat chaud ;
/// - on retire : une petite bouffée de fumée légère (la version discrète du
///   nuage de « Tout enlever », cf. MiloPoof).

export type OutfitFx = { kind: "equip" | "unequip"; type: CosmeticType; nonce: number };

/// Hauteur de chaque emplacement sur Milo (fraction de sa taille, pieds à 0)
const SPOT: Partial<Record<CosmeticType, number>> = {
	cosmetic_hat: 0.95,
	cosmetic_glasses: 0.8,
	cosmetic_mustache: 0.73,
	cosmetic_tie: 0.6,
	cosmetic_shirt: 0.55,
	cosmetic_gloves: 0.42,
	cosmetic_pant: 0.3,
	cosmetic_shoes: 0.06,
};

const STAR_COUNT = 12;
const PUFF_COUNT = 9;
const SPARKLE_LIFE = 0.9;
const PUFF_LIFE = 0.85;
const PUFF_COLORS = ["#FFF8F0", "#FBEBDC", "#F6E3D0"];

/** Halo chaud et doux (dégradé radial), pour l'éclat de l'équipement */
function makeGlowTexture() {
	const size = 128;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, "rgba(255,244,210,1)");
		g.addColorStop(0.35, "rgba(255,200,110,0.7)");
		g.addColorStop(1, "rgba(255,150,60,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

/// Sprite toujours dessiné devant Milo (l'effet est « sur » l'objet)
const makeSprite = (map: THREE.Texture, additive = false, color = "#ffffff") => {
	const material = new THREE.SpriteMaterial({
		map,
		color,
		transparent: true,
		opacity: 0,
		depthWrite: false,
		depthTest: false,
		blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
	});
	const sprite = new THREE.Sprite(material);
	sprite.visible = false;
	sprite.renderOrder = 20;
	return { sprite, material };
};

interface Particle {
	sprite: THREE.Sprite;
	material: THREE.SpriteMaterial;
	from: THREE.Vector3;
	to: THREE.Vector3;
	size: number;
	delay: number;
	spin: number;
}

export const OutfitFx3D = ({ fx, height }: { fx: OutfitFx | null; height: number }) => {
	const cloud = useMemo(makeCloudTexture, []);
	const glowMap = useMemo(makeGlowTexture, []);
	const starMap = useMemo(() => {
		const texture = new THREE.TextureLoader().load("/landing/emoji/sparkles.webp");
		texture.colorSpace = THREE.SRGBColorSpace;
		return texture;
	}, []);

	const stars = useMemo<Particle[]>(
		() =>
			Array.from({ length: STAR_COUNT }, () => ({
				...makeSprite(starMap),
				from: new THREE.Vector3(),
				to: new THREE.Vector3(),
				size: 1,
				delay: 0,
				spin: 0,
			})),
		[starMap],
	);
	const glow = useMemo(() => makeSprite(glowMap, true), [glowMap]);
	const puffs = useMemo<Particle[]>(
		() =>
			Array.from({ length: PUFF_COUNT }, (_, i) => ({
				...makeSprite(cloud, false, PUFF_COLORS[i % PUFF_COLORS.length]),
				from: new THREE.Vector3(),
				to: new THREE.Vector3(),
				size: 1,
				delay: 0,
				spin: 0,
			})),
		[cloud],
	);

	useEffect(
		() => () => {
			[cloud, glowMap, starMap].forEach((t) => t.dispose());
			[...stars, ...puffs, glow].forEach((p) => p.material.dispose());
		},
		[cloud, glowMap, starMap, stars, puffs, glow],
	);

	/// Effet en cours : instant de départ (horloge du canvas) et sorte
	const run = useRef<{ nonce: number; t0: number | null; kind: OutfitFx["kind"]; center: THREE.Vector3 }>({
		nonce: 0,
		t0: null,
		kind: "equip",
		center: new THREE.Vector3(),
	});

	useFrame((state) => {
		const now = state.clock.elapsedTime;
		const r = run.current;

		/// Nouvel effet : on tire les trajectoires autour de l'emplacement
		if (fx && fx.nonce !== r.nonce) {
			r.nonce = fx.nonce;
			r.t0 = now;
			r.kind = fx.kind;
			/// (un peu devant Milo, côté caméra)
			r.center.set(0, height * (SPOT[fx.type] ?? 0.55), height * 0.14);
			if (fx.kind === "equip") {
				stars.forEach((p, i) => {
					const angle = (i / STAR_COUNT) * Math.PI * 2 + Math.random() * 0.5;
					const dist = height * (0.13 + Math.random() * 0.1);
					p.from.copy(r.center);
					p.to.set(r.center.x + Math.cos(angle) * dist, r.center.y + Math.sin(angle) * dist * 0.8, r.center.z + height * 0.03);
					p.size = height * (0.05 + Math.random() * 0.04);
					p.delay = Math.random() * 0.12;
					p.spin = (Math.random() - 0.5) * 4;
				});
			} else {
				puffs.forEach((p, i) => {
					const angle = (i / PUFF_COUNT) * Math.PI * 2 + Math.random() * 0.7;
					const jitter = height * 0.035;
					p.from.set(
						r.center.x + Math.cos(angle) * jitter,
						r.center.y + Math.sin(angle) * jitter * 0.6,
						r.center.z,
					);
					p.to
						.copy(p.from)
						.add(new THREE.Vector3(Math.cos(angle) * height * 0.08, height * (0.05 + Math.random() * 0.05), 0));
					p.size = height * (0.11 + Math.random() * 0.06);
					p.delay = Math.random() * 0.08;
					p.spin = (Math.random() - 0.5) * 2;
				});
			}
		}

		const hideAll = () => {
			stars.forEach((p) => (p.sprite.visible = false));
			puffs.forEach((p) => (p.sprite.visible = false));
			glow.sprite.visible = false;
		};
		if (r.t0 === null) return;
		const t = now - r.t0;
		const life = r.kind === "equip" ? SPARKLE_LIFE : PUFF_LIFE;
		if (t > life + 0.2) {
			r.t0 = null;
			hideAll();
			return;
		}

		if (r.kind === "equip") {
			puffs.forEach((p) => (p.sprite.visible = false));
			/// Éclat chaud qui gonfle et s'efface
			const g = Math.min(1, t / 0.5);
			glow.sprite.visible = g < 1;
			glow.sprite.position.copy(r.center);
			glow.sprite.scale.setScalar(height * (0.06 + 0.32 * (1 - Math.pow(1 - g, 3))));
			glow.material.opacity = 0.9 * (1 - g);
			/// Étincelles qui jaillissent en couronne, tournent et s'éteignent
			stars.forEach((p) => {
				const k = (t - p.delay) / SPARKLE_LIFE;
				if (k <= 0 || k >= 1) {
					p.sprite.visible = false;
					return;
				}
				p.sprite.visible = true;
				const out = 1 - Math.pow(1 - k, 3);
				p.sprite.position.lerpVectors(p.from, p.to, out);
				p.sprite.scale.setScalar(p.size * Math.sin(Math.PI * Math.min(1, k * 1.2)));
				p.material.rotation = p.spin * k;
				p.material.opacity = 1 - smootherstep((k - 0.55) / 0.45);
			});
		} else {
			stars.forEach((p) => (p.sprite.visible = false));
			glow.sprite.visible = false;
			/// Bouffées légères qui gonflent, montent un peu et se dissipent
			puffs.forEach((p) => {
				const k = (t - p.delay) / PUFF_LIFE;
				if (k <= 0 || k >= 1) {
					p.sprite.visible = false;
					return;
				}
				p.sprite.visible = true;
				const grow = 1 - Math.pow(1 - k, 3);
				p.sprite.position.lerpVectors(p.from, p.to, grow);
				p.sprite.scale.setScalar(p.size * (0.4 + 0.8 * grow));
				p.material.rotation = p.spin * k;
				p.material.opacity = 0.78 * Math.min(1, k / 0.15) * (1 - smootherstep((k - 0.3) / 0.7));
			});
		}
	});

	return (
		<group>
			<primitive object={glow.sprite} />
			{stars.map((p, i) => (
				<primitive key={`s${i}`} object={p.sprite} />
			))}
			{puffs.map((p, i) => (
				<primitive key={`p${i}`} object={p.sprite} />
			))}
		</group>
	);
};
