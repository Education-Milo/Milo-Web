export type CosmeticType =
	| "cosmetic_hat"
	| "cosmetic_glasses"
	| "cosmetic_shirt"
	| "cosmetic_pant"
	| "cosmetic_shoes"
	| "cosmetic_gloves"
	| "cosmetic_tie"
	| "cosmetic_mustache"
	| "sticker"
	| "dance";

export type CosmeticRarity = "commun" | "rare" | "tres rare" | "epique" | "legendaire";

/** Objet tel que renvoyé par GET /cosmetics et GET /user/{id}/locker. */
export interface Cosmetic {
	id: number;
	name: string;
	type: CosmeticType;
	price: number;
	rarity: CosmeticRarity;
	/** Chemin relatif versionné (`/cosmetics/42/image?v=…`), null sans image. */
	image: string | null;
	/** Maillage à accrocher au modèle 3D ; null pour un sticker ou une danse. */
	mesh_name: string | null;
	is_active: boolean;
	owned: boolean;
	is_equipped: boolean;
}

export interface CosmeticFilters {
	type?: CosmeticType;
	rarity?: CosmeticRarity;
}

/** POST /user/{id}/locker/add */
export interface PurchaseResponse {
	cosmetic: Cosmetic;
	/** Nouveau solde, seule valeur à afficher après un achat. */
	miloro_coin: number;
	spent: number;
}

/** GET /user/{id}/locker */
export interface LockerResponse {
	miloro_coin: number;
	wheel_size: number;
	wheel_used: number;
	items: Cosmetic[];
}

/** PUT /user/{id}/locker/equip */
export interface EquipResponse {
	cosmetic_id: number;
	is_equipped: boolean;
	type: CosmeticType;
}

/** DELETE /user/{id}/locker/equip[?type=] : les objets restent possédés, seulement retirés. */
export interface UnequipResponse {
	unequipped: number;
	type: CosmeticType | null;
	cosmetic_ids: number[];
}

/** GET /user/{id}/locker/equipped */
export interface EquippedResponse {
	skins: Partial<Record<CosmeticType, Cosmetic>>;
	wheel: Cosmetic[];
	wheel_size: number;
}

export const SKIN_TYPES: CosmeticType[] = [
	"cosmetic_hat",
	"cosmetic_glasses",
	"cosmetic_shirt",
	"cosmetic_pant",
	"cosmetic_shoes",
	"cosmetic_gloves",
	"cosmetic_tie",
	"cosmetic_mustache",
];

export const WHEEL_TYPES: CosmeticType[] = ["sticker", "dance"];

export const ALL_TYPES: CosmeticType[] = [...SKIN_TYPES, ...WHEEL_TYPES];

export const RARITIES: CosmeticRarity[] = ["commun", "rare", "tres rare", "epique", "legendaire"];

export const isSkinType = (type: CosmeticType) => SKIN_TYPES.includes(type);
export const isWheelType = (type: CosmeticType) => WHEEL_TYPES.includes(type);

/**
 * Ce que `mesh_name` désigne pour un type : un maillage (tenue), un clip
 * (danse) ou rien (sticker). Passer d'une tenue à une autre garde le maillage.
 */
export const meshKind = (type: CosmeticType): "mesh" | "clip" | null =>
	isSkinType(type) ? "mesh" : type === "dance" ? "clip" : null;

export const TYPE_LABELS: Record<CosmeticType, string> = {
	cosmetic_hat: "Chapeaux",
	cosmetic_glasses: "Lunettes",
	cosmetic_shirt: "Hauts",
	cosmetic_pant: "Bas",
	cosmetic_shoes: "Chaussures",
	cosmetic_gloves: "Gants",
	cosmetic_tie: "Cravates & nœuds",
	cosmetic_mustache: "Moustaches",
	sticker: "Stickers",
	dance: "Danses",
};

export const TYPE_ICONS: Record<CosmeticType, string> = {
	cosmetic_hat: "🎩",
	cosmetic_glasses: "👓",
	cosmetic_shirt: "👕",
	cosmetic_pant: "👖",
	cosmetic_shoes: "👟",
	cosmetic_gloves: "🧤",
	cosmetic_tie: "🎀",
	cosmetic_mustache: "🥸",
	sticker: "🌟",
	dance: "💃",
};

export const RARITY_LABELS: Record<CosmeticRarity, string> = {
	commun: "Commun",
	rare: "Rare",
	"tres rare": "Très rare",
	epique: "Épique",
	legendaire: "Légendaire",
};

const API_BASE = String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * URL affichable d'une image de cosmétique. Le `?v=` fourni par le back est
 * gardé tel quel : il ne change qu'au téléversement, l'image est servie avec un
 * cache immuable, ajouter un cache-buster casserait ce cache.
 */
export const cosmeticImageSrc = (image: string | null | undefined) => (image ? `${API_BASE}${image}` : null);

/** Slug CSS stable : "tres rare" → "tres-rare". */
export const raritySlug = (rarity: string) => rarity.toLowerCase().replace(/\s+/g, "-");
