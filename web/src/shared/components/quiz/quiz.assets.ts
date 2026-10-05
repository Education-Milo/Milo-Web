/// Icônes 3D de la charte (Fluent Emoji 3D, servies depuis /public/landing/emoji)
export type BrandEmoji =
	| "books" | "brain" | "light_bulb" | "glowing_star" | "star" | "fire" | "high_voltage"
	| "sparkles" | "hundred_points" | "trophy" | "crossed_swords" | "bullseye" | "rocket"
	| "party_popper" | "sports_medal" | "graduation_cap" | "coin" | "gem_stone" | "video_game";

export const emojiSrc = (name: BrandEmoji) => `/landing/emoji/${name}.webp`;

/// Mascotte de la charte (Milo qui lit)
export const MASCOT_SRC = "/milo-renard.webp";
