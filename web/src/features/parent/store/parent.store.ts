import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LinkedChild } from "@features/parent/store/parent.model";

interface ParentState {
	/** Enfant choisi dans le bandeau, partagé par toutes les pages parent */
	selectedChildId: number | null;
	selectChild: (childId: number | null) => void;
}

/**
 * Le choix survit à la navigation et au rechargement de l'onglet, pas à la
 * fermeture : sessionStorage (createJSONStorage ignore un stockage bloqué).
 */
export const useParentStore = create<ParentState>()(
	persist(
		(set) => ({
			selectedChildId: null,
			selectChild: (selectedChildId) => set({ selectedChildId }),
		}),
		{
			name: "milo-parent-child",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

/** Enfant affiché : celui choisi s'il est encore lié, sinon le premier. */
export const useActiveChild = (children: LinkedChild[]): LinkedChild | null => {
	const selectedChildId = useParentStore((state) => state.selectedChildId);
	return children.find((child) => child.id === selectedChildId) ?? children[0] ?? null;
};
