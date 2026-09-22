import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type {
	AdminUserView,
	AuditEntry,
	AuditFilters,
	ChangeRolePayload,
	ChangeRoleResponse,
} from "@features/admin/store/admin.model";

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
