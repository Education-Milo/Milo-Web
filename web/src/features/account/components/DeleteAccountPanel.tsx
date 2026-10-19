import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import DeleteAccountDialog from "@features/account/components/DeleteAccountDialog";
import { useAccountProfiles } from "@features/account/store/account.queries";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { ROUTES } from "@shared/constants/routes";
import "@features/security/styles/Security.css";

/** Droit à l'effacement : supprimer le compte et tous ses profils. */
const DeleteAccountPanel: React.FC = () => {
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);
	const { data: profiles = [] } = useAccountProfiles();
	const [open, setOpen] = useState(false);

	const handleDeleted = async () => {
		setOpen(false);
		// Le serveur a révoqué toutes les sessions et effacé le cookie
		await logout({ remote: false });
		navigate(ROUTES.LOGIN, { replace: true, state: { message: "Ton compte et toutes ses données ont été supprimés." } });
	};

	return (
		<div className="sec-panel">
			<p className="sec-text">
				Supprime le compte, tous ses profils et toutes leurs données : XP, pièces, amis, duels et historique.
			</p>
			<div className="sec-actions sec-actions--start">
				<button type="button" className="sec-btn sec-btn--danger-ghost" onClick={() => setOpen(true)}>
					<Trash2 size={16} /> Supprimer le compte
				</button>
			</div>
			{open && (
				<DeleteAccountDialog
					profileCount={profiles.length}
					onClose={() => setOpen(false)}
					onDeleted={() => void handleDeleted()}
				/>
			)}
		</div>
	);
};

export default DeleteAccountPanel;
