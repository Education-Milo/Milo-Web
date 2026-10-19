import React, { useState } from "react";
import { AlertTriangle, Loader, Trash2 } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useDeleteProfile } from "@features/account/store/account.queries";
import type { DeleteProfileResponse } from "@features/account/store/account.model";
import type { ProfileSummary } from "@shared/store/auth/auth.model";
import "@features/security/styles/Security.css";

interface DeleteProfileDialogProps {
	profile: ProfileSummary;
	/** Dernier profil du compte : le compte est supprimé avec lui. */
	isLastProfile: boolean;
	onClose: () => void;
	onDeleted: (result: DeleteProfileResponse) => void;
}

/** Supprime un profil et toutes ses données. Mot de passe du compte exigé. */
const DeleteProfileDialog: React.FC<DeleteProfileDialogProps> = ({ profile, isLastProfile, onClose, onDeleted }) => {
	const deleteProfile = useDeleteProfile();
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!password || deleteProfile.isPending) return;
		setError(null);
		deleteProfile.mutate(
			{ profileId: profile.id, current_password: password },
			{
				onSuccess: onDeleted,
				onError: (err) => {
					setError(getSecurityErrorMessage(err));
					setPassword("");
				},
			},
		);
	};

	return (
		<SecurityDialog
			title={`Supprimer le profil de ${profile.first_name}`}
			subtitle="Cette action est définitive"
			icon={<Trash2 size={20} />}
			onClose={onClose}
			dismissible={!deleteProfile.isPending}
		>
			<form className="sec-form" onSubmit={handleSubmit}>
				<p className="sec-alert sec-alert--warning">
					<AlertTriangle size={18} />
					<span>
						{isLastProfile
							? "C'est le dernier profil : le compte sera supprimé avec lui, et toutes ses données (XP, amis, historique) effacées."
							: "Toutes les données de ce profil seront effacées : XP, pièces, amis, duels et historique."}
					</span>
				</p>

				<label className="sec-field">
					<span>Mot de passe du compte</span>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						autoFocus
					/>
				</label>

				{error && (
					<p className="sec-alert sec-alert--error">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				<div className="sec-actions">
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={deleteProfile.isPending}>
						Annuler
					</button>
					<button type="submit" className="sec-btn sec-btn--danger" disabled={!password || deleteProfile.isPending}>
						{deleteProfile.isPending && <Loader size={16} className="sec-spin" />}{" "}
						{isLastProfile ? "Supprimer le profil et le compte" : "Supprimer le profil"}
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default DeleteProfileDialog;
