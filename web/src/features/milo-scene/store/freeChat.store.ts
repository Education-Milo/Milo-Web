import { create } from "zustand";

export interface MiloFreeChatSession {
	initialReply: string;
	conversationId: string;
	context: string;
	sourceLabel: string;
}

interface MiloFreeChatStore {
	session: MiloFreeChatSession | null;
	setSession: (session: MiloFreeChatSession) => void;
	clearSession: () => void;
}

export const useMiloFreeChatStore = create<MiloFreeChatStore>((set) => ({
	session: null,
	setSession: (session) => set({ session }),
	clearSession: () => set({ session: null }),
}));
