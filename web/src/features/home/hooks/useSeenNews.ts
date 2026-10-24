import { useCallback, useState } from "react";

/// Actualités déjà lues, retenues sur cet appareil : la boîte aux lettres lève
/// son drapeau tant qu'il en reste à lire. Le stockage du navigateur peut être
/// indisponible (navigation privée…) : on retombe alors sur « tout est neuf ».

const STORAGE_KEY = "milo.home.seenNews";

function readSeen(): number[] {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
	} catch {
		return [];
	}
}

export function useSeenNews(ids: readonly number[]) {
	const [seen, setSeen] = useState<number[]>(readSeen);
	const unread = ids.filter((id) => !seen.includes(id)).length;

	const markAllSeen = useCallback(() => {
		setSeen((current) => {
			const next = Array.from(new Set([...current, ...ids]));
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {
				/// Pas de stockage : l'info reste valable jusqu'au rechargement
			}
			return next;
		});
	}, [ids]);

	return { unread, markAllSeen };
}
