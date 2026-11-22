import React, { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/// La craie de Milo quand il écrit au tableau (clip writingBoard), et la
/// poussière qui s'en échappe.
///
/// La craie est un petit bâton accroché à l'os de sa main gauche : elle suit
/// l'animation. La poussière : quelques grains blancs qui naissent au bout de
/// la craie tant qu'elle touche l'ardoise, flottent un instant en tombant
/// doucement et s'effacent. Visible, mais discrète : 40 grains au plus, un
/// seul appel de dessin.

/** Ce que l'animation fait de la craie à cette image (lu à chaque image) */
export interface ChalkState {
	/// La craie est dans sa main
	holding: boolean;
	/// Elle touche l'ardoise : la poussière s'en échappe
	touching: boolean;
}

/// Os de la main gauche dans three (« DEF-hand.L » perd son point au chargement)
const HAND_BONE = "DEF-handL";
const CHALK_NAME = "__craie";
/// Craie (unités du modèle de Milo, avant son échelle, repère de l'os de la
/// main : Y vers le bout des doigts). Tenue dans le poing, elle en dépasse par
/// le bas, vers l'ardoise : vu de la salle (Milo est de dos), on voit le bâton
/// blanc sous sa main et la poussière qui tombe de son bout.
const CHALK = {
	length: 0.55,
	radius: 0.075,
	position: new THREE.Vector3(0.05, 0.42, 0.1),
	rotation: new THREE.Euler(0.9, 0, -0.4),
};
/// La poussière naît un peu devant l'ardoise (vers la salle, monde) : au ras de
/// la surface, elle serait cachée dedans
const DUST_OFFSET = new THREE.Vector3(0, 0, 0.07);

const DUST = {
	max: 40,
	/// Grains par seconde tant que la craie touche l'ardoise
	rate: 20,
	life: [0.7, 1.2] as const,
	/// Taille d'un grain (monde) : quelques pixels à l'écran
	size: 0.085,
	opacity: 0.65,
	/// Chute (monde / s²), vitesse de départ (monde / s) : chaque grain monte un
	/// peu au-dessus de la craie, en bouffée, puis retombe en flottant
	gravity: 0.32,
	spread: 0.08,
	lift: 0.16,
};

/** Grain flou (dégradé radial), dessiné une fois */
function grainTexture() {
	const size = 32;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, "rgba(255,255,255,1)");
		g.addColorStop(0.45, "rgba(255,255,255,0.55)");
		g.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

interface ChalkFxProps {
	/** Le Milo de la salle de classe */
	scene: THREE.Object3D;
	state: ChalkState;
}

const ChalkFx: React.FC<ChalkFxProps> = ({ scene, state }) => {
	const hand = useMemo(() => scene.getObjectByName(HAND_BONE) ?? null, [scene]);

	/// La craie, accrochée à la main (la scène du .glb est copiée pour la classe :
	/// on la retire en partant)
	const chalk = useMemo(() => {
		const mesh = new THREE.Mesh(
			new THREE.CylinderGeometry(CHALK.radius, CHALK.radius * 0.92, CHALK.length, 10),
			new THREE.MeshStandardMaterial({ color: "#F4F1E8", roughness: 0.95 }),
		);
		mesh.name = CHALK_NAME;
		mesh.position.copy(CHALK.position);
		mesh.rotation.copy(CHALK.rotation);
		mesh.castShadow = true;
		mesh.frustumCulled = false;
		mesh.visible = false;
		return mesh;
	}, []);
	/// Bout de la craie (repère de la craie), d'où part la poussière
	const tip = useMemo(() => new THREE.Vector3(0, CHALK.length / 2, 0), []);

	useEffect(() => {
		if (!hand) return;
		hand.add(chalk);
		return () => {
			hand.remove(chalk);
			chalk.geometry.dispose();
			(chalk.material as THREE.Material).dispose();
		};
	}, [hand, chalk]);

	/// Poussière : un nuage de points dans le repère du monde
	const dust = useMemo(() => {
		const positions = new Float32Array(DUST.max * 3);
		const colors = new Float32Array(DUST.max * 4);
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
		geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4).setUsage(THREE.DynamicDrawUsage));
		const material = new THREE.PointsMaterial({
			size: DUST.size,
			map: grainTexture(),
			vertexColors: true,
			transparent: true,
			depthWrite: false,
			sizeAttenuation: true,
			toneMapped: false,
		});
		const points = new THREE.Points(geometry, material);
		points.frustumCulled = false;
		const grains = Array.from({ length: DUST.max }, () => ({
			age: 0,
			life: 0,
			position: new THREE.Vector3(),
			velocity: new THREE.Vector3(),
		}));
		return { points, positions, colors, grains, next: 0, budget: 0, alive: 0 };
	}, []);

	useEffect(
		() => () => {
			dust.points.geometry.dispose();
			const material = dust.points.material as THREE.PointsMaterial;
			material.map?.dispose();
			material.dispose();
		},
		[dust],
	);

	const world = useMemo(() => new THREE.Vector3(), []);

	useFrame((_, delta) => {
		const dt = Math.min(delta, 0.1);
		chalk.visible = state.holding;

		/// Nouveaux grains au bout de la craie
		if (state.holding && state.touching) {
			chalk.updateWorldMatrix(true, false);
			world.copy(tip).applyMatrix4(chalk.matrixWorld);
			dust.budget += DUST.rate * dt;
			while (dust.budget >= 1) {
				dust.budget -= 1;
				const grain = dust.grains[dust.next];
				dust.next = (dust.next + 1) % DUST.max;
				grain.age = 0;
				grain.life = THREE.MathUtils.lerp(DUST.life[0], DUST.life[1], Math.random());
				grain.position.copy(world).add(DUST_OFFSET);
				grain.velocity.set(
					(Math.random() - 0.5) * DUST.spread,
					DUST.lift * (0.4 + 0.6 * Math.random()),
					Math.random() * DUST.spread * 0.6,
				);
			}
		} else {
			dust.budget = 0;
		}

		/// Les grains tombent doucement et s'effacent
		let alive = 0;
		const parent = dust.points.parent;
		dust.grains.forEach((grain, i) => {
			if (grain.age < grain.life) {
				grain.age += dt;
				grain.velocity.y -= DUST.gravity * dt;
				grain.velocity.multiplyScalar(1 - 1.5 * dt);
				grain.position.addScaledVector(grain.velocity, dt);
			}
			const t = grain.life > 0 ? Math.min(grain.age / grain.life, 1) : 1;
			const alpha = t >= 1 ? 0 : DUST.opacity * (1 - t) * Math.min(grain.age / 0.08, 1);
			if (alpha > 0) alive++;
			world.copy(grain.position);
			if (parent) parent.worldToLocal(world);
			dust.positions.set([world.x, world.y, world.z], i * 3);
			dust.colors.set([1, 1, 1, alpha], i * 4);
		});
		if (alive || dust.alive) {
			dust.points.geometry.attributes.position.needsUpdate = true;
			dust.points.geometry.attributes.color.needsUpdate = true;
		}
		dust.alive = alive;
		dust.points.visible = alive > 0;
	});

	return <primitive object={dust.points} />;
};

export default ChalkFx;
