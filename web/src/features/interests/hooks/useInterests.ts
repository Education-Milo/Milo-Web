import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "@shared/store/user/user.store";
import { showToast } from "@shared/store/toast/toast.store";
import { AI_LIMITS, INTERESTS_LIMIT_MESSAGE, getErrorStatus } from "@shared/lib/aiRequests";

const INTEREST_SUGGESTIONS = ["Jeux Vidéo", "Football", "Mangas", "Histoire", "Musique", "Sciences"];

/**
 * Centres d'intérêt de l'élève : Milo s'en sert pour personnaliser les
 * exercices. Partagé entre la page Personnalisation et le profil.
 */
export const useInterests = () => {
	const user = useUserStore((state) => state.user);
	const getMe = useUserStore((state) => state.getMe);
	const addUserInterest = useUserStore((state) => state.addUserInterest);
	const deleteUserInterest = useUserStore((state) => state.deleteUserInterest);
	const [newInterest, setNewInterest] = useState("");

	// Arrivée directe sur la page : le profil n'est peut-être pas encore chargé
	useEffect(() => {
		if (!user) getMe().catch(() => undefined);
	}, [user, getMe]);

	const interests = useMemo(() => user?.Interests ?? [], [user?.Interests]);

	/** On ne propose que ce que l'élève n'a pas déjà. */
	const suggestions = useMemo(() => {
		const owned = interests.map((i) => i.name.trim().toLowerCase());
		return INTEREST_SUGGESTIONS.filter((s) => !owned.includes(s.toLowerCase()));
	}, [interests]);

	const handleAdd = async (interestName?: string) => {
		const name = (interestName || newInterest).trim().slice(0, AI_LIMITS.INTEREST_NAME);
		if (!name) return;
		try {
			await addUserInterest(name);
			if (!interestName) setNewInterest("");
		} catch (error) {
			// 409 : limite de centres d'intérêt atteinte
			showToast(
				getErrorStatus(error) === 409
					? INTERESTS_LIMIT_MESSAGE
					: "Impossible d'ajouter ce centre d'intérêt pour le moment.",
				"error",
			);
		}
	};

	return {
		interests,
		suggestions,
		newInterest,
		setNewInterest,
		handleAdd,
		handleDelete: deleteUserInterest,
	};
};
