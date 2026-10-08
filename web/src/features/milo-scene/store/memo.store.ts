import { create } from "zustand";
import { persist } from "zustand/middleware";

/// « Ma fiche » : les phrases que l'élève épingle pendant la leçon, gardées
/// dans le navigateur par leçon pour ses révisions.

export interface MemoItem {
	id: string;
	text: string;
	/** Titre de la partie d'où vient la phrase */
	source: string;
	savedAt: number;
}

interface MemoStore {
	memos: Record<string, MemoItem[]>;
	add: (key: string, item: Omit<MemoItem, "id" | "savedAt">) => void;
	remove: (key: string, id: string) => void;
	clear: (key: string) => void;
}

const createId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useMemoStore = create<MemoStore>()(
	persist(
		(set) => ({
			memos: {},
			add: (key, item) =>
				set((state) => {
					const current = state.memos[key] ?? [];
					if (current.some((memo) => memo.text === item.text)) return state;
					return {
						memos: {
							...state.memos,
							[key]: [...current, { ...item, id: createId(), savedAt: Date.now() }],
						},
					};
				}),
			remove: (key, id) =>
				set((state) => ({
					memos: { ...state.memos, [key]: (state.memos[key] ?? []).filter((memo) => memo.id !== id) },
				})),
			clear: (key) =>
				set((state) => {
					const next = { ...state.memos };
					delete next[key];
					return { memos: next };
				}),
		}),
		{ name: "milo-class-memos" },
	),
);
