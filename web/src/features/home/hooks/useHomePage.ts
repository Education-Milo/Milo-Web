import { useEffect } from "react";
import { useUserStore } from "@shared/store/user/user.store";

/**
 * Accueil : charge le profil s'il ne l'est pas encore (prénom du titre,
 * missions, courrier). L'ancien message selon l'heure (« Bon après-midi… »)
 * a été retiré : la carte d'accueil salue avec le prénom, Milo dans sa bulle.
 */
export const useHomePage = () => {
	const { user, getMe } = useUserStore();

	useEffect(() => {
		if (!user) {
			getMe();
		}
	}, [user, getMe]);
};
