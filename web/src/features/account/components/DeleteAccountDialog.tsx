import React, { useState } from "react";
import { AlertTriangle, Loader, Trash2 } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useDeleteAccount } from "@features/account/store/account.queries";
import "@features/security/styles/Security.css";

interface DeleteAccountDialogProps {
	profileCount: number;
	onClose: () => void;
	onDeleted: () => void;
}

/**
 * Droit à l'effacement : supprime le compte, tous ses profils et toutes leurs
 * données, et révoque toutes les sessions. Confirmation explicite exigée.
 */
const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ profileCount, onClose, onDeleted }) => {
	const deleteAccount = useDeleteAccount();
	const [password, setPassword] = useState("");
	const [confirmed, setConfirmed] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!password || !confirmed || deleteAccount.isPending) return;
		setError(null);
		deleteAccount.mutate(password, {
			onSuccess: onDeleted,
			onError: (err) => {
				setError(getSecurityErrorMessage(err));
				setPassword("");
			},
		});
	};

	return (
		<SecurityDialog
			title="Supprimer le compte"
			subtitle="Cette action est définitive"
			icon={<Trash2 size={20} />}
			onClose={onClose}
			dismissible={!deleteAccount.isPending}
		>
			<form className="sec-form" onSubmit={handleSubmit}>
				<p className="sec-alert sec-alert--warning">
					<AlertTriangle size={18} />
					<span>
						{profileCount > 1
							? `Les ${profileCount} profils du compte et toutes leurs données`
							: "Le profil du compte et toutes ses données"}{" "}
						(XP, pièces, amis, duels, historique) seront effacés. Tous les appareils seront déconnectés.
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

				<label className="sec-check">
					<input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
					<span>Je comprends que mes données ne pourront pas être récupérées</span>
				</label>

				{error && (
					<p className="sec-alert sec-alert--error">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				<div className="sec-actions">
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={deleteAccount.isPending}>
						Annuler
					</button>
					<button
						type="submit"
						className="sec-btn sec-btn--danger"
						disabled={!password || !confirmed || deleteAccount.isPending}
					>
						{deleteAccount.isPending && <Loader size={16} className="sec-spin" />} Supprimer définitivement
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default DeleteAccountDialog;
