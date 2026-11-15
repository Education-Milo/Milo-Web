import type { Cosmetic } from "@features/cosmetics/store/cosmetics.model";

/** Objet qu'on peut essayer sur son Milo : un vêtement (avec son maillage 3D) ou une danse */
export const canTryOn = (item: Cosmetic) =>
	Boolean(item.mesh_name) && (item.type === "dance" || item.type.startsWith("cosmetic_"));
