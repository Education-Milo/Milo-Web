export type CosmeticType =
	| "cosmetic_hat"
	| "cosmetic_glasses"
	| "cosmetic_shirt"
	| "cosmetic_pant"
	| "cosmetic_shoes"
	| "cosmetic_gloves"
	| "cosmetic_tie"
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
	image_url: string | null;
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
];

export const WHEEL_TYPES: CosmeticType[] = ["sticker", "dance"];

export const ALL_TYPES: CosmeticType[] = [...SKIN_TYPES, ...WHEEL_TYPES];

export const RARITIES: CosmeticRarity[] = ["commun", "rare", "tres rare", "epique", "legendaire"];

export const isSkinType = (type: CosmeticType) => SKIN_TYPES.includes(type);
export const isWheelType = (type: CosmeticType) => WHEEL_TYPES.includes(type);

export const TYPE_LABELS: Record<CosmeticType, string> = {
	cosmetic_hat: "Chapeaux",
	cosmetic_glasses: "Lunettes",
	cosmetic_shirt: "Hauts",
	cosmetic_pant: "Bas",
	cosmetic_shoes: "Chaussures",
	cosmetic_gloves: "Gants",
	cosmetic_tie: "Cravates & nœuds",
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

/** Slug CSS stable : "tres rare" → "tres-rare". */
export const raritySlug = (rarity: string) => rarity.toLowerCase().replace(/\s+/g, "-");
