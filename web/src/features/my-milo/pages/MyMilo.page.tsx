import React, { useState, useEffect, useRef } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
	useGLTF,
	Environment,
	useAnimations,
} from "@react-three/drei";
import {
	WandSparkles,
	Shirt,
	Crown,
	BookOpenText,
	CheckCircle2,
	ShoppingBag,
	DoorOpen,
	Sparkles,
} from "lucide-react";
import "@features/my-milo/styles/MyMilo.css";
import { useNavigate } from "react-router-dom";
import { useMiloInventoryStore } from "../store/miloInventory.store";
import { MILO_ITEMS } from "../data/miloItems.data";

interface MiloModel3DProps {
	hatTrigger: number;
}

const MiloModel3D = ({ hatTrigger }: MiloModel3DProps) => {
	const { scene, animations } = useGLTF("/MiloV7.glb");
	const { actions, mixer } = useAnimations(animations, scene);
	const groupRef = useRef<THREE.Group>(null);

	const equippedItemIds = useMiloInventoryStore((state) => state.equippedItemIds);

	const equippedMeshNames = React.useMemo(() => {
		return equippedItemIds
			.map((id) => MILO_ITEMS.find((i) => i.id === id)?.meshName)
			.filter(Boolean) as string[];
	}, [equippedItemIds]);

	useEffect(() => {
		if (!scene) return;
		
		const knownMeshNames = MILO_ITEMS.map(i => i.meshName).filter(Boolean) as string[];

		scene.traverse((child) => {
			if (knownMeshNames.includes(child.name)) {
				child.visible = equippedMeshNames.includes(child.name);
			}
		});
	}, [scene, equippedMeshNames]);

	useEffect(() => {
		if (hatTrigger === 0) return;
		const hatName = Object.keys(actions).find((n) => n.toLowerCase() === "hatlook"); //METTRE ANIMATION CHAPEAU
		const hatAction = hatName ? actions[hatName] : null;
		const idleName = Object.keys(actions).find((n) => n.toLowerCase() === "idle") || Object.keys(actions)[0];
		const idleAction = idleName ? actions[idleName] : null;

		if (hatAction && idleAction) {
			hatAction.reset().setLoop(THREE.LoopOnce, 1);
			hatAction.clampWhenFinished = true;
			hatAction.play().crossFadeFrom(idleAction, 0.3, true);

			const onFinished = (e: any) => {
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

			const onFinished = (e: any) => {
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
	const { toggleEquip, isEquipped } = useMiloInventoryStore();
	const [activeCategory, setActiveCategory] = useState<
		"Personnalisation" | "Classe"
	>("Personnalisation");
	const [hatTrigger, setHatTrigger] = useState(0);

	const handleToggleEquip = (itemId: number) => {
		const targetItem = MILO_ITEMS.find((i) => i.id === itemId);
		const isCurrentlyEquipped = isEquipped(itemId);
		if (targetItem && targetItem.category === "Chapeau" && !isCurrentlyEquipped) {
			setHatTrigger((prev) => prev + 1);
		}
		toggleEquip(itemId);
	};

	const filteredItems = MILO_ITEMS.filter((item) => {
		if (activeCategory === "Personnalisation") {
			return ["Chapeau", "Lunettes", "Vêtement"].includes(item.category);
		}
		return ["Mobilier", "Classe"].includes(item.category);
	});

	return (
		<ScreenLayout>
			<div className="mymilo-container">
				{/* --- EFFETS DE FOND ANIMÉS --- */}
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
							Gère ton style et ton équipement de classe
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
						<div className="collection-score-pimped">
							<Crown className="icon-crown-animated" size={22} />
							<span className="score-val">{MILO_ITEMS.length}</span>
						</div>
					</div>
				</motion.header>

				<main className="mymilo-content">
					{/* ZONE MILO AVEC EFFET DE LUMIÈRE */}
					<motion.div
						className="milo-model-card"
						initial={{ x: -50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
					>
						<div className="milo-light-ray"></div>

						<div style={{ height: "525px", width: "150%", marginLeft: "-25%", zIndex: 10 }}>
							<Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
								<Environment preset="city" environmentIntensity={1.2} />
								<directionalLight
									position={[5, 5, 5]}
									intensity={0.8}
									color="#ffffff"
									castShadow
								/>
								{/* Lumière d'appoint (pour déboucher les ombres) */}
								<ambientLight intensity={0.2} />
									<MiloModel3D hatTrigger={hatTrigger} />
							</Canvas>
						</div>

						<div className="milo-shadow"></div>
					</motion.div>

					{/* SECTION CASIER "VESTIAIRE" */}
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
								<button
									className={`filter-chip ${activeCategory === "Personnalisation" ? "active" : ""}`}
									onClick={() => setActiveCategory("Personnalisation")}
								>
									<Shirt size={16} /> Look
								</button>
								<button
									className={`filter-chip ${activeCategory === "Classe" ? "active" : ""}`}
									onClick={() => setActiveCategory("Classe")}
								>
									<BookOpenText size={16} /> Classe
								</button>
							</div>
						</div>

						<div className="locker-scroll-area">
							<AnimatePresence mode="popLayout">
								<motion.div className="locker-grid-pimped" layout>
									{filteredItems.map((item) => (
										<motion.div
											key={item.id}
											className={`item-card-v2 rarity-${item.rarity.toLowerCase()}`}
											layout
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											whileHover={{ y: -8, rotateZ: 1 }}
										>
											{item.rarity === "Légendaire" && (
												<Sparkles className="legendary-sparkle" size={16} />
											)}
											<div className="item-preview-circle">{item.icon}</div>
											<div className="item-info-v2">
												<h3>{item.name}</h3>
												<div
													className={`rarity-tag ${item.rarity.toLowerCase()}`}
												>
													{item.rarity}
												</div>
											</div>
											<button
												className={`btn-equip-pimped ${isEquipped(item.id) ? "active" : ""}`}
												onClick={() => handleToggleEquip(item.id)}
											>
												{isEquipped(item.id) ? (
													<CheckCircle2 size={18} />
												) : (
													"Utiliser"
												)}
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
