import React, { useState, useMemo } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
	ShoppingBag,
	Star,
	Clock,
	DoorOpen,
	WandSparkles,
	Sparkles,
} from "lucide-react";
import "@features/milo-shop/styles/MiloShop.css";
import { useNavigate } from "react-router-dom";

// Variantes pour l'apparition en cascade
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1, delayChildren: 0.2 },
	},
};

const itemVariants = {
	hidden: { y: 30, opacity: 0, scale: 0.9 },
	visible: {
		y: 0,
		opacity: 1,
		scale: 1,
		transition: { type: "spring", stiffness: 100, damping: 12 },
	},
};

const BoutiquePage: React.FC = () => {
	const navigate = useNavigate();
	const [activeCategory, setActiveCategory] = useState<
		"Tous" | "Chapeau" | "Vêtement" | "Mobilier"
	>("Tous");
	const [userCoins, setUserCoins] = useState(1250);
	const [confirmPurchase, setConfirmPurchase] = useState<any | null>(null);

	const [inventory, setInventory] = useState([
		{
			id: 1,
			name: "Casquette Milo Orange",
			category: "Chapeau",
			price: 150,
			rarity: "Commun",
			icon: "🧢",
			owned: false,
		},
		{
			id: 2,
			name: "T-Shirt Aventurier",
			category: "Vêtement",
			price: 300,
			rarity: "Rare",
			icon: "👕",
			owned: true,
		},
		{
			id: 3,
			name: "Lunettes Pixel",
			category: "Chapeau",
			price: 600,
			rarity: "Épique",
			icon: "🕶️",
			owned: false,
			onSale: true,
		},
		{
			id: 4,
			name: "Couronne Royale",
			category: "Chapeau",
			price: 1500,
			rarity: "Légendaire",
			icon: "👑",
			owned: false,
		},
		{
			id: 5,
			name: "Horloge Moderne",
			category: "Mobilier",
			price: 400,
			rarity: "Rare",
			icon: <Clock />,
			owned: false,
		},
		{
			id: 6,
			name: "Porte-manteau Renard",
			category: "Mobilier",
			price: 550,
			rarity: "Épique",
			icon: <DoorOpen />,
			owned: false,
		},
		{
			id: 7,
			name: "Halo Étincelant",
			category: "Chapeau",
			price: 2500,
			rarity: "Légendaire",
			icon: <Sparkles />,
			owned: false,
		},
	]);

	const filteredItems = useMemo(
		() =>
			inventory.filter(
				(i) => activeCategory === "Tous" || i.category === activeCategory,
			),
		[inventory, activeCategory],
	);

	const finalizePurchase = () => {
		if (confirmPurchase) {
			setUserCoins((prev) => prev - confirmPurchase.price);
			setInventory(
				inventory.map((i) =>
					i.id === confirmPurchase.id ? { ...i, owned: true } : i,
				),
			);
			setConfirmPurchase(null);
		}
	};

	return (
		<ScreenLayout>
			<div className="shop-viewport">
				<aside className="shop-sidebar-floating">
					<div className="shop-logo-section">
						<motion.div
							className="shop-icon-wrapper"
							animate={{ rotate: [0, -10, 10, 0] }}
							transition={{ repeat: Infinity, duration: 4 }}
						>
							<ShoppingBag size={24} />
						</motion.div>
						<h2>Milo Store</h2>
					</div>

					<nav className="shop-nav-list">
						{["Tous", "Chapeau", "Vêtement", "Mobilier"].map((cat) => (
							<button
								key={cat}
								className={`shop-nav-item ${activeCategory === cat ? "is-active" : ""}`}
								onClick={() => setActiveCategory(cat as any)}
							>
								<motion.div
									className="nav-bullet"
									animate={
										activeCategory === cat
											? { scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }
											: {}
									}
									transition={{ repeat: Infinity, duration: 2 }}
								/>
								<span>{cat}</span>
								{activeCategory === cat && (
									<motion.div
										layoutId="nav-bg"
										className="nav-active-bg"
										transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
									/>
								)}
							</button>
						))}
					</nav>

					<motion.button
						className="shop-btn-customize"
						whileHover={{
							scale: 1.05,
							boxShadow: "0 10px 25px rgba(74, 63, 53, 0.2)",
						}}
						whileTap={{ scale: 0.95 }}
						onClick={() => navigate("/mon-milo")}
					>
						<WandSparkles size={18} />
						<span>Personnaliser</span>
					</motion.button>
				</aside>

				<main className="shop-content-area">
					<header className="shop-top-bar">
						<motion.h1
							className="shop-view-title"
							initial={{ x: -30, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							transition={{ duration: 0.8 }}
						>
							La Collection
						</motion.h1>
						<motion.div
							className="shop-wallet-pill"
							whileHover={{ y: -3, scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
							>
								<Star fill="#E28743" color="#E28743" size={20} />
							</motion.div>
							<span className="coin-count">
								Miloro : {userCoins.toLocaleString()}
							</span>
						</motion.div>
					</header>

					<div className="shop-grid-container">
						<LayoutGroup>
							<motion.div
								className="shop-items-grid"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
							>
								<AnimatePresence mode="popLayout">
									{filteredItems.map((item) => (
										<motion.div
											key={item.id}
											layout
											variants={itemVariants}
											className={`shop-item-card rarity-${item.rarity.toLowerCase()}`}
										>
											{item.onSale && (
												<motion.div
													className="shop-sale-badge"
													animate={{ scale: [1, 1.15, 1] }}
													transition={{ repeat: Infinity, duration: 2 }}
												>
													Promo
												</motion.div>
											)}
											<div className="shop-item-preview">
												<motion.span
													className="shop-item-icon"
													whileHover={{ scale: 1.2, rotate: 8 }}
												>
													{item.icon}
												</motion.span>
												<div className="shop-item-glow" />
												<div className="shop-item-particles" />
											</div>
											<div className="shop-item-body">
												<span className="shop-item-rarity">{item.rarity}</span>
												<h3>{item.name}</h3>
												<motion.button
													className={`shop-buy-btn ${item.owned ? "is-owned" : ""}`}
													whileHover={
														!item.owned
															? {
																	scale: 1.0,
																	backgroundColor: "#E28743",
																	color: "#FFF",
																}
															: {}
													}
													whileTap={{ scale: 0.95 }}
													onClick={() =>
														!item.owned &&
														userCoins >= item.price &&
														setConfirmPurchase(item)
													}
													disabled={item.owned || userCoins < item.price}
												>
													{item.owned ? (
														"Possédé"
													) : (
														<>
															<Star size={14} fill="currentColor" />{" "}
															{item.price}
														</>
													)}
												</motion.button>
											</div>
										</motion.div>
									))}
								</AnimatePresence>
							</motion.div>
						</LayoutGroup>
					</div>
				</main>

				<AnimatePresence>
					{confirmPurchase && (
						<motion.div
							className="shop-overlay"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setConfirmPurchase(null)}
						>
							<motion.div
								className="shop-modal"
								initial={{ scale: 0.8, y: 50, opacity: 0 }}
								animate={{ scale: 1, y: 0, opacity: 1 }}
								exit={{ scale: 0.8, opacity: 0 }}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="modal-glow" />
								<h3>Confirmer l'achat ?</h3>
								<motion.div
									className="shop-modal-preview"
									animate={{ y: [0, -10, 0] }}
									transition={{ repeat: Infinity, duration: 3 }}
								>
									{confirmPurchase.icon}
								</motion.div>
								<p>{confirmPurchase.name}</p>
								<div className="shop-modal-actions">
									<button
										className="shop-btn-cancel"
										onClick={() => setConfirmPurchase(null)}
									>
										Plus tard
									</button>
									<button
										className="shop-btn-confirm"
										onClick={finalizePurchase}
									>
										Débloquer ({confirmPurchase.price})
									</button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default BoutiquePage;
