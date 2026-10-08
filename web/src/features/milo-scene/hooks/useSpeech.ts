import { useCallback, useEffect, useRef, useState } from "react";

/// Lecture à voix haute (Web Speech API). Une file de phrases : la phrase
/// en cours de lecture est exposée pour la surligner au tableau.

export interface SpeechItem {
	/** Identifiant de ce qui est lu (index de phrase, id de message…) */
	key: string;
	text: string;
}

const pickFrenchVoice = () => {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
	const voices = window.speechSynthesis.getVoices();
	return (
		voices.find((v) => v.lang === "fr-FR" && /google|natural|neural/i.test(v.name)) ??
		voices.find((v) => v.lang === "fr-FR") ??
		voices.find((v) => v.lang.startsWith("fr")) ??
		null
	);
};

export const useSpeech = () => {
	const supported = typeof window !== "undefined" && "speechSynthesis" in window;
	const [activeKey, setActiveKey] = useState<string | null>(null);
	const [queueId, setQueueId] = useState<string | null>(null);
	const runRef = useRef(0);

	const stop = useCallback(() => {
		runRef.current += 1;
		if (supported) window.speechSynthesis.cancel();
		setActiveKey(null);
		setQueueId(null);
	}, [supported]);

	/// `id` nomme la file (« part », « msg-12 ») pour savoir quel bouton
	/// « Écouter » est actif.
	const speak = useCallback(
		(id: string, items: SpeechItem[]) => {
			if (!supported || items.length === 0) return;
			window.speechSynthesis.cancel();
			const run = ++runRef.current;
			const voice = pickFrenchVoice();
			setQueueId(id);

			items.forEach((item, i) => {
				const utterance = new SpeechSynthesisUtterance(item.text);
				utterance.lang = "fr-FR";
				utterance.rate = 0.98;
				if (voice) utterance.voice = voice;
				utterance.onstart = () => {
					if (runRef.current === run) setActiveKey(item.key);
				};
				if (i === items.length - 1) {
					utterance.onend = () => {
						if (runRef.current !== run) return;
						setActiveKey(null);
						setQueueId(null);
					};
				}
				window.speechSynthesis.speak(utterance);
			});
		},
		[supported],
	);

	useEffect(() => {
		if (!supported) return;
		// Chrome charge les voix en différé
		window.speechSynthesis.getVoices();
		return () => window.speechSynthesis.cancel();
	}, [supported]);

	return { supported, speak, stop, activeKey, queueId };
};
