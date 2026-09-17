import { queryClient } from "@shared/lib/queryClient";
import { useUserStore } from "@shared/store/user/user.store";

export const MISSIONS_QUERY_KEY = ["missions"] as const;
export const USER_QUERY_KEY = ["user"] as const;
export const STATS_QUERY_KEY = ["stats"] as const;

/**
 * À appeler après une action que le backend comptabilise tout seul
 * (fin de duel, génération de cours, question sur un cours, import OCR,
 * acceptation d'ami, résultat de QCM) : la progression des missions,
 * les XP, les coins et la streak ont pu changer côté serveur.
 *
 * Rafraîchit les queries "missions" et "user", ainsi que le store
 * utilisateur Zustand (source de vérité de /users/me dans l'app),
 * sans jamais bloquer l'appelant.
 */
export const refreshAfterServerAction = () => {
	void queryClient.invalidateQueries({ queryKey: MISSIONS_QUERY_KEY });
	void queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
	void queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
	useUserStore
		.getState()
		.getMe(true)
		.catch(() => {});
};
