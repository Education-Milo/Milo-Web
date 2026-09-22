import React, { useState, useEffect, useRef, useMemo } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, Environment, useAnimations } from "@react-three/drei";
import {
	WandSparkles,
	Shirt,
	Crown,
	CheckCircle2,
	ShoppingBag,
	DoorOpen,
	Sparkles,
	Sticker,
	Music2,
	Loader,
	Star,
	Undo2,
	X,
} from "lucide-react";
import "@features/my-milo/styles/MyMilo.css";
import { useNavigate } from "react-router-dom";
import { showToast } from "@shared/store/toast/toast.store";
import {
	RARITY_LABELS,
	SKIN_TYPES,
	TYPE_LABELS,
	isSkinType,
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

/** Ancien stockage local de l'équipement, remplacé par l'API. */
const LEGACY_INVENTORY_KEY = "milo-inventory-storage";

type LockerTab = "skins" | "sticker" | "dance";

const TABS: { id: LockerTab; label: string; icon: React.ReactNode }[] = [
	{ id: "skins", label: "Apparence", icon: <Shirt size={16} /> },
	{ id: "sticker", label: "Stickers", icon: <Sticker size={16} /> },
	{ id: "dance", label: "Danses", icon: <Music2 size={16} /> },
];

interface MiloModel3DProps {
	hatTrigger: number;
}

const MiloModel3D = ({ hatTrigger }: MiloModel3DProps) => {
	const { scene, animations } = useGLTF("/MiloV9.glb");
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	// Tenue équipée d'après GET /user/{id}/locker/equipped (mesh_name)
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
	const [activeTab, setActiveTab] = useState<LockerTab>("skins");
	const [skinTypeFilter, setSkinTypeFilter] = useState<CosmeticType | "">("");
	const [hatTrigger, setHatTrigger] = useState(0);

	const { data: locker, isLoading, isError } = useLocker();
	const equipMutation = useEquipCosmetic();
	const unequipMutation = useUnequipCosmetics();
	const isBusy = equipMutation.isPending || unequipMutation.isPending;

	// L'équipement est maintenant en base : on nettoie l'ancien stockage local
	useEffect(() => {
		try {
			localStorage.removeItem(LEGACY_INVENTORY_KEY);
		} catch {
			// stockage indisponible : rien à nettoyer
		}
	}, []);

	const items = useMemo(() => locker?.items ?? [], [locker]);
	const wheelSize = locker?.wheel_size ?? 6;
	const wheelUsed = locker?.wheel_used ?? 0;
	const isWheelFull = wheelUsed >= wheelSize;

	const filteredItems = useMemo(
		() =>
			items.filter((item) => {
				if (activeTab === "skins") {
					return isSkinType(item.type) && (!skinTypeFilter || item.type === skinTypeFilter);
				}
				return item.type === activeTab;
			}),
		[items, activeTab, skinTypeFilter],
	);

	// Sous-filtre : seulement les types de skins réellement possédés
	const ownedSkinTypes = useMemo(
		() => SKIN_TYPES.filter((type) => items.some((item) => item.type === type)),
		[items],
	);

	/** Retire un emplacement (type) ou tout (sans type). Les objets restent possédés. */
	const handleUnequip = (type?: CosmeticType) => {
		if (isBusy) return;
		unequipMutation.mutate(type, {
			onSuccess: (data) => {
				if (data.unequipped === 0) {
					showToast(type ? "Rien n'était équipé à cet emplacement." : "Milo ne portait déjà rien.", "info");
				} else {
					showToast(
						type
							? `${TYPE_LABELS[type]} : ${data.unequipped} objet${data.unequipped > 1 ? "s" : ""} retiré${data.unequipped > 1 ? "s" : ""}.`
							: `Tout est retiré (${data.unequipped}). Tes objets restent dans ton casier.`,
						"success",
					);
				}
			},
			onError: (error) => showToast(getCosmeticErrorMessage(error), "error"),
		});
	};

	// Skins actuellement portés, par emplacement (clé absente = rien d'équipé)
	const equippedSkins = useMemo(
		() => SKIN_TYPES.map((type) => ({ type, item: items.find((i) => i.type === type && i.is_equipped) }))
			.filter((entry): entry is { type: CosmeticType; item: Cosmetic } => Boolean(entry.item)),
		[items],
	);

	const handleToggleEquip = (item: Cosmetic) => {
		if (isBusy) return;
		const equipped = !item.is_equipped;
		if (equipped && !isSkinType(item.type) && isWheelFull) {
			showToast(
				`Ta roue est pleine (${wheelUsed}/${wheelSize}). Libère un emplacement avant d'en ajouter un.`,
				"error",
			);
			return;
		}
		if (equipped && item.type === "cosmetic_hat") {
			setHatTrigger((prev) => prev + 1);
		}
		equipMutation.mutate(
			{ cosmeticId: item.id, equipped },
			{
				onError: (error) => {
					// 409 roue pleine, 404 objet non possédé : message du backend
					showToast(getCosmeticErrorMessage(error), "error");
				},
			},
		);
	};

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
						<p className="page-subtitle">
							Gère ton style, tes stickers et tes danses
						</p>
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
							onClick={() => handleUnequip()}
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
								<directionalLight
									position={[5, 5, 5]}
									intensity={0.8}
									color="#ffffff"
									castShadow
								/>
								<ambientLight intensity={0.2} />
								<MiloModel3D hatTrigger={hatTrigger} />
							</Canvas>
						</div>

						<div className="milo-shadow"></div>
					</motion.div>

					<motion.div
						className="vestiaire-glass-box"
						initial={{ x: 50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<div className="vestiaire-header">
							<h2 className="section-title">
								<DoorOpen size={24} /> Casier d'Aventure
							</h2>
							<div className="locker-filters-pimped">
								{TABS.map((tab) => (
									<button
										key={tab.id}
										className={`filter-chip ${activeTab === tab.id ? "active" : ""}`}
										onClick={() => setActiveTab(tab.id)}
									>
										{tab.icon} {tab.label}
									</button>
								))}
							</div>
						</div>

						{/* Roue des duels : stickers et danses partagent 6 emplacements */}
						{activeTab !== "skins" && locker && (
							<div className={`wheel-status ${isWheelFull ? "is-full" : ""}`} role="status">
								<span className="wheel-status-label">Roue des duels</span>
								<div className="wheel-slots" aria-label={`${wheelUsed} emplacements occupés sur ${wheelSize}`}>
									{Array.from({ length: wheelSize }, (_, i) => (
										<span key={i} className={`wheel-slot ${i < wheelUsed ? "is-used" : ""}`} />
									))}
								</div>
								<span className="wheel-status-count">
									{wheelUsed}/{wheelSize}
									{isWheelFull ? " · pleine, libère un emplacement" : ""}
								</span>
								<button
									type="button"
									className="btn-unequip-type"
									onClick={() => handleUnequip(activeTab)}
									disabled={isBusy}
									title={`Retire tous les ${TYPE_LABELS[activeTab].toLowerCase()} de la roue`}
								>
									<X size={13} /> Retirer les {TYPE_LABELS[activeTab].toLowerCase()}
								</button>
							</div>
						)}

						{/* Tenue portée : un bouton "Retirer" par emplacement */}
						{activeTab === "skins" && equippedSkins.length > 0 && (
							<div className="equipped-bar" role="status">
								<span className="wheel-status-label">Porté</span>
								{equippedSkins.map(({ type, item }) => (
									<span key={type} className="equipped-chip">
										<span className="equipped-chip-type">{TYPE_LABELS[type]}</span>
										<span className="equipped-chip-name">{item.name}</span>
										<button
											type="button"
											className="btn-unequip-type"
											onClick={() => handleUnequip(type)}
											disabled={isBusy}
											title={`Retirer : ${TYPE_LABELS[type].toLowerCase()}`}
										>
											<X size={13} /> Retirer
										</button>
									</span>
								))}
							</div>
						)}

						{activeTab === "skins" && ownedSkinTypes.length > 1 && (
							<div className="locker-subfilters">
								<button
									className={`subfilter-chip ${skinTypeFilter === "" ? "active" : ""}`}
									onClick={() => setSkinTypeFilter("")}
								>
									Tout
								</button>
								{ownedSkinTypes.map((type) => (
									<button
										key={type}
										className={`subfilter-chip ${skinTypeFilter === type ? "active" : ""}`}
										onClick={() => setSkinTypeFilter(type)}
									>
										{TYPE_LABELS[type]}
									</button>
								))}
							</div>
						)}

						<div className="locker-scroll-area">
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
							{!isLoading && !isError && filteredItems.length === 0 && (
								<div className="locker-state">
									<p>
										{items.length === 0
											? "Ton casier est vide. Passe à la boutique pour équiper Milo !"
											: "Rien dans cette catégorie pour l'instant."}
									</p>
									<button className="btn-shop-pimped" onClick={() => navigate("/boutique")}>
										<ShoppingBag size={16} /> <span>Voir la boutique</span>
									</button>
								</div>
							)}

							<AnimatePresence mode="popLayout">
								<motion.div className="locker-grid-pimped" layout>
									{filteredItems.map((item) => (
										<motion.div
											key={item.id}
											className={`item-card-v2 rarity-${raritySlug(item.rarity)} ${item.is_equipped ? "is-equipped" : ""}`}
											layout
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											whileHover={{ y: -8, rotateZ: 1 }}
										>
											{item.rarity === "legendaire" && (
												<Sparkles className="legendary-sparkle" size={16} />
											)}
											<div className="item-preview-circle">
												<CosmeticVisual item={item} className="item-visual" />
											</div>
											<div className="item-info-v2">
												<h3>{item.name}</h3>
												<div className={`rarity-tag ${raritySlug(item.rarity)}`}>
													{RARITY_LABELS[item.rarity] ?? item.rarity}
												</div>
												<span className="item-type-tag">{TYPE_LABELS[item.type] ?? item.type}</span>
											</div>
											<button
												className={`btn-equip-pimped ${item.is_equipped ? "active" : ""}`}
												onClick={() => handleToggleEquip(item)}
												disabled={isBusy}
												title={item.is_equipped ? "Retirer" : "Équiper"}
											>
												{item.is_equipped ? <CheckCircle2 size={18} /> : "Utiliser"}
											</button>
										</motion.div>
									))}
								</motion.div>
							</AnimatePresence>
						</div>
					</motion.div>
				</main>
			</div>
		</ScreenLayout>
	);
};

export default MyMiloPage;
