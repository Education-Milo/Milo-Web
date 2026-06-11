import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";

export const useHomePage = () => {
	const { user, getMe } = useUserStore();
	const navigate = useNavigate();

	const [welcomeMessage, setWelcomeMessage] = useState(
		"Bon retour, champion ! 🎉",
	);

	useEffect(() => {
		const hour = new Date().getHours();
		const firstName = user?.first_name || "Champion";

		if (hour < 12) {
			setWelcomeMessage(`Bonjour, ${firstName} ! 🌅`);
		} else if (hour < 17) {
			setWelcomeMessage(`Bon après-midi, ${firstName} ! ☀️`);
		} else {
			setWelcomeMessage(`Bonsoir, ${firstName} ! 🌙`);
		}
	}, [user]);

	useEffect(() => {
		if (!user) {
			getMe();
		}
	}, [user, getMe]);

	const handleMiloClick = () => {
		navigate(ROUTES.MILO);
	};

	return {
		welcomeMessage,
		handleMiloClick,
	};
};
