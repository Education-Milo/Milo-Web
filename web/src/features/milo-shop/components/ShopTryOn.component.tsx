import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw, RotateCw } from "lucide-react";
import type { DuelDance } from "@features/duels/components/DuelMilo3D.component";
import { useEquipped } from "@features/cosmetics/store/cosmetics.queries";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import type { Cosmetic, CosmeticType } from "@features/cosmetics/store/cosmetics.model";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import CosmeticVisual from "@features/milo-shop/components/CosmeticVisual.component";

/// Cabine d'essayage : le Milo de l'élève, en entier et avec sa tenue
/// actuelle, enfile l'objet devant lui (geste « mettre ses lunettes » ou
/// « enfiler un haut »), dans une gerbe d'étincelles. « Sans / Avec » compare
/// à la tenue actuelle ; on le fait tourner en le glissant. Une danse, il la
/// danse. Scène 3D partagée (canal « shop ») : rouvrir la cabine est immédiat.

const SharedMilo3D = lazy(() => import("@shared/components/SharedMilo3D.component"));

/// Objets qu'on met sur la tête : le geste des lunettes ; le reste : le geste du haut
const HEAD_ITEMS: CosmeticType[] = ["cosmetic_hat", "cosmetic_glasses", "cosmetic_mustache"];
/// L'objet apparaît au moment où les mains l'amènent (ms après le début du geste)
const GESTURES = {
	head: { clip: "EquipGlasses", swapAt: 1500 },
	body: { clip: "EquipTop", swapAt: 1900 },
};
/// Où jaillissent les étincelles, selon l'objet (hauteur dans la cabine, %)
const BURST_TOP: Partial<Record<CosmeticType, number>> = {
	cosmetic_hat: 14,
	cosmetic_glasses: 24,
	cosmetic_mustache: 30,
	cosmetic_tie: 44,
	cosmetic_shirt: 46,
	cosmetic_gloves: 56,
	cosmetic_pant: 70,
	cosmetic_shoes: 86,
};
/// Rotation par glissé (radians par pixel) et par bouton
const DRAG_SPIN = 0.012;
const STEP_SPIN = Math.PI / 4;

/// La scène persiste d'une ouverture à l'autre : ses numéros d'animation doivent toujours croître
let danceSeq = 0;

const ShopTryOn: React.FC<{ item: Cosmetic }> = ({ item }) => {
	const reduceMotion = Boolean(useReducedMotion());
	const { data: equipped } = useEquipped();
	/// (enregistre aussi les maillages du catalogue : ceux qui ne sont pas portés restent cachés)
	useEquippedMeshNames();
	const isDance = item.type === "dance";
	const gesture = HEAD_ITEMS.includes(item.type) ? GESTURES.head : GESTURES.body;

	/// Tenue actuelle, et la même avec l'objet à la place de celui de son emplacement
	const current = useMemo(
		() =>
			Object.values(equipped?.skins ?? {})
				.map((skin) => skin?.mesh_name)
				.filter((name): name is string => Boolean(name)),
		[equipped],
	);
	const withItem = useMemo(() => {
		const others = Object.entries(equipped?.skins ?? {})
			.filter(([type]) => type !== item.type)
			.map(([, skin]) => skin?.mesh_name)
			.filter((name): name is string => Boolean(name));
		return item.mesh_name ? [...others, item.mesh_name] : others;
	}, [equipped, item]);

	const [mode, setMode] = useState<"with" | "without">("with");
	const [wearing, setWearing] = useState(false);
	const [dance, setDance] = useState<DuelDance | null>(null);
	const [burst, setBurst] = useState(0);
	const [ready, setReady] = useState(false);
	const [spun, setSpun] = useState(false);
	const timers = useRef<number[]>([]);
	const spinRef = useMemo(() => ({ current: 0 }), []);
	const drag = useRef<{ x: number; id: number } | null>(null);

	const clearTimers = () => {
		timers.current.forEach((id) => window.clearTimeout(id));
		timers.current = [];
	};
	useEffect(() => clearTimers, []);

	const play = useCallback((clip: string) => {
		danceSeq += 1;
		setDance({ clip, seq: danceSeq });
	}, []);

	/// Milo enfile l'objet : le geste, puis l'objet apparaît dans ses mains
	const putOn = useCallback(() => {
		clearTimers();
		if (reduceMotion) {
			setWearing(true);
			return;
		}
		setWearing(false);
		play(gesture.clip);
		timers.current.push(
			window.setTimeout(() => {
				setWearing(true);
				setBurst((n) => n + 1);
			}, gesture.swapAt),
		);
	}, [gesture, play, reduceMotion]);

	const handleReady = useCallback(() => {
		setReady(true);
		if (isDance) {
			if (!reduceMotion && item.mesh_name) play(item.mesh_name);
		} else putOn();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- une fois, quand Milo apparaît
	}, []);

	const choose = (next: "with" | "without") => {
		if (next === mode) return;
		setMode(next);
		if (next === "with") putOn();
		else {
			clearTimers();
			setWearing(false);
		}
	};

	/* --- On fait tourner Milo en le glissant --- */
	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		drag.current = { x: event.clientX, id: event.pointerId };
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!drag.current || drag.current.id !== event.pointerId) return;
		spinRef.current += (event.clientX - drag.current.x) * DRAG_SPIN;
		drag.current.x = event.clientX;
		if (!spun) setSpun(true);
	};
	const onPointerUp = () => {
		drag.current = null;
	};
	const turn = (dir: number) => {
		spinRef.current += dir * STEP_SPIN;
		setSpun(true);
	};

	const meshes = isDance || !wearing ? current : withItem;

	return (
		<div className={`ms-tryon${ready ? " is-ready" : ""}`}>
			<div
				className="ms-tryon__cabin"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
			>
				<span className="ms-tryon__floor" aria-hidden="true" />
				{/* L'objet, le temps que Milo arrive */}
				<span className="ms-tryon__placeholder" aria-hidden="true">
					<CosmeticVisual item={item} className="ms-modal__visual" />
				</span>
				{!reduceMotion || !isDance ? (
					<Suspense fallback={null}>
						<SharedMilo3D
							channel="shop"
							equippedMeshNames={meshes}
							dance={dance}
							facing="front"
							spinRef={spinRef}
							onReady={handleReady}
							firstMountDelayMs={350}
							className="ms-tryon__milo"
						/>
					</Suspense>
				) : null}

				{/* Étincelles quand l'objet apparaît */}
				<AnimatePresence>
					{burst > 0 && (
						<motion.span
							key={burst}
							className="ms-tryon__burst"
							style={{ top: `${BURST_TOP[item.type] ?? 40}%` }}
							initial={{ scale: 0.2, opacity: 1 }}
							animate={{ scale: 1.6, opacity: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.8, ease: "easeOut" }}
							aria-hidden="true"
						>
							<Emoji3D name="sparkles" />
						</motion.span>
					)}
				</AnimatePresence>

				{/* L'objet essayé, en vignette */}
				<span className="ms-tryon__badge" aria-hidden="true">
					<CosmeticVisual item={item} />
				</span>

				{ready && !spun && (
					<span className="ms-tryon__hint" aria-hidden="true">
						Glisse pour le faire tourner
					</span>
				)}
				<div className="ms-tryon__turn">
					<button type="button" onClick={() => turn(-1)} aria-label="Tourner Milo vers la gauche">
						<RotateCcw size={18} strokeWidth={2.6} aria-hidden="true" />
					</button>
					<button type="button" onClick={() => turn(1)} aria-label="Tourner Milo vers la droite">
						<RotateCw size={18} strokeWidth={2.6} aria-hidden="true" />
					</button>
				</div>
			</div>

			{isDance ? (
				<button
					type="button"
					className="ms-btn ms-btn--ghost ms-btn--sm ms-tryon__replay"
					onClick={() => item.mesh_name && play(item.mesh_name)}
					disabled={!ready || reduceMotion}
				>
					Rejouer la danse
				</button>
			) : (
				<div className="ms-tryon__switch" role="radiogroup" aria-label="Comparer avec ta tenue actuelle">
					{(["without", "with"] as const).map((value) => (
						<button
							key={value}
							type="button"
							role="radio"
							aria-checked={mode === value}
							className={mode === value ? "is-on" : ""}
							onClick={() => choose(value)}
						>
							{mode === value && (
								<motion.span
									layoutId="msTryonSwitch"
									className="ms-tryon__switch-bg"
									transition={{ type: "spring", stiffness: 420, damping: 32 }}
								/>
							)}
							<span>{value === "with" ? "Avec" : "Sans"}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default ShopTryOn;
