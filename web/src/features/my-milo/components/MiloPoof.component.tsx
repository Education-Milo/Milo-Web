import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { POOF_TIMING, smootherstep } from "@features/my-milo/utils/miloPoof";

/// « Tout enlever » : Milo fait une pirouette sautée, un nuage de fumée
/// l'enveloppe et ses accessoires disparaissent sous le nuage.

/// Bouffée de fumée dessinée une fois : quelques disques flous superposés,
/// pour un contour de nuage plutôt qu'un rond parfait
function makeCloudTexture() {
	const size = 128;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const blobs: [number, number, number][] = [
			[0.5, 0.55, 0.36],
			[0.34, 0.5, 0.24],
			[0.66, 0.48, 0.25],
			[0.47, 0.36, 0.25],
			[0.58, 0.66, 0.22],
		];
		for (const [x, y, r] of blobs) {
			const g = ctx.createRadialGradient(x * size, y * size, 0, x * size, y * size, r * size);
			g.addColorStop(0, "rgba(255,255,255,0.95)");
			g.addColorStop(0.6, "rgba(255,255,255,0.75)");
			g.addColorStop(1, "rgba(255,255,255,0)");
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, size, size);
		}
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

const PUFF_COUNT = 22;
/// Crème de la charte, légèrement chaud sur les bords des bouffées
const PUFF_COLORS = ["#FFF8F0", "#FBEBDC", "#F6E3D0"];

interface Puff {
	sprite: THREE.Sprite;
	material: THREE.SpriteMaterial;
	delay: number;
	from: THREE.Vector3;
	to: THREE.Vector3;
	size: number;
	spin: number;
}

interface PoofSmokeProps {
	/// Instant de départ (horloge du canvas), ou null au repos
	start: RefObject<number | null>;
	/// Taille de Milo dans le repère du groupe (unités)
	height: number;
}

/// Nuage de bouffées autour de Milo, rejoué à chaque nouveau départ
export const PoofSmoke = ({ start, height }: PoofSmokeProps) => {
	const texture = useMemo(makeCloudTexture, []);
	const puffs = useMemo<Puff[]>(
		() =>
			Array.from({ length: PUFF_COUNT }, (_, i) => {
				const material = new THREE.SpriteMaterial({
					map: texture,
					color: PUFF_COLORS[i % PUFF_COLORS.length],
					transparent: true,
					depthWrite: false,
					opacity: 0,
				});
				const sprite = new THREE.Sprite(material);
				sprite.visible = false;
				sprite.renderOrder = 10;
				return { sprite, material, delay: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), size: 1, spin: 0 };
			}),
		[texture],
	);

	useEffect(
		() => () => {
			texture.dispose();
			puffs.forEach((puff) => puff.material.dispose());
		},
		[texture, puffs],
	);

	/// Tirage des trajectoires à chaque nouveau départ
	const seeded = useMemo(() => ({ start: null as number | null }), []);

	useFrame((state) => {
		const t0 = start.current;
		if (t0 === null) {
			if (seeded.start !== null) puffs.forEach((puff) => (puff.sprite.visible = false));
			seeded.start = null;
			return;
		}
		if (seeded.start !== t0) {
			seeded.start = t0;
			puffs.forEach((puff, i) => {
				const angle = (i / PUFF_COUNT) * Math.PI * 2 + Math.random() * 0.6;
				const y = height * (0.12 + 0.78 * ((i * 0.618) % 1));
				const r = height * (0.05 + Math.random() * 0.06);
				/// Un peu plus de bouffées devant Milo, côté caméra
				const front = height * 0.12;
				puff.from.set(Math.cos(angle) * r, y, Math.sin(angle) * r + front);
				puff.to
					.copy(puff.from)
					.add(new THREE.Vector3(Math.cos(angle), 0.35 + Math.random() * 0.3, Math.sin(angle)).multiplyScalar(height * 0.16));
				puff.size = height * (0.34 + Math.random() * 0.16);
				puff.delay = POOF_TIMING.smokeStart + Math.random() * 0.12;
				puff.spin = (Math.random() - 0.5) * 2;
			});
		}

		const t = state.clock.elapsedTime - t0;
		for (const puff of puffs) {
			const life = (t - puff.delay) / POOF_TIMING.smokeLife;
			if (life <= 0 || life >= 1) {
				puff.sprite.visible = false;
				continue;
			}
			puff.sprite.visible = true;
			/// Gonfle vite puis ralentit ; opaque tôt, s'efface lentement
			const grow = 1 - Math.pow(1 - life, 3);
			puff.sprite.position.lerpVectors(puff.from, puff.to, grow);
			puff.sprite.scale.setScalar(puff.size * (0.35 + 0.95 * grow));
			puff.material.rotation = puff.spin * life;
			puff.material.opacity = 0.95 * Math.min(1, life / 0.12) * (1 - smootherstep((life - 0.35) / 0.65));
		}
	});

	return (
		<group>
			{puffs.map((puff, i) => (
				<primitive key={i} object={puff.sprite} />
			))}
		</group>
	);
};
