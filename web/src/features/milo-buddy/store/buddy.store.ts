import { create } from "zustand";

/// La bulle de Milo : ses réactions aux réussites de l'élève, une à la fois.
/// N'importe quelle partie du site peut en ajouter (`pushBuddy`) ; la bulle
/// (MiloBuddy) les joue dans l'ordre, sur les pages où elle a sa place.

export type BuddyKind = "welcome" | "back" | "mission" | "all-missions" | "streak";

export interface BuddyReaction {
	id: number;
	kind: BuddyKind;
	/** Animation de Milo (nom du clip du modèle) */
	clip: string;
	text: string;
	/** Page ouverte en cliquant sur la bulle */
	to?: string;
	/** Grand moment : confettis */
	big?: boolean;
}

interface BuddyState {
	queue: BuddyReaction[];
	push: (reaction: Omit<BuddyReaction, "id">) => void;
	/** Retire la réaction en cours (affichée ou écartée) */
	shift: () => void;
}

let nextId = 1;
/// Une journée parfaite remplace les missions encore en attente d'affichage
const SUPERSEDES: Partial<Record<BuddyKind, BuddyKind[]>> = { "all-missions": ["mission"] };

export const useBuddyStore = create<BuddyState>((set) => ({
	queue: [],
	push: (reaction) =>
		set((state) => {
			const dropped = SUPERSEDES[reaction.kind] ?? [];
			/// (la réaction affichée, en tête de file, n'est jamais retirée)
			const [head, ...rest] = state.queue;
			const kept = rest.filter((r) => !dropped.includes(r.kind) && r.kind !== reaction.kind);
			return { queue: [...(head ? [head] : []), ...kept, { ...reaction, id: nextId++ }] };
		}),
	shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));

export const pushBuddy = (reaction: Omit<BuddyReaction, "id">) => useBuddyStore.getState().push(reaction);
