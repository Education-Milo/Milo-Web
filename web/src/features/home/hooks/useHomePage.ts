import { useState, useEffect } from "react";
import { useUserStore } from "@shared/store/user/user.store";

export const useHomePage = () => {
	const { user, getMe } = useUserStore();

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

	return {
		welcomeMessage,
	};
};
