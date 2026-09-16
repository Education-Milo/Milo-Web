import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
	id: number;
	message: string;
	variant: ToastVariant;
}

interface ToastStore {
	toasts: ToastItem[];
	show: (message: string, variant?: ToastVariant) => void;
	dismiss: (id: number) => void;
}

const TOAST_DURATION_MS = 5000;
let nextId = 1;

/** Notifications globales (missions terminées, erreurs de reroll, ...). */
export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],
	show: (message, variant = "info") => {
		const id = nextId++;
		set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
		setTimeout(() => {
			set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
		}, TOAST_DURATION_MS);
	},
	dismiss: (id) =>
		set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const showToast = (message: string, variant: ToastVariant = "info") =>
	useToastStore.getState().show(message, variant);
