import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/// Vitesse de la craie pour les réponses de Milo (caractères par tic)
const CHARS_PER_TICK = 3;
const TICK_MS = 16;

/// Écrit un texte au tableau progressivement, comme à la craie. Un clic peut
/// tout afficher d'un coup ; sans animation (réglage système), tout est là.
export const useChalkReveal = (text: string, key: string) => {
	const reduceMotion = useReducedMotion();
	const [shown, setShown] = useState(reduceMotion ? text.length : 0);
	const keyRef = useRef(key);

	useEffect(() => {
		if (keyRef.current !== key) {
			keyRef.current = key;
			setShown(reduceMotion ? text.length : 0);
		}
	}, [key, text.length, reduceMotion]);

	useEffect(() => {
		if (reduceMotion || shown >= text.length) return;
		const t = setTimeout(() => setShown((n) => Math.min(text.length, n + CHARS_PER_TICK)), TICK_MS);
		return () => clearTimeout(t);
	}, [shown, text.length, reduceMotion]);

	const skip = useCallback(() => setShown(text.length), [text.length]);

	return { text: text.slice(0, shown), done: shown >= text.length, skip };
};
