import React, { useEffect, useState } from "react";
import { FlaskConical, Loader, Undo2 } from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useUserStore } from "@shared/store/user/user.store";
import { clearDemoSession, isDemoActive } from "@shared/store/auth/demoSession";
import "@shared/styles/DemoBanner.css";

const ROLE_LABELS: Record<string, string> = {
	Enfant: "Élève",
	Parent: "Parent",
	Prof: "Professeur",
	Admin: "Administrateur",
};

/**
 * Bandeau persistant pendant qu'un admin emprunte un profil de démonstration.
 * Source de vérité : `is_demo` de /users/me, donc il réapparaît après un
 * rechargement de la page.
 */
const DemoBanner: React.FC = () => {
	const user = useUserStore((state) => state.user);
	const exitDemo = useAuthStore((state) => state.exitDemo);
	const [leaving, setLeaving] = useState(false);

	// Session de démo mémorisée alors que le serveur ne voit plus un profil de
	// démo (jeton remplacé ailleurs) : on oublie la bascule.
	useEffect(() => {
		if (user && !user.is_demo && isDemoActive()) clearDemoSession();
	}, [user]);

	if (!user?.is_demo) return null;

	const handleExit = async () => {
		setLeaving(true);
		try {
			await exitDemo(); // recharge la page sur le compte admin
		} catch {
			setLeaving(false);
		}
	};

	return (
		<div className="demo-banner" role="status" aria-live="polite">
			<FlaskConical size={16} aria-hidden="true" />
			<span className="demo-banner-text">
				<strong>Mode démonstration — {ROLE_LABELS[user.role] ?? user.role}</strong>
				<span className="demo-banner-user">@{user.username}</span>
			</span>
			<button type="button" className="demo-banner-btn" onClick={handleExit} disabled={leaving}>
				{leaving ? <Loader size={14} className="demo-banner-spin" /> : <Undo2 size={14} />}
				Revenir à mon compte admin
			</button>
		</div>
	);
};

export default DemoBanner;
