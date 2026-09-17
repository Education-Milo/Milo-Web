import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Friend } from "@features/friends/store/friend.model";
import { getOtherUserId } from "@features/friends/store/friend.model";
import { pinFriend } from "@features/friends/store/friend.queries";

/** Clés localStorage historiques des amis épinglés (ids utilisateur des amis). */
const LEGACY_STORAGE_KEYS = ["pinnedFriends", "bestFriends"];

const readLegacyPinnedIds = (): number[] => {
	const ids = new Set<number>();
	for (const key of LEGACY_STORAGE_KEYS) {
		try {
			const stored = localStorage.getItem(key);
			if (!stored) continue;
			const parsed: unknown = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				parsed.forEach((value) => {
					const id = Number(value);
					if (Number.isInteger(id)) ids.add(id);
				});
			}
		} catch {
			// clé illisible : on l'ignore, elle sera supprimée quand même
		}
	}
	return [...ids];
};

const hasLegacyKeys = () =>
	LEGACY_STORAGE_KEYS.some((key) => localStorage.getItem(key) !== null);

const clearLegacyKeys = () => {
	LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

/**
 * Migration transparente des épingles localStorage vers le backend.
 *
 * Au premier chargement de la liste d'amis : pour chaque id encore stocké
 * localement qui correspond à un ami accepté, envoie PUT /friends/{id}/pin
 * (404 et autres erreurs ignorés), puis supprime les clés locales et
 * rafraîchit la query "friends". Ne s'exécute qu'une seule fois.
 */
export const usePinnedFriendsMigration = (
	acceptedFriends: Friend[],
	isFriendsLoaded: boolean,
) => {
	const queryClient = useQueryClient();
	const hasRunRef = useRef(false);

	useEffect(() => {
		if (hasRunRef.current || !isFriendsLoaded) return;
		if (typeof window === "undefined" || !hasLegacyKeys()) return;
		hasRunRef.current = true;

		const acceptedIds = new Set(acceptedFriends.map(getOtherUserId));
		const idsToPin = readLegacyPinnedIds().filter((id) => acceptedIds.has(id));

		const migrate = async () => {
			await Promise.all(
				idsToPin.map((id) => pinFriend(id).catch(() => undefined)),
			);
			clearLegacyKeys();
			if (idsToPin.length > 0) {
				queryClient.invalidateQueries({ queryKey: ["friends"] });
			}
		};

		void migrate();
	}, [acceptedFriends, isFriendsLoaded, queryClient]);
};
