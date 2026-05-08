import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MILO_ITEMS } from "../data/miloItems.data";

interface MiloInventoryState {
  equippedItemIds: number[];
  toggleEquip: (id: number) => void;
  isEquipped: (id: number) => boolean;
}

export const useMiloInventoryStore = create<MiloInventoryState>()(
  persist(
    (set, get) => ({
      equippedItemIds: [],

      toggleEquip: (id: number) => {
        set((state) => {
          const itemToToggle = MILO_ITEMS.find((i) => i.id === id);
          if (!itemToToggle) return state;

          const isCurrentlyEquipped = state.equippedItemIds.includes(id);
          
          if (isCurrentlyEquipped) {
            // Unequip
            return {
              equippedItemIds: state.equippedItemIds.filter((itemId) => itemId !== id)
            };
          } else {
            // Equip, but first unequip other items in the SAME category
            const otherItemsToKeep = state.equippedItemIds.filter((itemId) => {
              const item = MILO_ITEMS.find((i) => i.id === itemId);
              return item && item.category !== itemToToggle.category;
            });

            return {
              equippedItemIds: [...otherItemsToKeep, id]
            };
          }
        });
      },

      isEquipped: (id: number) => {
        return get().equippedItemIds.includes(id);
      }
    }),
    {
      name: "milo-inventory-storage",
    }
  )
);

