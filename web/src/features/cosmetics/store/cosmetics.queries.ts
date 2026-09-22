import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useUserStore } from "@shared/store/user/user.store";
import { USER_QUERY_KEY } from "@shared/lib/serverActions";
import { isSkinType } from "@features/cosmetics/store/cosmetics.model";
import type {
	Cosmetic,
	CosmeticFilters,
	EquipResponse,
	EquippedResponse,
	LockerResponse,
	PurchaseResponse,
	UnequipResponse,
	CosmeticType,
} from "@features/cosmetics/store/cosmetics.model";

export const COSMETICS_QUERY_KEY = ["cosmetics"] as const;
export const LOCKER_QUERY_KEY = ["locker"] as const;

const useCurrentUserId = () => useUserStore((state) => state.user?.id);

// ─── Appels API ──────────────────────────────────────────────────────────────

export const fetchCosmetics = async (filters: CosmeticFilters = {}): Promise<Cosmetic[]> => {
	const params: Record<string, string> = {};
	if (filters.type) params.type = filters.type;
	if (filters.rarity) params.rarity = filters.rarity;
	const response = await APIAxios.get<Cosmetic[]>(APIRoutes.GET_Cosmetics, { params });
	return response.data;
};

export const fetchLocker = async (userId: string | number): Promise<LockerResponse> => {
	const response = await APIAxios.get<LockerResponse>(APIRoutes.GET_Locker(userId));
	return response.data;
};

export const fetchEquipped = async (userId: string | number): Promise<EquippedResponse> => {
	const response = await APIAxios.get<EquippedResponse>(APIRoutes.GET_Locker_Equipped(userId));
	return response.data;
};

export const buyCosmetic = async (
	userId: string | number,
	cosmeticId: number,
): Promise<PurchaseResponse> => {
	const response = await APIAxios.post<PurchaseResponse>(APIRoutes.POST_Locker_Add(userId), {
		cosmetic_id: cosmeticId,
	});
	return response.data;
};

export const equipCosmetic = async (
	userId: string | number,
	cosmeticId: number,
	equipped: boolean,
): Promise<EquipResponse> => {
	const response = await APIAxios.put<EquipResponse>(APIRoutes.PUT_Locker_Equip(userId), {
		cosmetic_id: cosmeticId,
		equipped,
	});
	return response.data;
};

/** Retire un emplacement (`type`) ou toute la tenue et la roue (sans type). */
export const unequipCosmetics = async (
	userId: string | number,
	type?: CosmeticType,
): Promise<UnequipResponse> => {
	const response = await APIAxios.delete<UnequipResponse>(APIRoutes.DELETE_Locker_Equip(userId), {
		params: type ? { type } : undefined,
	});
	return response.data;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Catalogue de la boutique, avec `owned` pour le joueur connecté. */
export const useCosmetics = (filters: CosmeticFilters = {}) => {
	const userId = useCurrentUserId();
	return useQuery({
		queryKey: [...COSMETICS_QUERY_KEY, filters],
		queryFn: () => fetchCosmetics(filters),
		enabled: Boolean(userId),
		staleTime: 60 * 1000,
	});
};

/** Casier du joueur connecté : objets possédés, solde, état de la roue. */
export const useLocker = () => {
	const userId = useCurrentUserId();
	return useQuery({
		queryKey: [...LOCKER_QUERY_KEY, String(userId)],
		queryFn: () => fetchLocker(userId as string),
		enabled: Boolean(userId),
		staleTime: 30 * 1000,
	});
};

/** Tenue et roue équipées, pour le rendu 3D. */
export const useEquipped = () => {
	const userId = useCurrentUserId();
	return useQuery({
		queryKey: [...LOCKER_QUERY_KEY, String(userId), "equipped"],
		queryFn: () => fetchEquipped(userId as string),
		enabled: Boolean(userId),
		staleTime: 60 * 1000,
	});
};

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Après un achat ou un équipement : catalogue, casier, tenue et profil (solde). */
const useRefreshCosmetics = () => {
	const queryClient = useQueryClient();
	return () => {
		void queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: LOCKER_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
		// Le solde affiché dans la sidebar et le profil vient de /users/me
		useUserStore.getState().getMe(true).catch(() => {});
	};
};

export const useBuyCosmetic = () => {
	const userId = useCurrentUserId();
	const refresh = useRefreshCosmetics();
	return useMutation({
		mutationFn: (cosmeticId: number) => buyCosmetic(userId as string, cosmeticId),
		onSuccess: (data) => {
			// Le solde renvoyé est la vérité : on le reflète immédiatement dans le store
			const current = useUserStore.getState().user;
			if (current) useUserStore.setState({ user: { ...current, miloro_coin: data.miloro_coin } });
			refresh();
		},
	});
};

interface EquipVariables {
	cosmeticId: number;
	equipped: boolean;
}

export const useEquipCosmetic = () => {
	const userId = useCurrentUserId();
	const queryClient = useQueryClient();
	const refresh = useRefreshCosmetics();
	const lockerKey = [...LOCKER_QUERY_KEY, String(userId)];
	const equippedKey = [...LOCKER_QUERY_KEY, String(userId), "equipped"];

	return useMutation({
		mutationFn: ({ cosmeticId, equipped }: EquipVariables) =>
			equipCosmetic(userId as string, cosmeticId, equipped),
		// Mise à jour optimiste du casier : un skin remplace celui du même type,
		// un objet de roue ajuste wheel_used. Le serveur applique les mêmes règles.
		onMutate: async ({ cosmeticId, equipped }) => {
			// Le préfixe couvre le casier ET la tenue équipée : sans ça, un
			// refetch en vol écraserait la mise à jour optimiste.
			await queryClient.cancelQueries({ queryKey: LOCKER_QUERY_KEY });
			const previous = queryClient.getQueryData<LockerResponse>(lockerKey);
			const previousEquipped = queryClient.getQueryData<EquippedResponse>(equippedKey);
			const target = previous?.items.find((item) => item.id === cosmeticId);

			if (previous && target) {
				const isSkin = isSkinType(target.type);
				const items = previous.items.map((item) => {
					if (item.id === cosmeticId) return { ...item, is_equipped: equipped };
					if (equipped && isSkin && item.type === target.type) return { ...item, is_equipped: false };
					return item;
				});
				const wheelUsed = items.filter(
					(item) => item.is_equipped && !item.type.startsWith("cosmetic_"),
				).length;
				queryClient.setQueryData<LockerResponse>(lockerKey, {
					...previous,
					items,
					wheel_used: wheelUsed,
				});
			}

			// C'est cette entrée-là que lit le Milo 3D (useEquippedMeshNames).
			// Sans mise à jour optimiste, l'accessoire n'apparaissait qu'au
			// retour du serveur puis du refetch, d'où le délai visible.
			if (previousEquipped && target) {
				const skins = { ...previousEquipped.skins };
				let wheel = previousEquipped.wheel;
				if (isSkinType(target.type)) {
					if (equipped) skins[target.type] = { ...target, is_equipped: true };
					else delete skins[target.type];
				} else {
					wheel = equipped
						? [...wheel.filter((item) => item.id !== target.id), { ...target, is_equipped: true }]
						: wheel.filter((item) => item.id !== target.id);
				}
				queryClient.setQueryData<EquippedResponse>(equippedKey, {
					...previousEquipped,
					skins,
					wheel,
				});
			}

			return { previous, previousEquipped };
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) queryClient.setQueryData(lockerKey, context.previous);
			if (context?.previousEquipped) {
				queryClient.setQueryData(equippedKey, context.previousEquipped);
			}
		},
		onSettled: () => refresh(),
	});
};

/**
 * Déséquipe un emplacement ou tout. Idempotent côté serveur : on n'a pas à
 * désactiver les boutons quand rien n'est équipé. Mise à jour optimiste du
 * casier, puis invalidation de "locker" (qui couvre "equipped") pour le 3D.
 */
export const useUnequipCosmetics = () => {
	const userId = useCurrentUserId();
	const queryClient = useQueryClient();
	const refresh = useRefreshCosmetics();
	const lockerKey = [...LOCKER_QUERY_KEY, String(userId)];
	const equippedKey = [...LOCKER_QUERY_KEY, String(userId), "equipped"];

	return useMutation({
		mutationFn: (type?: CosmeticType) => unequipCosmetics(userId as string, type),
		onMutate: async (type) => {
			await queryClient.cancelQueries({ queryKey: LOCKER_QUERY_KEY });
			const previous = queryClient.getQueryData<LockerResponse>(lockerKey);
			const previousEquipped = queryClient.getQueryData<EquippedResponse>(equippedKey);

			if (previous) {
				const items = previous.items.map((item) =>
					!type || item.type === type ? { ...item, is_equipped: false } : item,
				);
				queryClient.setQueryData<LockerResponse>(lockerKey, {
					...previous,
					items,
					wheel_used: items.filter(
						(item) => item.is_equipped && !item.type.startsWith("cosmetic_"),
					).length,
				});
			}

			// Le 3D se met à nu immédiatement, sans attendre le serveur
			if (previousEquipped) {
				const skins = { ...previousEquipped.skins };
				let wheel = previousEquipped.wheel;
				if (!type) {
					queryClient.setQueryData<EquippedResponse>(equippedKey, {
						...previousEquipped,
						skins: {},
						wheel: [],
					});
				} else {
					if (isSkinType(type)) delete skins[type];
					else wheel = wheel.filter((item) => item.type !== type);
					queryClient.setQueryData<EquippedResponse>(equippedKey, {
						...previousEquipped,
						skins,
						wheel,
					});
				}
			}

			return { previous, previousEquipped };
		},
		onError: (_error, _type, context) => {
			if (context?.previous) queryClient.setQueryData(lockerKey, context.previous);
			if (context?.previousEquipped) {
				queryClient.setQueryData(equippedKey, context.previousEquipped);
			}
		},
		onSettled: () => refresh(),
	});
};

/** Message d'erreur à afficher : le champ `detail` du backend (402, 409, 404). */
export const getCosmeticErrorMessage = (error: unknown): string => {
	if (isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === "string") return detail;
		if (error.response?.status === 402) return "Tu n'as pas assez de miloros.";
		if (error.response?.status === 409) return "Action impossible pour le moment.";
		if (error.response?.status === 404) return "Cet objet n'existe plus.";
	}
	return "Une erreur est survenue, réessaie dans un instant.";
};
