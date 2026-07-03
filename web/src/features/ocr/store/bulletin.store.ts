import { create } from "zustand";
import type { SubjectResult } from "../types/ocr.types";

interface BulletinStore {
	reportCard: SubjectResult[] | null;
	setReportCard: (data: SubjectResult[]) => void;
	clearReportCard: () => void;
}

export const useBulletinStore = create<BulletinStore>((set) => ({
	reportCard: null,
	setReportCard: (data) => set({ reportCard: data }),
	clearReportCard: () => set({ reportCard: null }),
}));
