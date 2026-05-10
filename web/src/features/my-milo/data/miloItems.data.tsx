import React from "react";

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
    name: "Haut de forme",
    category: "Chapeau",
    icon: "🎩",
    rarity: "Commun",
    meshName: "tophat",
  },
  {
    id: 2,
    name: "Lunette",
    category: "Lunettes",
    icon: "👓",
    rarity: "Commun",
    meshName: "glasses",
  },
  {
    id: 3,
    name: "Noeud papillon Noir",
    category: "Vêtement",
    icon: <img src="black-bowtie.png" alt="Black-Tie" style={{ width: "76px", height: "76px" }} />,
    rarity: "Rare",
    meshName: "tie",
  }
];