import APIAxios, { APIRoutes } from "@api/axios.api";
import { useAuthStore } from "@shared/store/auth/auth.store";
import type {
	ActivityPayload,
	PerformancePayload,
	PerformanceResponse,
} from "@shared/types/tracking";

/** POST /tracking/performance — résultat d'un QCM ou d'un exercice. */
export const postPerformance = async (
	payload: PerformancePayload,
): Promise<PerformanceResponse> => {
	const response = await APIAxios.post<PerformanceResponse>(
		APIRoutes.POST_Tracking_Performance,
		payload,
	);
	return response.data;
};

const MIN_ACTIVITY_DURATION_SECONDS = 5;

/**
 * POST /tracking/activity — temps passé sur un écran.
 *
 * Fire and forget : appelé au démontage d'un écran ou quand l'onglet passe
 * en arrière-plan, donc via `fetch` + `keepalive` pour que la requête
 * survive à la navigation (axios ne sait pas faire). Ne bloque jamais
 * l'appelant et ne remonte jamais d'erreur.
 */
export const postActivity = (payload: ActivityPayload): void => {
	if (payload.duration_seconds < MIN_ACTIVITY_DURATION_SECONDS) return;

	const token = useAuthStore.getState().accessToken;
	if (!token) return;

	const baseUrl = String(APIAxios.defaults.baseURL ?? "").replace(/\/$/, "");
	const url = `${baseUrl}${APIRoutes.POST_Tracking_Activity}`;

	try {
		void fetch(url, {
			method: "POST",
			keepalive: true,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(payload),
		}).catch(() => {});
	} catch {
		// silencieux : la télémétrie ne doit jamais gêner l'utilisateur
	}
};
