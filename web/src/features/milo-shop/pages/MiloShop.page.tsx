import React, { useState } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ShoppingBag, Star, WandSparkles, PackageOpen, Loader } from "lucide-react";
import "@features/milo-shop/styles/MiloShop.css";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { showToast } from "@shared/store/toast/toast.store";
import {
	ALL_TYPES,
	RARITIES,
	RARITY_LABELS,
	TYPE_ICONS,
	TYPE_LABELS,
	raritySlug,
	type Cosmetic,
	type CosmeticRarity,
	type CosmeticType,
} from "@features/cosmetics/store/cosmetics.model";
import {
	getCosmeticErrorMessage,
	useBuyCosmetic,
	useCosmetics,
} from "@features/cosmetics/store/cosmetics.queries";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.08, delayChildren: 0.15 },
	},
};

const itemVariants = {
	hidden: { y: 30, opacity: 0, scale: 0.9 },
	visible: {
		y: 0,
		opacity: 1,
		scale: 1,
		transition: { type: "spring", stiffness: 100, damping: 12 },
	} as const,
};

/** Visuel d'un objet : image du catalogue, sinon pictogramme du type. */
export const CosmeticVisual: React.FC<{ item: Cosmetic; className?: string }> = ({ item, className }) => (
	item.image_url ? (
		<img src={item.image_url} alt="" className={className} draggable={false} />
	) : (
		<span className={className} aria-hidden="true">{TYPE_ICONS[item.type] ?? "🎁"}</span>
	)
);

const BoutiquePage: React.FC = () => {
	const navigate = useNavigate();
	const [activeType, setActiveType] = useState<CosmeticType | "">("");
	const [activeRarity, setActiveRarity] = useState<CosmeticRarity | "">("");
	const [confirmPurchase, setConfirmPurchase] = useState<Cosmetic | null>(null);
	const [purchaseError, setPurchaseError] = useState<string | null>(null);

	// Seule source du solde affiché : miloro_coin de /users/me
	const miloroCoin = useUserStore((state) => state.user?.miloro_coin ?? 0);

	const {
		data: catalogue = [],
		isLoading,
		isError,
		isFetching,
	} = useCosmetics({
		...(activeType ? { type: activeType } : {}),
		...(activeRarity ? { rarity: activeRarity } : {}),
	});
	const buyMutation = useBuyCosmetic();

	const finalizePurchase = () => {
		if (!confirmPurchase) return;
		setPurchaseError(null);
		buyMutation.mutate(confirmPurchase.id, {
			onSuccess: (data) => {
				showToast(
					`${data.cosmetic.name} débloqué ! Nouveau solde : ${data.miloro_coin.toLocaleString("fr-FR")} miloros.`,
					"success",
				);
				setConfirmPurchase(null);
			},
			onError: (error) => {
				// 402 solde insuffisant, 409 déjà possédé, 404 retiré : message du backend
				setPurchaseError(getCosmeticErrorMessage(error));
			},
		});
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
						{[{ value: "" as const, label: "Tous" }, ...ALL_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))].map((cat) => (
							<button
								key={cat.value || "all"}
								className={`shop-nav-item ${activeType === cat.value ? "is-active" : ""}`}
								onClick={() => setActiveType(cat.value)}
							>
								<motion.div
									className="nav-bullet"
									animate={
										activeType === cat.value
											? { scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }
											: {}
									}
									transition={{ repeat: Infinity, duration: 2 }}
								/>
								<span>{cat.label}</span>
								{activeType === cat.value && (
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
						<div className="shop-top-right">
							<select
								className="shop-rarity-select"
								value={activeRarity}
								onChange={(e) => setActiveRarity(e.target.value as CosmeticRarity | "")}
								aria-label="Filtrer par rareté"
							>
								<option value="">Toutes les raretés</option>
								{RARITIES.map((r) => (
									<option key={r} value={r}>{RARITY_LABELS[r]}</option>
								))}
							</select>
							<motion.div
								className="shop-wallet-pill"
								whileHover={{ y: -3, scale: 1.05 }}
								title="Ton solde de miloros"
							>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
								>
									<Star fill="#E28743" color="#E28743" size={20} />
								</motion.div>
								<span className="coin-count">
									Miloro : {miloroCoin.toLocaleString("fr-FR")}
								</span>
							</motion.div>
						</div>
					</header>

					<div className={`shop-grid-container ${isFetching ? "is-fetching" : ""}`}>
						{isLoading && (
							<div className="shop-state">
								<Loader size={28} className="shop-spin" />
								<p>Chargement de la collection...</p>
							</div>
						)}
						{isError && (
							<div className="shop-state">
								<p>Impossible de charger la boutique pour le moment.</p>
							</div>
						)}
						{!isLoading && !isError && catalogue.length === 0 && (
							<div className="shop-state shop-empty">
								<PackageOpen size={42} />
								<h3>Rien en rayon pour l'instant</h3>
								<p>
									{activeType || activeRarity
										? "Aucun objet ne correspond à ces filtres."
										: "Les premiers objets arrivent bientôt. Reviens vite !"}
								</p>
							</div>
						)}

						<LayoutGroup>
							<motion.div
								className="shop-items-grid"
								variants={containerVariants}
								initial="hidden"
								animate="visible"
							>
								<AnimatePresence mode="popLayout">
									{catalogue.map((item) => {
										const canAfford = miloroCoin >= item.price;
										return (
											<motion.div
												key={item.id}
												layout
												variants={itemVariants}
												className={`shop-item-card rarity-${raritySlug(item.rarity)}`}
											>
												<div className="shop-item-preview">
													<motion.span
														className="shop-item-icon"
														whileHover={{ scale: 1.15, rotate: 6 }}
													>
														<CosmeticVisual item={item} className="shop-item-visual" />
													</motion.span>
													<div className="shop-item-glow" />
													<div className="shop-item-particles" />
												</div>
												<div className="shop-item-body">
													<span className="shop-item-rarity">
														{RARITY_LABELS[item.rarity] ?? item.rarity}
													</span>
													<h3>{item.name}</h3>
													<span className="shop-item-type">{TYPE_LABELS[item.type] ?? item.type}</span>
													<motion.button
														className={`shop-buy-btn ${item.owned ? "is-owned" : ""} ${!item.owned && !canAfford ? "is-unaffordable" : ""}`}
														whileHover={!item.owned ? { scale: 1.02 } : {}}
														whileTap={!item.owned ? { scale: 0.95 } : {}}
														onClick={() => {
															if (item.owned) return;
															setPurchaseError(null);
															setConfirmPurchase(item);
														}}
														disabled={item.owned}
														title={
															item.owned
																? "Déjà dans ton casier"
																: canAfford
																	? "Acheter"
																	: "Solde insuffisant"
														}
													>
														{item.owned ? (
															"Possédé"
														) : (
															<>
																<Star size={14} fill="currentColor" /> {item.price.toLocaleString("fr-FR")}
															</>
														)}
													</motion.button>
												</div>
											</motion.div>
										);
									})}
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
							onClick={() => !buyMutation.isPending && setConfirmPurchase(null)}
						>
							<motion.div
								className="shop-modal"
								initial={{ scale: 0.8, y: 50, opacity: 0 }}
								animate={{ scale: 1, y: 0, opacity: 1 }}
								exit={{ scale: 0.8, opacity: 0 }}
								onClick={(e) => e.stopPropagation()}
								role="dialog"
								aria-labelledby="shop-confirm-title"
							>
								<div className="modal-glow" />
								<h3 id="shop-confirm-title">Confirmer l'achat ?</h3>
								<motion.div
									className="shop-modal-preview"
									animate={{ y: [0, -10, 0] }}
									transition={{ repeat: Infinity, duration: 3 }}
								>
									<CosmeticVisual item={confirmPurchase} className="shop-modal-visual" />
								</motion.div>
								<p>{confirmPurchase.name}</p>
								{miloroCoin >= confirmPurchase.price ? (
									<p className="shop-modal-balance">
										Solde après achat :{" "}
										<strong>{(miloroCoin - confirmPurchase.price).toLocaleString("fr-FR")}</strong> miloros
									</p>
								) : (
									<p className="shop-modal-balance shop-modal-balance--short">
										Il te manque{" "}
										<strong>{(confirmPurchase.price - miloroCoin).toLocaleString("fr-FR")}</strong> miloros
									</p>
								)}
								{purchaseError && (
									<p className="shop-modal-error" role="alert">{purchaseError}</p>
								)}
								<div className="shop-modal-actions">
									<button
										className="shop-btn-cancel"
										onClick={() => setConfirmPurchase(null)}
										disabled={buyMutation.isPending}
									>
										Plus tard
									</button>
									<button
										className="shop-btn-confirm"
										onClick={finalizePurchase}
										disabled={buyMutation.isPending}
									>
										{buyMutation.isPending
											? "Achat en cours..."
											: `Débloquer (${confirmPurchase.price.toLocaleString("fr-FR")})`}
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
