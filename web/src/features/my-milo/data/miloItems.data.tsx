import React from "react";

export type ItemCategory = "Chapeau" | "Lunettes" | "Vêtement" | "Mobilier" | "Classe";
export type ItemRarity = "Commun" | "Rare" | "Épique" | "Légendaire";

export interface OwnedItemDef {
  id: number;
  name: string;
  category: ItemCategory;
  icon: React.ReactNode;
  rarity: ItemRarity;
  meshName?: string;
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
  },
  {
    id: 4,
    name: "Lunette 3D",
    category: "Lunettes",
    icon: <img src="3dglasses.png" alt="Lunette 3D" style={{ width: "76px", height: "76px" }} />,
    rarity: "Épique",
    meshName: "3dglasses",
  },
];