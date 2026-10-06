import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type {
	DisableFactorPayload,
	FactorConfirmResponse,
	RecoveryCodesResponse,
	TotpSetupResponse,
	TrustedDevice,
	TwoFactorStatus,
	UserSession,
} from "@features/security/store/security.model";

export const SECURITY_QUERY_KEY = ["security"] as const;
const statusKey = [...SECURITY_QUERY_KEY, "2fa-status"] as const;
const devicesKey = [...SECURITY_QUERY_KEY, "devices"] as const;
const sessionsKey = [...SECURITY_QUERY_KEY, "sessions"] as const;

// ─── Lectures ────────────────────────────────────────────────────────────────

export const useTwoFactorStatus = (enabled = true) =>
	useQuery({
		queryKey: statusKey,
		queryFn: async () => (await APIAxios.get<TwoFactorStatus>(APIRoutes.GET_2FA_Status)).data,
		enabled,
		staleTime: 30 * 1000,
	});

export const useTrustedDevices = (enabled = true) =>
	useQuery({
		queryKey: devicesKey,
		queryFn: async () => (await APIAxios.get<TrustedDevice[]>(APIRoutes.GET_2FA_Devices)).data,
		enabled,
		staleTime: 30 * 1000,
	});

export const useSessions = (enabled = true) =>
	useQuery({
		queryKey: sessionsKey,
		queryFn: async () => (await APIAxios.get<UserSession[]>(APIRoutes.GET_Sessions)).data,
		enabled,
		staleTime: 30 * 1000,
	});

/** Activer ou retirer un facteur touche l'état, les appareils de confiance et le compteur de codes. */
const useRefreshSecurity = () => {
	const queryClient = useQueryClient();
	return () => {
		void queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEY });
	};
};

// ─── Application d'authentification (TOTP) ───────────────────────────────────

export const useSetupTotp = () =>
	useMutation({
		mutationFn: async (currentPassword: string) =>
			(await APIAxios.post<TotpSetupResponse>(APIRoutes.POST_2FA_Totp_Setup, {
				current_password: currentPassword,
			})).data,
	});

export const useConfirmTotp = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async (code: string) =>
			(await APIAxios.post<FactorConfirmResponse>(APIRoutes.POST_2FA_Totp_Confirm, { code })).data,
		onSuccess: refresh,
	});
};

export const useDisableTotp = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async (payload: DisableFactorPayload) =>
			(await APIAxios.delete(APIRoutes.DELETE_2FA_Totp, { data: payload })).data,
		onSuccess: refresh,
	});
};

// ─── Code par email ──────────────────────────────────────────────────────────

/** Vérifie le mot de passe et envoie un code d'activation par email. */
export const useEnableEmail = () =>
	useMutation({
		mutationFn: async (currentPassword: string) =>
			(await APIAxios.post(APIRoutes.POST_2FA_Email_Enable, { current_password: currentPassword })).data,
	});

export const useConfirmEmail = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async (code: string) =>
			(await APIAxios.post<FactorConfirmResponse>(APIRoutes.POST_2FA_Email_Confirm, { code })).data,
		onSuccess: refresh,
	});
};

/** Code reçu par email pour confirmer une opération de réglages (pas une connexion). */
export const useSendSettingsCode = () =>
	useMutation({
		mutationFn: async () => (await APIAxios.post(APIRoutes.POST_2FA_Email_Send_Code)).data,
	});

export const useDisableEmail = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async (payload: DisableFactorPayload) =>
			(await APIAxios.delete(APIRoutes.DELETE_2FA_Email, { data: payload })).data,
		onSuccess: refresh,
	});
};

// ─── Codes de secours ────────────────────────────────────────────────────────

/** Remplace le jeu entier : les anciens codes cessent de fonctionner. */
export const useRegenerateRecoveryCodes = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async (currentPassword: string) =>
			(await APIAxios.post<RecoveryCodesResponse>(APIRoutes.POST_2FA_Recovery_Codes, {
				current_password: currentPassword,
			})).data,
		onSuccess: refresh,
	});
};

// ─── Appareils de confiance ──────────────────────────────────────────────────

export const useRevokeDevice = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async (deviceId: number) => (await APIAxios.delete(APIRoutes.DELETE_2FA_Device(deviceId))).data,
		onSuccess: refresh,
	});
};

export const useRevokeAllDevices = () => {
	const refresh = useRefreshSecurity();
	return useMutation({
		mutationFn: async () => (await APIAxios.delete(APIRoutes.DELETE_2FA_Devices)).data,
		onSuccess: refresh,
	});
};

// ─── Sessions ────────────────────────────────────────────────────────────────

export const useRenameSession = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ sessionId, deviceName }: { sessionId: number; deviceName: string }) =>
			(await APIAxios.patch<UserSession>(APIRoutes.PATCH_Session(sessionId), { device_name: deviceName })).data,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: sessionsKey });
		},
	});
};

export const useRevokeSession = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (sessionId: number) => (await APIAxios.delete(APIRoutes.DELETE_Session(sessionId))).data,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: sessionsKey });
		},
	});
};

/**
 * Déconnecte toutes les sessions sauf celle-ci. N'est possible que si le back
 * identifie la session courante (`is_current`, mode cookie) : sinon on ne
 * saurait pas laquelle épargner.
 */
export const useRevokeOtherSessions = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const sessions = (await APIAxios.get<UserSession[]>(APIRoutes.GET_Sessions)).data;
			if (!sessions.some((s) => s.is_current === true)) {
				throw new Error("current session unknown");
			}
			const others = sessions.filter((s) => s.is_current === false);
			await Promise.all(others.map((s) => APIAxios.delete(APIRoutes.DELETE_Session(s.id))));
			return others.length;
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: sessionsKey });
		},
	});
};
