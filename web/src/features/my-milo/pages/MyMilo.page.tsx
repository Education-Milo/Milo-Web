import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, useAnimations } from "@react-three/drei";
import { Backpack, Plus, ShoppingBag, Sparkles, Swords, Undo2 } from "lucide-react";
import "@features/milo-shop/styles/MiloShop.css";
import "@features/my-milo/styles/MyMilo.css";
import { useNavigate } from "react-router-dom";
import { showToast } from "@shared/store/toast/toast.store";
import { useUserStore } from "@shared/store/user/user.store";
import {
	TYPE_ICONS,
	TYPE_LABELS,
	isWheelType,
	raritySlug,
	type Cosmetic,
	type CosmeticType,
} from "@features/cosmetics/store/cosmetics.model";
import {
	getCosmeticErrorMessage,
	useEquipCosmetic,
	useLocker,
	useUnequipCosmetics,
} from "@features/cosmetics/store/cosmetics.queries";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useMiloInstance } from "@features/my-milo/hooks/useMiloInstance";
import {
	applyAngelCircleGlow,
	applyEquippedAccessories,
	findAction,
	prepareMiloScene,
	updateAngelCircleGlow,
} from "@features/my-milo/utils/miloModel";
import CosmeticVisual from "@features/milo-shop/components/CosmeticVisual.component";
import { formatMiloros } from "@features/milo-shop/utils/format";
import LockerPickerModal from "@features/my-milo/components/LockerPickerModal";
import DuelWheel from "@features/my-milo/components/DuelWheel.component";
import MiloBubble from "@features/my-milo/components/MiloBubble.component";
import {
	WHEEL_SLOT_COUNT,
	arrangeWheel,
	assignSlot,
	clearSlot,
} from "@features/cosmetics/utils/wheelSlots";

/** Ancien stockage local de l'équipement, remplacé par l'API. */
const LEGACY_INVENTORY_KEY = "milo-inventory-storage";

/** Emplacements de la tenue, de la tête aux pieds. */
const OUTFIT_SLOTS: CosmeticType[] = [
	"cosmetic_hat",
	"cosmetic_glasses",
	"cosmetic_mustache",
	"cosmetic_tie",
	"cosmetic_shirt",
	"cosmetic_pant",
	"cosmetic_shoes",
	"cosmetic_gloves",
];
/** Gants et moustaches n'ont pas de case dédiée : affichés seulement si l'élève en possède. */
const OPTIONAL_SLOTS: CosmeticType[] = ["cosmetic_mustache", "cosmetic_gloves"];

/// --- Mise en scène (affichage seulement) ------------------------------------
/// Côté de Milo où se range chaque case : la tête à gauche, le corps à droite
const SLOT_SIDES: Partial<Record<CosmeticType, "left" | "right">> = {
	cosmetic_hat: "left",
	cosmetic_glasses: "left",
	cosmetic_mustache: "left",
	cosmetic_gloves: "left",
	cosmetic_tie: "right",
	cosmetic_shirt: "right",
	cosmetic_pant: "right",
	cosmetic_shoes: "right",
};
/// Hauteur de chaque case dans la scène (en % de la scène)
const SLOT_Y: Partial<Record<CosmeticType, number>> = {
	cosmetic_hat: 23,
	cosmetic_glasses: 39,
	cosmetic_mustache: 55,
	cosmetic_gloves: 71,
	cosmetic_tie: 38,
	cosmetic_shirt: 54,
	cosmetic_pant: 70,
	cosmetic_shoes: 86,
};
/// Ce que dit Milo quand on vient de l'habiller
const OUTFIT_CHEERS = [
	(name: string) => `J'adore ${name} !`,
	(name: string) => `Trop classe, ${name} !`,
	(name: string) => `${name}, c'est tout moi !`,
];
const WHEEL_CHEERS = [
	(name: string) => `${name} est prêt pour le duel !`,
	(name: string) => `Hâte d'envoyer ${name} en duel !`,
];

/// Animation jouée une fois quand on équipe un objet de ce type. Les autres
/// types (et le retrait d'un objet) ne déclenchent rien.
const EQUIP_REACTIONS: Partial<Record<CosmeticType, string>> = {
	cosmetic_hat: "HatLook",
	cosmetic_shirt: "EquipTop",
	cosmetic_glasses: "EquipGlasses",
};

/// Clip à jouer ; le compteur permet de rejouer le même clip deux fois de suite
type EquipReaction = { clip: string; nonce: number };

type PickerTarget = { kind: "outfit"; type: CosmeticType } | { kind: "wheel"; slot: number };

interface MiloModel3DProps {
	reaction: EquipReaction | null;
}

const MiloModel3D = ({ reaction }: MiloModel3DProps) => {
	/// Copie dédiée : la rotation et la position posées ici resteraient sinon
	/// sur la scène du .glb, partagée avec tous les autres écrans
	const { scene, animations } = useMiloInstance();
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	const { equippedMeshNames, accessoryMeshNames } = useEquippedMeshNames();

	/// Dès la phase de rendu, avant le premier frame : évite d'afficher Milo une
	/// frame en T-pose avec tous les accessoires visibles
	useMemo(() => {
		if (scene) prepareMiloScene(scene);
	}, [scene]);

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
		applyAngelCircleGlow(scene);
		scene.visible = true;
	}, [scene, equippedMeshNames, accessoryMeshNames]);

	/// Action qui joue en ce moment : tout fondu part d'elle. Sans ce suivi,
	/// équiper un chapeau pendant l'arrivée faisait partir HatLook d'un Idle
	/// arrêté, l'arrivée restait à plein poids et les deux poses se mélangeaient.
	const currentRef = useRef<THREE.AnimationAction | null>(null);

	const idleAction = useCallback(
		() => findAction(actions, "Idle") ?? findAction(actions, Object.keys(actions)[0] ?? ""),
		[actions],
	);

	const fadeTo = useCallback((next: THREE.AnimationAction | null, once: boolean) => {
		if (!next) return;
		const prev = currentRef.current;
		if (prev === next && !once) return;
		next.reset();
		next.setEffectiveTimeScale(1);
		next.setEffectiveWeight(1);
		next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
		next.clampWhenFinished = once;
		next.play();
		if (prev && prev !== next) next.crossFadeFrom(prev, 0.3, false);
		currentRef.current = next;
	}, []);

	/// Entrée en scène, puis attente en boucle
	useEffect(() => {
		if (Object.keys(actions).length === 0) return;
		const arrival = findAction(actions, "Arrival");
		if (arrival) fadeTo(arrival, true);
		else fadeTo(idleAction(), false);
	}, [actions, fadeTo, idleAction]);

	/// Un clip joué une fois (arrivée, réaction à un équipement) revient à
	/// l'attente, sauf s'il a déjà été remplacé par un autre
	useEffect(() => {
		const onFinished = (e: { action: THREE.AnimationAction }) => {
			if (e.action === currentRef.current) fadeTo(idleAction(), false);
		};
		mixer.addEventListener("finished", onFinished);
		return () => {
			mixer.removeEventListener("finished", onFinished);
		};
	}, [mixer, fadeTo, idleAction]);

	/// Réaction à l'objet qu'on vient d'équiper (jamais au chargement : la
	/// réaction n'existe qu'après un choix dans le casier)
	useEffect(() => {
		if (!reaction) return;
		fadeTo(findAction(actions, reaction.clip), true);
	}, [reaction, actions, fadeTo]);

	useFrame((state, delta) => {
		if (groupRef.current) {
			groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 1, delta * 4);
		}
		updateAngelCircleGlow(scene, state.clock.elapsedTime);
	});

	return (
		<group ref={groupRef} position={[-20, -4, -7]}>
			<primitive object={scene} position={[0, 0, -1]} scale={1} rotation={[0, -0.05, 0]} />
		</group>
	);
};

const MyMiloPage: React.FC = () => {
	const navigate = useNavigate();
	const userId = useUserStore((state) => state.user?.id);
	const [reaction, setReaction] = useState<EquipReaction | null>(null);
	const [picker, setPicker] = useState<PickerTarget | null>(null);
	// Force le recalcul de la roue quand les emplacements mémorisés changent
	const [slotVersion, setSlotVersion] = useState(0);

	const { data: locker, isLoading, isError } = useLocker();
	const equipMutation = useEquipCosmetic();
	const unequipMutation = useUnequipCosmetics();
	const isBusy = equipMutation.isPending || unequipMutation.isPending;

	useEffect(() => {
		try {
			localStorage.removeItem(LEGACY_INVENTORY_KEY);
		} catch {
			// stockage indisponible : rien à nettoyer
		}
	}, []);

	const items = useMemo(() => locker?.items ?? [], [locker]);
	const wheelSize = locker?.wheel_size ?? WHEEL_SLOT_COUNT;
	const wheelUsed = locker?.wheel_used ?? 0;

	/// Tenue : l'objet équipé par emplacement (clé absente = rien)
	const equippedByType = useMemo(() => {
		const map = new Map<CosmeticType, Cosmetic>();
		items.forEach((item) => {
			if (item.is_equipped && !isWheelType(item.type)) map.set(item.type, item);
		});
		return map;
	}, [items]);

	const outfitSlots = useMemo(
		() =>
			OUTFIT_SLOTS.filter(
				(type) => !OPTIONAL_SLOTS.includes(type) || items.some((item) => item.type === type),
			),
		[items],
	);

	/// Roue : objets équipés répartis dans six cases, ordre mémorisé localement
	const wheelItems = useMemo(
		() => items.filter((item) => item.is_equipped && isWheelType(item.type)),
		[items],
	);
	const wheelSlots = useMemo(
		() => arrangeWheel(wheelItems, userId),
		// slotVersion : les emplacements mémorisés ont changé
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[wheelItems, userId, slotVersion],
	);
	const ownedWheelItems = useMemo(() => items.filter((item) => isWheelType(item.type)), [items]);

	const notifyError = useCallback((error: unknown) => showToast(getCosmeticErrorMessage(error), "error"), []);

	// ── Tenue ────────────────────────────────────────────────────────────────
	const equipOutfit = (item: Cosmetic) => {
		if (isBusy) return;
		const clip = EQUIP_REACTIONS[item.type];
		if (clip) setReaction((prev) => ({ clip, nonce: (prev?.nonce ?? 0) + 1 }));
		equipMutation.mutate(
			{ cosmeticId: item.id, equipped: true },
			{ onSuccess: () => setPicker(null), onError: notifyError },
		);
	};

	const unequipType = (type: CosmeticType) => {
		if (isBusy) return;
		unequipMutation.mutate(type, {
			onSuccess: () => setPicker(null),
			onError: notifyError,
		});
	};

	// ── Roue ─────────────────────────────────────────────────────────────────
	const placeInWheelSlot = async (slot: number, item: Cosmetic) => {
		if (isBusy || userId === undefined) return;
		const current = wheelSlots[slot];
		try {
			// Déjà dans la roue ailleurs : simple déplacement, aucun appel serveur
			if (item.is_equipped) {
				if (current && current.id !== item.id) {
					await equipMutation.mutateAsync({ cosmeticId: current.id, equipped: false });
				}
				assignSlot(userId, slot, item.id);
				setSlotVersion((v) => v + 1);
				setPicker(null);
				return;
			}
			if (current) {
				await equipMutation.mutateAsync({ cosmeticId: current.id, equipped: false });
			}
			await equipMutation.mutateAsync({ cosmeticId: item.id, equipped: true });
			assignSlot(userId, slot, item.id);
			setSlotVersion((v) => v + 1);
			setPicker(null);
		} catch (error) {
			notifyError(error);
		}
	};

	const clearWheelSlot = (slot: number) => {
		if (isBusy || userId === undefined) return;
		const current = wheelSlots[slot];
		if (!current) return;
		equipMutation.mutate(
			{ cosmeticId: current.id, equipped: false },
			{
				onSuccess: () => {
					clearSlot(userId, slot);
					setSlotVersion((v) => v + 1);
					setPicker(null);
				},
				onError: notifyError,
			},
		);
	};

	const unequipAll = () => {
		if (isBusy) return;
		unequipMutation.mutate(undefined, {
			onSuccess: (data) => {
				showToast(
					data.unequipped === 0
						? "Milo ne portait déjà rien."
						: `Tout est retiré (${data.unequipped}). Tes objets restent dans ton casier.`,
					data.unequipped === 0 ? "info" : "success",
				);
			},
			onError: notifyError,
		});
	};

	// ── Popup courante ───────────────────────────────────────────────────────
	const pickerProps = (() => {
		if (!picker) return null;
		if (picker.kind === "outfit") {
			const current = equippedByType.get(picker.type) ?? null;
			return {
				title: TYPE_LABELS[picker.type],
				subtitle: "Choisis ce que Milo porte à cet emplacement",
				icon: <span aria-hidden="true">{TYPE_ICONS[picker.type]}</span>,
				items: items.filter((item) => item.type === picker.type),
				currentId: current?.id ?? null,
				emptyText: `Tu ne possèdes encore aucun objet de type « ${TYPE_LABELS[picker.type]} ».`,
				onPick: equipOutfit,
				onUnequip: () => unequipType(picker.type),
			};
		}
		const current = wheelSlots[picker.slot];
		const usedElsewhere = new Set(
			wheelSlots.filter((s, i): s is Cosmetic => Boolean(s) && i !== picker.slot).map((s) => s.id),
		);
		return {
			title: `Emplacement ${picker.slot + 1} de la roue`,
			subtitle: "Un sticker ou une danse à utiliser pendant les duels",
			icon: <Swords size={24} />,
			items: ownedWheelItems,
			currentId: current?.id ?? null,
			usedElsewhereIds: usedElsewhere,
			emptyText: "Tu ne possèdes encore ni sticker ni danse.",
			onPick: (item: Cosmetic) => void placeInWheelSlot(picker.slot, item),
			onUnequip: () => clearWheelSlot(picker.slot),
		};
	})();

	// ── Mise en scène (affichage seulement) ──────────────────────────────────
	const calm = useReducedMotion() ?? false;

	/// Milo commente ce qu'on vient de lui mettre. On compare l'équipement à
	/// celui du rendu précédent ; le premier chargement ne déclenche rien.
	const [cheer, setCheer] = useState<string | null>(null);
	const seenOutfit = useRef<Map<CosmeticType, number> | null>(null);
	const seenWheel = useRef<Set<number> | null>(null);
	useEffect(() => {
		if (!locker) return;
		const outfit = new Map([...equippedByType].map(([type, item]) => [type, item.id]));
		const wheel = new Set(wheelItems.map((item) => item.id));
		const prevOutfit = seenOutfit.current;
		const prevWheel = seenWheel.current;
		seenOutfit.current = outfit;
		seenWheel.current = wheel;
		if (!prevOutfit || !prevWheel) return;

		const newOutfit = [...equippedByType.values()].find((item) => prevOutfit.get(item.type) !== item.id);
		const newWheel = wheelItems.find((item) => !prevWheel.has(item.id));
		if (newOutfit) setCheer(OUTFIT_CHEERS[newOutfit.id % OUTFIT_CHEERS.length](newOutfit.name));
		else if (newWheel) setCheer(WHEEL_CHEERS[newWheel.id % WHEEL_CHEERS.length](newWheel.name));
		else if (outfit.size === 0 && wheel.size === 0 && (prevOutfit.size > 0 || prevWheel.size > 0)) {
			setCheer("Me revoilà au naturel !");
		}
	}, [locker, equippedByType, wheelItems]);

	const bubbleText = isLoading
		? "J'ouvre mon casier…"
		: isError
			? "Mon casier refuse de s'ouvrir…"
			: (cheer ??
				(equippedByType.size === 0
					? "Je n'ai rien sur le dos ! Choisis-moi une tenue."
					: "Touche une case pour changer ma tenue."));

	return (
		<ScreenLayout>
			<div className="mm">
				<div className="mm-wrap">
					{/* ---------- En-tête ---------- */}
					<motion.header
						className="mm-head"
						initial={calm ? false : { opacity: 0, y: -14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45, ease: "easeOut" }}
					>
						<div className="mm-head__copy">
							<h1 className="mm-title">Mon Milo</h1>
							<p className="mm-lead">Touche une case autour de Milo pour changer sa tenue, puis prépare ta roue de duel.</p>
						</div>

						<div className="mm-head__side">
							<div className="mm-head__stats">
								{locker && (
									<div className="mm-wallet" title="Ton solde de miloros">
										<img src="/landing/emoji/coin.webp" alt="" className="mm-wallet__coin" draggable={false} />
										<span className="mm-wallet__amount">{formatMiloros(locker.miloro_coin)}</span>
										<span className="mm-wallet__unit">miloros</span>
									</div>
								)}
								<div className="mm-stat" title="Objets dans ton casier">
									<span className="mm-stat__icon" aria-hidden="true"><Backpack size={20} strokeWidth={2.4} /></span>
									<span className="mm-stat__value">{items.length}</span>
									<span className="mm-stat__unit">{items.length > 1 ? "objets" : "objet"}</span>
								</div>
							</div>
							<div className="mm-head__actions">
								<button type="button" className="mm-btn mm-btn--primary" onClick={() => navigate("/boutique")}>
									<ShoppingBag size={19} aria-hidden="true" /> Boutique
								</button>
								<button
									type="button"
									className="mm-btn mm-btn--ghost"
									onClick={unequipAll}
									disabled={isBusy}
									title="Retire la tenue complète et la roue. Tes objets restent dans ton casier."
								>
									<Undo2 size={18} aria-hidden="true" /> Tout enlever
								</button>
							</div>
						</div>
					</motion.header>

					<main className="mm-main">
						{/* ---------- Loge : Milo et sa tenue ---------- */}
						<motion.section
							className={`mm-stage${isBusy ? " is-busy" : ""}`}
							aria-labelledby="mm-outfit-title"
							initial={calm ? false : { opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.05 }}
						>
							<div className="mm-stage__inner">
								<div className="mm-stage__scene" aria-hidden="true">
									<div className="mm-stage__orbit"><i /><i /><i /></div>
									<div className="mm-stage__sun" />
									<div className="mm-stage__podium" />
									<div className="mm-stage__shadow" />
									<img className="mm-stage__float mm-stage__float--1" src="/landing/emoji/sparkles.webp" alt="" />
								</div>

								<div className="mm-stage__canvas" aria-hidden="true">
									{/* offsetSize : le canvas prend la taille de mise en page de sa
									    boîte, sans les transformations des parents. Sinon, mesuré
									    pendant une animation d'entrée, il restait trop petit (et Milo
									    décalé de son socle) jusqu'au premier scroll. */}
									<Canvas camera={{ position: [0, 0, 5], fov: 45 }} resize={{ offsetSize: true }}>
										<Environment preset="sunset" environmentIntensity={1.2} />
										<directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" castShadow />
										<ambientLight intensity={0.2} />
										<MiloModel3D reaction={reaction} />
									</Canvas>
								</div>

								<header className="mm-stage__head">
									<h2 id="mm-outfit-title" className="mm-h2">Sa tenue</h2>
									{locker && (
										<span className="mm-count" aria-label={`${equippedByType.size} emplacements remplis sur ${outfitSlots.length}`}>
											{equippedByType.size}/{outfitSlots.length}
										</span>
									)}
								</header>

								<MiloBubble text={bubbleText} className="mm-stage__bubble" />

								{isError && (
									<div className="mm-stage__error" role="alert">
										<img src="/landing/emoji/locked.webp" alt="" draggable={false} />
										<p>Impossible de charger ton casier pour le moment.</p>
									</div>
								)}

								{isLoading && (
									<ul className="mm-slots is-loading" aria-label="Ouverture du casier...">
										{OUTFIT_SLOTS.filter((t) => !OPTIONAL_SLOTS.includes(t)).map((type) => (
											<li
												key={type}
												className={`mm-slot-wrap is-${SLOT_SIDES[type]}`}
												style={{ "--y": `${SLOT_Y[type]}%` } as React.CSSProperties}
											>
												<span className="mm-slot mm-slot--skeleton" />
											</li>
										))}
									</ul>
								)}

								{locker && (
										<ul className="mm-slots">
											{outfitSlots.map((type, index) => {
												const item = equippedByType.get(type);
												const side = SLOT_SIDES[type] ?? "right";
												return (
													<li
														key={type}
														className={`mm-slot-wrap is-${side}`}
														style={{ "--y": `${SLOT_Y[type] ?? 50}%` } as React.CSSProperties}
													>
														<motion.button
															type="button"
															className={`mm-slot ${item ? `is-filled ms-r-${raritySlug(item.rarity)}` : "is-empty"}`}
															onClick={() => setPicker({ kind: "outfit", type })}
															disabled={isBusy}
															title={item ? `${TYPE_LABELS[type]} : ${item.name}` : `${TYPE_LABELS[type]} : rien d'équipé`}
															initial={calm ? false : { opacity: 0, x: side === "left" ? -26 : 26, scale: 0.9 }}
															animate={{ opacity: 1, x: 0, scale: 1 }}
															transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.45 + index * 0.06 }}
														>
															<motion.span
																key={item?.id ?? "empty"}
																className="mm-slot__visual"
																initial={calm ? false : { scale: 0.45, rotate: -18 }}
																animate={{ scale: 1, rotate: 0 }}
																transition={{ type: "spring", stiffness: 420, damping: 16 }}
															>
																{item ? (
																	<CosmeticVisual item={item} className="mm-slot__img" />
																) : (
																	<>
																		<span className="mm-slot__ghost" aria-hidden="true">{TYPE_ICONS[type]}</span>
																		<Plus className="mm-slot__plus" size={18} strokeWidth={3} />
																	</>
																)}
															</motion.span>
															{item && <span key={`burst-${item.id}`} className="mm-burst" aria-hidden="true" />}
															<span className="mm-slot__text">
																<span className="mm-slot__type">{TYPE_LABELS[type]}</span>
																<span className="mm-slot__name">{item ? item.name : "Ajouter"}</span>
															</span>
															{item?.rarity === "legendaire" && (
																<Sparkles className="mm-slot__legend" size={16} aria-hidden="true" />
															)}
														</motion.button>
													</li>
												);
											})}
										</ul>
								)}
							</div>
						</motion.section>

						{/* ---------- Roue des duels ---------- */}
						<motion.section
							className="mm-wheelcard"
							aria-labelledby="mm-wheel-title"
							initial={calm ? false : { opacity: 0, y: 22 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
						>
							<div className="mm-wheelcard__layout">
							<header className="mm-wheelcard__head">
								<h2 id="mm-wheel-title" className="mm-h2">Roue des duels</h2>
								{locker && (
									<span className={`mm-count${wheelUsed >= wheelSize ? " is-full" : ""}`}>
										{wheelUsed}/{wheelSize}
									</span>
								)}
							</header>
							<p className="mm-wheelcard__hint">
								Stickers et danses envoyés à ton adversaire pendant un duel. Touche une case pour la remplir.
							</p>

							<div className="mm-wheelcard__body">
								{locker ? (
									<DuelWheel
										slots={wheelSlots}
										used={wheelUsed}
										size={wheelSize}
										disabled={isBusy}
										onOpenSlot={(slot) => setPicker({ kind: "wheel", slot })}
									/>
								) : (
									<div className={`mm-wheel mm-wheel--placeholder${isError ? " is-error" : ""}`} aria-hidden="true">
										<div className="mm-wheel__hub">
											{isError ? (
												<img src="/landing/emoji/locked.webp" alt="" className="mm-wheel__hub-icon" draggable={false} />
											) : (
												<span className="mm-spin-ring" />
											)}
										</div>
									</div>
								)}
							</div>

							{locker && (
								<p className="mm-wheelcard__foot">
									<img src="/landing/emoji/video_game.webp" alt="" draggable={false} />
									<span>
										{ownedWheelItems.length === 0
											? "Aucun sticker ni danse dans ton casier pour l'instant."
											: `${ownedWheelItems.length} ${ownedWheelItems.length > 1 ? "stickers et danses" : "sticker ou danse"} dans ton casier.`}
									</span>
								</p>
							)}
							</div>
						</motion.section>
					</main>
				</div>

				<AnimatePresence>
					{pickerProps && (
						<LockerPickerModal
							key="picker"
							{...pickerProps}
							busy={isBusy}
							onClose={() => setPicker(null)}
							onShop={() => navigate("/boutique")}
						/>
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default MyMiloPage;
