import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, Environment, useAnimations } from "@react-three/drei";
import {
	WandSparkles,
	Crown,
	ShoppingBag,
	Shirt,
	Sparkles,
	Loader,
	Star,
	Undo2,
	Swords,
	Plus,
} from "lucide-react";
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
import { applyEquippedAccessories } from "@features/my-milo/utils/miloModel";
import { CosmeticVisual } from "@features/milo-shop/pages/MiloShop.page";
import LockerPickerModal from "@features/my-milo/components/LockerPickerModal";
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
	"cosmetic_tie",
	"cosmetic_shirt",
	"cosmetic_pant",
	"cosmetic_shoes",
];
/** Les gants n'ont pas de case dédiée : affichés seulement si l'élève en possède. */
const OPTIONAL_SLOTS: CosmeticType[] = ["cosmetic_gloves"];

type PickerTarget = { kind: "outfit"; type: CosmeticType } | { kind: "wheel"; slot: number };

interface MiloModel3DProps {
	hatTrigger: number;
}

const MiloModel3D = ({ hatTrigger }: MiloModel3DProps) => {
	const { scene, animations } = useGLTF("/MiloV11.glb");
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	const { equippedMeshNames, accessoryMeshNames } = useEquippedMeshNames();

	useEffect(() => {
		if (!scene) return;
		applyEquippedAccessories(scene, equippedMeshNames);
	}, [scene, equippedMeshNames, accessoryMeshNames]);

	useEffect(() => {
		if (hatTrigger === 0) return;
		const hatName = Object.keys(actions).find((n) => n.toLowerCase() === "hatlook");
		const hatAction = hatName ? actions[hatName] : null;
		const idleName = Object.keys(actions).find((n) => n.toLowerCase() === "idle") || Object.keys(actions)[0];
		const idleAction = idleName ? actions[idleName] : null;

		if (hatAction && idleAction) {
			hatAction.reset().setLoop(THREE.LoopOnce, 1);
			hatAction.clampWhenFinished = true;
			hatAction.play().crossFadeFrom(idleAction, 0.3, true);

			const onFinished = (e: { action: THREE.AnimationAction }) => {
				if (e.action === hatAction) {
					idleAction.reset().play().crossFadeFrom(hatAction, 0.3, true);
				}
			};
			mixer.addEventListener("finished", onFinished);
			return () => {
				mixer.removeEventListener("finished", onFinished);
			};
		}
	}, [hatTrigger, actions, mixer]);

	useEffect(() => {
		const arrivalName = Object.keys(actions).find((n) => n.toLowerCase() === "arrival");
		const arrivalAction = arrivalName ? actions[arrivalName] : null;
		const idleName = Object.keys(actions).find((n) => n.toLowerCase() === "idle") || Object.keys(actions)[0];
		const idleAction = idleName ? actions[idleName] : null;

		if (arrivalAction && idleAction) {
			arrivalAction.setLoop(THREE.LoopOnce, 1);
			arrivalAction.clampWhenFinished = true;
			arrivalAction.reset().play();

			const onFinished = (e: { action: THREE.AnimationAction }) => {
				if (e.action === arrivalAction) {
					idleAction.reset().crossFadeFrom(arrivalAction, 0.3, true).play();
				}
			};
			mixer.addEventListener("finished", onFinished);
			return () => {
				mixer.removeEventListener("finished", onFinished);
			};
		} else if (idleAction) {
			idleAction.reset().play();
		}
	}, [actions, mixer]);

	useFrame((_state, delta) => {
		if (groupRef.current) {
			groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 1, delta * 4);
		}
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
	const [hatTrigger, setHatTrigger] = useState(0);
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
		() => [
			...OUTFIT_SLOTS,
			...OPTIONAL_SLOTS.filter((type) => items.some((item) => item.type === type)),
		],
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
		if (item.type === "cosmetic_hat") setHatTrigger((prev) => prev + 1);
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
			icon: <Swords size={20} />,
			items: ownedWheelItems,
			currentId: current?.id ?? null,
			usedElsewhereIds: usedElsewhere,
			emptyText: "Tu ne possèdes encore ni sticker ni danse.",
			onPick: (item: Cosmetic) => void placeInWheelSlot(picker.slot, item),
			onUnequip: () => clearWheelSlot(picker.slot),
		};
	})();

	return (
		<ScreenLayout>
			<div className="mymilo-container">
				<div className="milo-bg-glow"></div>

				<motion.header
					className="mymilo-header"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<div className="header-left">
						<h1 className="page-title">
							<WandSparkles className="sparkle-icon" /> Mon Milo
						</h1>
						<p className="page-subtitle">Compose sa tenue et prépare ta roue de duel</p>
					</div>

					<div className="header-actions">
						<motion.button
							className="btn-shop-pimped"
							onClick={() => navigate("/boutique")}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<ShoppingBag size={18} /> <span>Boutique</span>
						</motion.button>
						{locker && (
							<div className="collection-score-pimped" title="Ton solde de miloros">
								<Star className="icon-crown-animated" size={20} />
								<span className="score-val">{locker.miloro_coin.toLocaleString("fr-FR")}</span>
							</div>
						)}
						<div className="collection-score-pimped" title="Objets dans ton casier">
							<Crown className="icon-crown-animated" size={22} />
							<span className="score-val">{items.length}</span>
						</div>
						<button
							type="button"
							className="btn-unequip-all"
							onClick={unequipAll}
							disabled={isBusy}
							title="Retire la tenue complète et la roue. Tes objets restent dans ton casier."
						>
							<Undo2 size={16} /> <span>Tout enlever</span>
						</button>
					</div>
				</motion.header>

				<main className="mymilo-content">
					<motion.div
						className="milo-model-card"
						initial={{ x: -50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
					>
						<div className="milo-light-ray"></div>
						<div style={{ height: "525px", width: "150%", marginLeft: "-25%", zIndex: 10 }}>
							<Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
								<Environment preset="sunset" environmentIntensity={1.2} />
								<directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" castShadow />
								<ambientLight intensity={0.2} />
								<MiloModel3D hatTrigger={hatTrigger} />
							</Canvas>
						</div>
						<div className="milo-shadow"></div>
					</motion.div>

					<motion.div
						className="vestiaire-glass-box lk-box"
						initial={{ x: 50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						{isLoading && (
							<div className="locker-state">
								<Loader size={26} className="locker-spin" />
								<p>Ouverture du casier...</p>
							</div>
						)}
						{isError && (
							<div className="locker-state">
								<p>Impossible de charger ton casier pour le moment.</p>
							</div>
						)}

						{locker && (
							<div className="lk-columns">
								{/* ── Tenue : une case par emplacement, de la tête aux pieds ── */}
								<section className="lk-section">
									<header className="lk-section-header">
										<h2 className="section-title">
											<Shirt size={22} /> Tenue
										</h2>
										<span className="lk-count">{equippedByType.size}/{outfitSlots.length}</span>
									</header>
									<ul className="outfit-slots">
										{outfitSlots.map((type) => {
											const item = equippedByType.get(type);
											return (
												<li key={type}>
													<button
														type="button"
														className={`outfit-slot ${item ? `is-filled rarity-${raritySlug(item.rarity)}` : "is-empty"}`}
														onClick={() => setPicker({ kind: "outfit", type })}
														disabled={isBusy}
														title={item ? `${TYPE_LABELS[type]} : ${item.name}` : `${TYPE_LABELS[type]} : rien d'équipé`}
													>
														<span className="outfit-slot-bg" aria-hidden="true">{TYPE_ICONS[type]}</span>
														<span className="outfit-slot-visual">
															{item ? <CosmeticVisual item={item} className="outfit-slot-img" /> : <Plus size={22} />}
														</span>
														<span className="outfit-slot-text">
															<span className="outfit-slot-type">{TYPE_LABELS[type]}</span>
															<span className="outfit-slot-name">{item ? item.name : "Vide"}</span>
														</span>
														{item?.rarity === "legendaire" && <Sparkles className="legendary-sparkle" size={16} />}
													</button>
												</li>
											);
										})}
									</ul>
								</section>

								{/* ── Roue des duels : deux rangées de trois emplacements ── */}
								<section className="lk-section">
									<header className="lk-section-header">
										<h2 className="section-title">
											<Swords size={22} /> Roue des duels
										</h2>
										<span className={`lk-count ${wheelUsed >= wheelSize ? "is-full" : ""}`}>
											{wheelUsed}/{wheelSize}
										</span>
									</header>
									<p className="lk-hint">Stickers et danses envoyés à ton adversaire pendant un duel.</p>
									<div className="duel-wheel">
										{wheelSlots.map((item, slot) => (
											<button
												key={slot}
												type="button"
												className={`wheel-slot-card ${item ? `is-filled wheel-slot-card--${item.type}` : "is-empty"}`}
												onClick={() => setPicker({ kind: "wheel", slot })}
												disabled={isBusy}
												title={item ? `Emplacement ${slot + 1} : ${item.name}` : `Emplacement ${slot + 1} : vide`}
											>
												<span className="wheel-slot-index">{slot + 1}</span>
												<span className="wheel-slot-visual">
													{item ? (
														<CosmeticVisual item={item} className="wheel-slot-img" />
													) : (
														<Plus size={20} />
													)}
												</span>
												<span className="wheel-slot-name">
													{item ? item.name : "Libre"}
												</span>
											</button>
										))}
									</div>
								</section>
							</div>
						)}
					</motion.div>
				</main>

				{pickerProps && (
					<LockerPickerModal
						{...pickerProps}
						busy={isBusy}
						onClose={() => setPicker(null)}
						onShop={() => navigate("/boutique")}
					/>
				)}
			</div>
		</ScreenLayout>
	);
};

export default MyMiloPage;
