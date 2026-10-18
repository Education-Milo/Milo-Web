import React, { useEffect, useState } from "react";
import type { CosmeticType } from "@features/cosmetics/store/cosmetics.model";

/// Coutures entre chaque case de la tenue et la partie du corps de Milo
/// qu'elle habille, comme les annotations d'un croquis de mode.
///
/// Les points d'arrivée sont exprimés en fraction de la hauteur du canvas 3D :
/// la caméra a un champ vertical fixe, Milo y garde donc les mêmes proportions
/// quelle que soit la largeur de la scène.
/// `dx` : écart horizontal depuis l'axe de Milo, vers le côté de la case.
const OUTFIT_ANCHORS: Partial<Record<CosmeticType, { y: number; dx: number }>> = {
	cosmetic_hat: { y: 0.2, dx: 0.12 },
	cosmetic_glasses: { y: 0.33, dx: 0.09 },
	cosmetic_mustache: { y: 0.39, dx: 0.025 },
	cosmetic_gloves: { y: 0.665, dx: 0.13 },
	cosmetic_tie: { y: 0.485, dx: 0.02 },
	cosmetic_shirt: { y: 0.575, dx: 0.075 },
	cosmetic_pant: { y: 0.77, dx: 0.05 },
	cosmetic_shoes: { y: 0.86, dx: 0.075 },
};

/// Axe de Milo dans le canvas : le modèle est posé un peu à droite du centre
const AXIS_OFFSET = 0.054;

interface Stitch {
	type: CosmeticType;
	d: string;
	ax: number;
	ay: number;
}

interface OutfitStitchesProps {
	stageRef: React.RefObject<HTMLElement | null>;
	canvasRef: React.RefObject<HTMLElement | null>;
	slotRefs: React.RefObject<Map<CosmeticType, HTMLElement>>;
	types: CosmeticType[];
	sides: Partial<Record<CosmeticType, "left" | "right">>;
	filled: Set<CosmeticType>;
	active: CosmeticType | null;
	/// Largeur minimale de la scène pour disposer les cases autour de Milo
	minWidth: number;
}

const OutfitStitches: React.FC<OutfitStitchesProps> = ({ stageRef, canvasRef, slotRefs, types, sides, filled, active, minWidth }) => {
	const [box, setBox] = useState({ w: 0, h: 0 });
	const [stitches, setStitches] = useState<Stitch[]>([]);

	/// Effet passif : la ref de la scène (un parent) n'est posée qu'après les
	/// effets de mise en page des enfants, celui-ci compris
	useEffect(() => {
		const stage = stageRef.current;
		const canvas = canvasRef.current;
		if (!stage || !canvas) return;

		const compute = () => {
			const r = stage.getBoundingClientRect();
			if (r.width < minWidth) {
				setStitches([]);
				setBox({ w: r.width, h: r.height });
				return;
			}
			const c = canvas.getBoundingClientRect();
			const axis = c.left - r.left + c.width / 2 + c.height * AXIS_OFFSET;
			const next: Stitch[] = [];
			types.forEach((type) => {
				const el = slotRefs.current?.get(type);
				const anchor = OUTFIT_ANCHORS[type];
				if (!el || !anchor) return;
				const s = el.getBoundingClientRect();
				const left = sides[type] === "left";
				const sx = (left ? s.right : s.left) - r.left;
				const sy = s.top + s.height / 2 - r.top;
				const ax = axis + (left ? -1 : 1) * anchor.dx * c.height;
				const ay = c.top - r.top + anchor.y * c.height;
				/// Courbe en S : part à l'horizontale de la case, arrive en douceur
				const bend = (ax - sx) * 0.55;
				next.push({ type, d: `M ${sx} ${sy} C ${sx + bend} ${sy}, ${ax - bend * 0.35} ${ay}, ${ax} ${ay}`, ax, ay });
			});
			setBox({ w: r.width, h: r.height });
			setStitches(next);
		};

		compute();
		const ro = new ResizeObserver(compute);
		ro.observe(stage);
		ro.observe(canvas);
		slotRefs.current?.forEach((el) => ro.observe(el));
		/// Les polices chargées après coup changent la taille des cases
		document.fonts?.ready.then(compute).catch(() => {});
		return () => ro.disconnect();
	}, [stageRef, canvasRef, slotRefs, types, sides, minWidth]);

	if (stitches.length === 0) return null;

	return (
		<svg className={`mm-stitches${active ? " has-active" : ""}`} width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden="true">
			{stitches.map((s, i) => {
				const cls = `${filled.has(s.type) ? " is-filled" : ""}${active === s.type ? " is-active" : ""}`;
				return (
					<g key={s.type} className={`mm-stitch${cls}`} style={{ animationDelay: `${0.9 + i * 0.07}s` }}>
						<path className="mm-stitch__line" d={s.d} />
						<circle className="mm-stitch__halo" cx={s.ax} cy={s.ay} r={11} />
						<circle className="mm-stitch__dot" cx={s.ax} cy={s.ay} r={4.5} />
					</g>
				);
			})}
		</svg>
	);
};

export default OutfitStitches;
