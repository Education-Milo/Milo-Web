import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { useAuthStore } from "@shared/store/auth/auth.store";
import type { ProfileSummary } from "@shared/store/auth/auth.model";
import type {
	Account,
	ChangeEmailPayload,
	ChangePasswordPayload,
	CreateProfilePayload,
	DeleteProfilePayload,
	DeleteProfileResponse,
	UpdateProfilePinPayload,
} from "@features/account/store/account.model";

/**
 * Routes de niveau compte : elles acceptent le jeton de compte (écran « Qui
 * est-ce ? » juste après la connexion) ou le jeton d'un profil du compte.
 */
const withAccountAuth = () => ({ headers: useAuthStore.getState().accountAuthHeaders() });

export const ACCOUNT_QUERY_KEY = ["account"] as const;
const profilesKey = [...ACCOUNT_QUERY_KEY, "profiles"] as const;
const accountKey = [...ACCOUNT_QUERY_KEY, "me"] as const;

// ─── Lectures ────────────────────────────────────────────────────────────────

/** Profils du compte. `initialData` : la liste déjà reçue de /token, sans requête de plus. */
export const useAccountProfiles = (initialData?: ProfileSummary[], enabled = true) =>
	useQuery({
		queryKey: profilesKey,
		queryFn: async () => (await APIAxios.get<ProfileSummary[]>(APIRoutes.GET_Profiles, withAccountAuth())).data,
		initialData: initialData && initialData.length > 0 ? initialData : undefined,
		enabled,
		staleTime: 30 * 1000,
	});

export const useAccount = (enabled = true) =>
	useQuery({
		queryKey: accountKey,
		queryFn: async () => (await APIAxios.get<Account>(APIRoutes.GET_Account, withAccountAuth())).data,
		enabled,
		staleTime: 30 * 1000,
	});

const useRefreshAccount = () => {
	const queryClient = useQueryClient();
	return () => {
		void queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
	};
};

// ─── Profils ─────────────────────────────────────────────────────────────────

export const useCreateProfile = () => {
	const refresh = useRefreshAccount();
	return useMutation({
		mutationFn: async (payload: CreateProfilePayload) =>
			(await APIAxios.post<ProfileSummary>(APIRoutes.POST_Profile, payload, withAccountAuth())).data,
		onSuccess: refresh,
	});
};

export const useUpdateProfilePin = () => {
	const refresh = useRefreshAccount();
	return useMutation({
		mutationFn: async ({ profileId, ...body }: UpdateProfilePinPayload) =>
			(await APIAxios.put<ProfileSummary>(APIRoutes.PUT_Profile_Pin(profileId), body, withAccountAuth())).data,
		onSuccess: refresh,
	});
};

export const useDeleteProfile = () => {
	const refresh = useRefreshAccount();
	return useMutation({
		mutationFn: async ({ profileId, current_password }: DeleteProfilePayload) =>
			(
				await APIAxios.delete<DeleteProfileResponse>(APIRoutes.DELETE_Profile(profileId), {
					...withAccountAuth(),
					data: { current_password },
				})
			).data,
		onSuccess: (data) => {
			// Compte supprimé : plus rien à recharger, le jeton ne vaut plus rien
			if (!data.account_deleted) refresh();
		},
	});
};

// ─── Compte ──────────────────────────────────────────────────────────────────

export const useChangeEmail = () => {
	const refresh = useRefreshAccount();
	return useMutation({
		mutationFn: async (payload: ChangeEmailPayload) =>
			(await APIAxios.put<{ message: string; email: string }>(APIRoutes.PUT_Account_Email, payload, withAccountAuth()))
				.data,
		onSuccess: refresh,
	});
};

export const useChangePassword = () =>
	useMutation({
		mutationFn: async (payload: ChangePasswordPayload) =>
			(await APIAxios.put(APIRoutes.PUT_Account_Password, payload, withAccountAuth())).data,
	});

/** Supprime le compte, tous ses profils et toutes leurs données ; révoque toutes les sessions. */
export const useDeleteAccount = () =>
	useMutation({
		mutationFn: async (currentPassword: string) =>
			(await APIAxios.delete(APIRoutes.DELETE_Account, { ...withAccountAuth(), data: { current_password: currentPassword } }))
				.data,
	});
