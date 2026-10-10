import React, { useCallback, useEffect, useRef, useState } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { WandSparkles, RotateCcw } from "lucide-react";
import "@features/milo-shop/styles/MiloShop.css";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { showToast } from "@shared/store/toast/toast.store";
import {
	ALL_TYPES,
	RARITIES,
	RARITY_LABELS,
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
import ShopItemCard from "@features/milo-shop/components/ShopItemCard.component";
import PurchaseModal from "@features/milo-shop/components/PurchaseModal.component";
import { formatMiloros } from "@features/milo-shop/utils/format";

/// Réexporté : Mon Milo et le casier affichent les objets avec le même visuel
export { default as CosmeticVisual } from "@features/milo-shop/components/CosmeticVisual.component";

/// Délai avant d'afficher l'aperçu 3D d'une danse : balayer la grille à la
/// souris ne doit pas ouvrir puis fermer un contexte WebGL par case traversée
const DANCE_HOVER_DELAY = 150;

const SKELETON_COUNT = 8;

const gridVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const TYPE_FILTERS: { value: CosmeticType | ""; label: string }[] = [
	{ value: "", label: "Tout" },
	...ALL_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
];

const BoutiquePage: React.FC = () => {
	const navigate = useNavigate();
	const [activeType, setActiveType] = useState<CosmeticType | "">("");
	const [activeRarity, setActiveRarity] = useState<CosmeticRarity | "">("");
	const [confirmPurchase, setConfirmPurchase] = useState<Cosmetic | null>(null);
	const [purchaseError, setPurchaseError] = useState<string | null>(null);
	/// Une seule danse animée à la fois : un seul canvas 3D ouvert
	const [previewedDanceId, setPreviewedDanceId] = useState<number | null>(null);
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingDanceId = useRef<number | null>(null);

	useEffect(() => () => {
		if (hoverTimer.current) clearTimeout(hoverTimer.current);
	}, []);

	const startDancePreview = useCallback((id: number) => {
		if (hoverTimer.current) clearTimeout(hoverTimer.current);
		pendingDanceId.current = id;
		hoverTimer.current = setTimeout(() => setPreviewedDanceId(id), DANCE_HOVER_DELAY);
	}, []);

	/// Ciblé sur la case quittée : passer directement d'une danse à une autre
	/// ne doit pas annuler l'aperçu qui vient d'être demandé, quel que soit
	/// l'ordre dans lequel le navigateur émet entrée et sortie
	const stopDancePreview = useCallback((id: number) => {
		if (pendingDanceId.current === id && hoverTimer.current) {
			clearTimeout(hoverTimer.current);
			pendingDanceId.current = null;
		}
		setPreviewedDanceId((current) => (current === id ? null : current));
	}, []);

	// Seule source du solde affiché : miloro_coin de /users/me
	const miloroCoin = useUserStore((state) => state.user?.miloro_coin ?? 0);

	const {
		data: catalogue = [],
		isLoading,
		isError,
		isFetching,
		refetch,
	} = useCosmetics({
		...(activeType ? { type: activeType } : {}),
		...(activeRarity ? { rarity: activeRarity } : {}),
	});
	const buyMutation = useBuyCosmetic();
	const hasFilters = Boolean(activeType || activeRarity);

	const openPurchase = useCallback((item: Cosmetic) => {
		if (item.owned) return;
		setPurchaseError(null);
		setConfirmPurchase(item);
	}, []);

	const closePurchase = useCallback(() => setConfirmPurchase(null), []);

	const resetFilters = () => {
		setActiveType("");
		setActiveRarity("");
	};

	const finalizePurchase = () => {
		if (!confirmPurchase) return;
		setPurchaseError(null);
		buyMutation.mutate(confirmPurchase.id, {
			onSuccess: (data) => {
				showToast(
					`${data.cosmetic.name} débloqué ! Nouveau solde : ${formatMiloros(data.miloro_coin)} miloros.`,
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
			<div className="ms">
				<div className="ms-wrap">
					{/* ---------- En-tête : titre, solde et soleil de Milo ---------- */}
					<header className="ms-hero">
						<div className="ms-hero__copy">
							<span className="ms-eyebrow"><i aria-hidden="true" />La boutique de Milo</span>
							<h1 className="ms-display ms-hero__title">
								Habille ton <span className="ms-hl">renard</span>
							</h1>
							<p className="ms-hero__lead">
								Dépense tes miloros en chapeaux, lunettes, stickers et danses.
								Chaque objet débloqué rejoint ton casier pour toujours.
							</p>
							<div className="ms-hero__actions">
								<div className="ms-wallet" title="Ton solde de miloros">
									<img src="/landing/emoji/coin.webp" alt="" className="ms-wallet__coin" draggable={false} />
									<span className="ms-wallet__amount">{formatMiloros(miloroCoin)}</span>
									<span className="ms-wallet__unit">miloros</span>
								</div>
								<button type="button" className="ms-btn ms-btn--ghost" onClick={() => navigate("/mon-milo")}>
									<WandSparkles size={18} aria-hidden="true" />
									Personnaliser Milo
								</button>
							</div>
						</div>

						<div className="ms-hero__art" aria-hidden="true">
							<div className="ms-hero__sun" />
							<img className="ms-hero__milo" src="/shop.png" alt="" draggable={false} />
							<img className="ms-hero__e ms-hero__e--1" src="/landing/emoji/t_shirt.webp" alt="" />
							<img className="ms-hero__e ms-hero__e--2" src="/landing/emoji/sparkles.webp" alt="" />
							<img className="ms-hero__e ms-hero__e--3" src="/landing/emoji/gem_stone.webp" alt="" />
						</div>
					</header>

					{/* ---------- Filtres ---------- */}
					<section className="ms-filters" aria-label="Filtres de la boutique">
						<div className="ms-chips" role="group" aria-label="Catégorie">
							{TYPE_FILTERS.map((cat) => {
								const isActive = activeType === cat.value;
								return (
									<button
										key={cat.value || "all"}
										type="button"
										className={`ms-chip${isActive ? " is-active" : ""}`}
										aria-pressed={isActive}
										onClick={() => setActiveType(cat.value)}
									>
										{cat.label}
									</button>
								);
							})}
						</div>
						<div className="ms-rarities" role="group" aria-label="Rareté">
							<span className="ms-rarities__label">Rareté</span>
							{[{ value: "" as const, label: "Toutes" }, ...RARITIES.map((r) => ({ value: r, label: RARITY_LABELS[r] }))].map((r) => {
								const isActive = activeRarity === r.value;
								return (
									<button
										key={r.value || "all"}
										type="button"
										className={`ms-rpill${r.value ? ` ms-r-${raritySlug(r.value)}` : ""}${isActive ? " is-active" : ""}`}
										aria-pressed={isActive}
										onClick={() => setActiveRarity(r.value)}
									>
										{r.value && <i aria-hidden="true" />}
										{r.label}
									</button>
								);
							})}
						</div>
					</section>

					{/* ---------- Catalogue ---------- */}
					<section className={`ms-catalogue${isFetching && !isLoading ? " is-fetching" : ""}`} aria-busy={isFetching}>
						{isLoading && (
							<div className="ms-grid" aria-label="Chargement de la boutique">
								{Array.from({ length: SKELETON_COUNT }, (_, i) => (
									<div key={i} className="ms-card ms-card--skeleton" aria-hidden="true">
										<div className="ms-card__stage" />
										<div className="ms-skel ms-skel--sm" />
										<div className="ms-skel" />
										<div className="ms-skel ms-skel--btn" />
									</div>
								))}
							</div>
						)}

						{isError && (
							<div className="ms-state">
								<img src="/landing/emoji/locked.webp" alt="" className="ms-state__icon" />
								<h2 className="ms-display ms-state__title">Boutique fermée</h2>
								<p>Impossible de charger les objets pour le moment.</p>
								<button type="button" className="ms-btn ms-btn--primary" onClick={() => refetch()}>
									<RotateCcw size={18} aria-hidden="true" />
									Réessayer
								</button>
							</div>
						)}

						{!isLoading && !isError && catalogue.length === 0 && (
							<div className="ms-state">
								<img src="/landing/emoji/card_index_dividers.webp" alt="" className="ms-state__icon" />
								<h2 className="ms-display ms-state__title">Rien en rayon</h2>
								<p>
									{hasFilters
										? "Aucun objet ne correspond à ces filtres."
										: "Les premiers objets arrivent bientôt. Reviens vite !"}
								</p>
								{hasFilters && (
									<button type="button" className="ms-btn ms-btn--ghost" onClick={resetFilters}>
										Voir tous les objets
									</button>
								)}
							</div>
						)}

						{!isLoading && !isError && catalogue.length > 0 && (
							<LayoutGroup>
								<motion.div
									key={`${activeType}|${activeRarity}`}
									className="ms-grid"
									variants={gridVariants}
									initial="hidden"
									animate="visible"
								>
									<AnimatePresence mode="popLayout">
										{catalogue.map((item) => (
											<ShopItemCard
												key={item.id}
												item={item}
												balance={miloroCoin}
												isDancing={previewedDanceId === item.id}
												onPreviewStart={startDancePreview}
												onPreviewStop={stopDancePreview}
												onBuy={openPurchase}
											/>
										))}
									</AnimatePresence>
								</motion.div>
							</LayoutGroup>
						)}
					</section>
				</div>

				<AnimatePresence>
					{confirmPurchase && (
						<PurchaseModal
							item={confirmPurchase}
							balance={miloroCoin}
							isPending={buyMutation.isPending}
							error={purchaseError}
							onConfirm={finalizePurchase}
							onClose={closePurchase}
						/>
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default BoutiquePage;
