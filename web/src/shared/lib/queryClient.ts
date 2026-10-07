import { QueryClient } from "@tanstack/react-query";
import { getErrorStatus } from "@shared/lib/aiRequests";

const MAX_RETRIES = 3;

/**
 * Instance unique de QueryClient, partagée entre React (QueryClientProvider)
 * et le code hors composants (stores Zustand, contextes, callbacks réseau)
 * qui doit invalider des queries.
 *
 * Une erreur 4xx (403, 404, 422, 429 de quota…) ne change pas en réessayant :
 * seules les erreurs réseau et 5xx sont retentées.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error) => {
				const status = getErrorStatus(error);
				if (status !== undefined && status >= 400 && status < 500) return false;
				return failureCount < MAX_RETRIES;
			},
		},
	},
});
