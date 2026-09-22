import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type {
	AdminUserView,
	AuditEntry,
	AuditFilters,
	ChangeRolePayload,
	ChangeRoleResponse,
	CosmeticCreatePayload,
	CosmeticUpdatePayload,
	DeleteCosmeticResponse,
	GrantCoinsPayload,
	UpdateCosmeticResponse,
	GrantCoinsResult,
} from "@features/admin/store/admin.model";
import type { Cosmetic } from "@features/cosmetics/store/cosmetics.model";
import { COSMETICS_QUERY_KEY } from "@features/cosmetics/store/cosmetics.queries";

export const fetchAdminUser = async (username: string): Promise<AdminUserView> => {
	const response = await APIAxios.get<AdminUserView>(
		APIRoutes.GET_User_By_Username(username),
	);
	return response.data;
};

export const changeUserRole = async ({
	userId,
	role,
	reason,
}: ChangeRolePayload): Promise<ChangeRoleResponse> => {
	const response = await APIAxios.post<ChangeRoleResponse>(
		APIRoutes.POST_Admin_User_Role(userId),
		{ role, ...(reason?.trim() ? { reason: reason.trim() } : {}) },
	);
	return response.data;
};

export const fetchAudit = async (filters: AuditFilters): Promise<AuditEntry[]> => {
	const params: Record<string, string | number> = {
		limit: filters.limit,
		offset: filters.offset,
	};
	if (filters.action) params.action = filters.action;
	if (filters.target_user_id) params.target_user_id = filters.target_user_id;
	if (filters.admin_id) params.admin_id = filters.admin_id;
	const response = await APIAxios.get<AuditEntry[]>(APIRoutes.GET_Admin_Audit, { params });
	return response.data;
};

export const adminUserQueryKey = (username: string) => ["admin", "user", username] as const;

export const useAdminUser = (username: string) =>
	useQuery({
		queryKey: adminUserQueryKey(username),
		queryFn: () => fetchAdminUser(username),
		enabled: username.length > 0,
		staleTime: 30 * 1000,
	});

export const useChangeUserRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: changeUserRole,
		onSuccess: (data) => {
			// La fiche affichée et le journal doivent refléter le changement
			void queryClient.invalidateQueries({ queryKey: adminUserQueryKey(data.username) });
			void queryClient.invalidateQueries({ queryKey: ["users", "username", data.username] });
			void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
		},
	});
};

export const useAdminAudit = (filters: AuditFilters) =>
	useQuery({
		queryKey: ["admin", "audit", filters],
		queryFn: () => fetchAudit(filters),
		staleTime: 15 * 1000,
		placeholderData: keepPreviousData,
	});

// ─── Miloros ─────────────────────────────────────────────────────────────────

/**
 * Crédite des miloros à un utilisateur. Seul un admin peut forcer
 * `miloro_coin` ; la route fixe un total, donc on ajoute le montant au solde
 * lu à l'instant et on envoie le résultat.
 */
export const grantCoins = async ({
	userId,
	username,
	currentCoins,
	amount,
}: GrantCoinsPayload): Promise<GrantCoinsResult> => {
	const newCoins = currentCoins + amount;
	const response = await APIAxios.put<{ miloro_coin?: number }>(
		APIRoutes.PUT_Update_user(String(userId)),
		{ miloro_coin: newCoins },
	);
	return {
		username,
		previousCoins: currentCoins,
		newCoins: typeof response.data?.miloro_coin === "number" ? response.data.miloro_coin : newCoins,
		amount,
	};
};

export const useGrantCoins = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: grantCoins,
		onSuccess: (result) => {
			void queryClient.invalidateQueries({ queryKey: adminUserQueryKey(result.username) });
			void queryClient.invalidateQueries({ queryKey: ["users", "username", result.username] });
			void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
		},
	});
};

// ─── Cosmétiques (catalogue admin) ───────────────────────────────────────────

/** Catalogue complet, objets retirés inclus (réservé aux admins). */
export const fetchAdminCosmetics = async (): Promise<Cosmetic[]> => {
	const response = await APIAxios.get<Cosmetic[]>(APIRoutes.GET_Cosmetics, {
		params: { include_inactive: true },
	});
	return response.data;
};

export const addCosmetic = async (payload: CosmeticCreatePayload): Promise<Cosmetic> => {
	const response = await APIAxios.post<Cosmetic>(APIRoutes.POST_Cosmetics_Add, payload);
	return response.data;
};

export const updateCosmetic = async (
	cosmeticId: number,
	payload: CosmeticUpdatePayload,
): Promise<UpdateCosmeticResponse> => {
	const response = await APIAxios.put<UpdateCosmeticResponse>(
		APIRoutes.PUT_Cosmetics_Update(cosmeticId),
		payload,
	);
	return response.data;
};

export const deleteCosmetic = async (cosmeticId: number): Promise<DeleteCosmeticResponse> => {
	const response = await APIAxios.delete<DeleteCosmeticResponse>(
		APIRoutes.DELETE_Cosmetics_Delete(cosmeticId),
	);
	return response.data;
};

export const adminCosmeticsQueryKey = [...COSMETICS_QUERY_KEY, "admin"] as const;

export const useAdminCosmetics = () =>
	useQuery({
		queryKey: adminCosmeticsQueryKey,
		queryFn: fetchAdminCosmetics,
		staleTime: 30 * 1000,
	});

const useRefreshCatalogue = () => {
	const queryClient = useQueryClient();
	return () => {
		// Boutique, casiers et journal d'audit reflètent le nouveau catalogue
		void queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
	};
};

export const useAddCosmetic = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({ mutationFn: addCosmetic, onSuccess: refresh });
};

export const useUpdateCosmetic = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({
		mutationFn: ({ cosmeticId, payload }: { cosmeticId: number; payload: CosmeticUpdatePayload }) =>
			updateCosmetic(cosmeticId, payload),
		onSuccess: refresh,
	});
};

export const useDeleteCosmetic = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({ mutationFn: deleteCosmetic, onSuccess: refresh });
};

/** Message d'erreur à afficher : le champ `detail` du backend tel quel. */
export const getAdminErrorMessage = (error: unknown): string => {
	if (isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === "string") return detail;
		if (Array.isArray(detail)) {
			return detail.map((d) => (typeof d === "string" ? d : d?.msg)).filter(Boolean).join(" · ");
		}
		if (error.response?.status === 403) return "Accès réservé aux administrateurs.";
	}
	return "Une erreur est survenue, réessaie dans un instant.";
};
