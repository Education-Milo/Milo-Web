import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { showToast } from "@shared/store/toast/toast.store";
import { ROUTES } from "@shared/constants/routes";

/**
 * « Changer de profil » : quitte le profil (POST /logout/profile) et revient
 * à « Qui est-ce ? » sur la session de compte, sans mot de passe. Le profil
 * quitté ne se rouvre ensuite que par la sélection, donc avec son PIN.
 */
export const useLeaveProfile = () => {
	const navigate = useNavigate();
	const leaveProfile = useAuthStore((state) => state.leaveProfile);
	const [isLeaving, setIsLeaving] = useState(false);

	const leave = useCallback(async () => {
		if (isLeaving) return;
		setIsLeaving(true);
		try {
			const outcome = await leaveProfile();
			// `reloading` : la page se recharge d'elle-même sur l'écran de choix
			if (outcome === "select_profile") navigate(ROUTES.PROFILE_SELECT, { replace: true });
			else if (outcome === "logged_out") navigate(ROUTES.LOGIN, { replace: true });
			if (outcome !== "reloading") setIsLeaving(false);
		} catch {
			showToast("Impossible de changer de profil pour le moment, réessaie dans un instant.", "error");
			setIsLeaving(false);
		}
	}, [isLeaving, leaveProfile, navigate]);

	return { leave, isLeaving };
};
