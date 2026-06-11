import { create } from "zustand";
import type {
	OcrDocumentType,
	OcrAction,
	OcrState,
	OcrStep,
} from "../types/ocr.types";

interface OcrStore extends OcrState {
	// ─── Actions ───────────────────────────────────────────────────────────────
	setStep: (step: OcrStep) => void;
	selectType: (type: OcrDocumentType) => void;
	setFile: (file: File | null) => void;
	openModal: () => void;
	closeModal: () => void;
	setPendingAction: (action: OcrAction | null) => void;
	reset: () => void;
}

const initialState: OcrState = {
	step: "select_type",
	selectedType: null,
	selectedFile: null,
	previewUrl: null,
	isModalOpen: false,
	pendingAction: null,
};

export const useOcrStore = create<OcrStore>((set, get) => ({
	...initialState,

	setStep: (step) => set({ step }),

	selectType: (type) =>
		set({
			selectedType: type,
			step: "upload_preview",
			selectedFile: null,
			previewUrl: null,
		}),

	setFile: (file) => {
		// Révoquer l'ancienne URL blob pour éviter les memory leaks
		const { previewUrl } = get();
		if (previewUrl) URL.revokeObjectURL(previewUrl);

		if (!file) {
			set({ selectedFile: null, previewUrl: null });
			return;
		}

		const url = URL.createObjectURL(file);
		set({ selectedFile: file, previewUrl: url });
	},

	openModal: () => set({ isModalOpen: true }),

	closeModal: () => set({ isModalOpen: false, pendingAction: null }),

	setPendingAction: (action) => set({ pendingAction: action }),

	reset: () => {
		const { previewUrl } = get();
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		set(initialState);
	},
}));
