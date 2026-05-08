import React from "react";
import { Clock, BookOpenText } from "lucide-react";

export type ItemCategory = "Chapeau" | "Lunettes" | "Vêtement" | "Mobilier" | "Classe";
export type ItemRarity = "Commun" | "Rare" | "Épique" | "Légendaire";

export interface OwnedItemDef {
  id: number;
  name: string;
  category: ItemCategory;
  icon: React.ReactNode;
  rarity: ItemRarity;
  meshName?: string; // Optional: The exact name of the object in the GLTF 3D model
}

export const MILO_ITEMS: OwnedItemDef[] = [
  {
    id: 1,
    name: "Casquette Milo Orange",
    category: "Chapeau",
    icon: "🧢",
    rarity: "Commun",
    meshName: "tophat",
  },
  {
    id: 2,
    name: "T-Shirt Aventurier",
    category: "Vêtement",
    icon: "👕",
    rarity: "Rare",
    meshName: "tie",
  },
  {
    id: 3,
    name: "Lunettes Pixel",
    category: "Chapeau",
    icon: "🕶️",
    rarity: "Épique",
    meshName: "glasses",
  },
  {
    id: 4,
    name: "Horloge Moderne Milo",
    category: "Mobilier",
    icon: <Clock />,
    rarity: "Rare",
  },
  {
    id: 5,
    name: "Cahier de Révisions Milo",
    category: "Classe",
    icon: <BookOpenText />,
    rarity: "Commun",
  },
  {
    id: 6,
    name: "Couronne Royale",
    category: "Chapeau",
    icon: "👑",
    rarity: "Légendaire",
  },
];