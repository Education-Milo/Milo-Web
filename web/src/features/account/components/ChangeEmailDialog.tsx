import React, { useState } from "react";
import { AlertTriangle, Loader, Mail } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useChangeEmail } from "@features/account/store/account.queries";
import { useUserStore } from "@shared/store/user/user.store";
import { showToast } from "@shared/store/toast/toast.store";
import "@features/security/styles/Security.css";

interface ChangeEmailDialogProps {
	currentEmail: string;
	onClose: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email de connexion du compte, commun à tous ses profils. */
const ChangeEmailDialog: React.FC<ChangeEmailDialogProps> = ({ currentEmail, onClose }) => {
	const changeEmail = useChangeEmail();
	const getMe = useUserStore((state) => state.getMe);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (changeEmail.isPending) return;
		const nextEmail = email.trim();
		if (!EMAIL_PATTERN.test(nextEmail)) {
			setError("Cette adresse email n'est pas valide.");
			return;
		}
		if (!password) {
			setError("Le mot de passe est requis.");
			return;
		}
		setError(null);
		changeEmail.mutate(
			{ current_password: password, new_email: nextEmail },
			{
				onSuccess: () => {
					// /users/me renvoie l'email du compte
					void getMe(true).catch(() => {});
					showToast("Adresse email modifiée.", "success");
					onClose();
				},
				onError: (err) => {
					setError(getSecurityErrorMessage(err));
					setPassword("");
				},
			},
		);
	};

	return (
		<SecurityDialog
			title="Changer d'adresse email"
			subtitle="Elle sert à se connecter au compte, pour tous ses profils"
			icon={<Mail size={20} />}
			onClose={onClose}
			dismissible={!changeEmail.isPending}
		>
			<form className="sec-form" onSubmit={handleSubmit}>
				<p className="sec-text">
					Adresse actuelle : <strong>{currentEmail}</strong>
				</p>
				<label className="sec-field">
					<span>Nouvelle adresse email</span>
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
				</label>
				<label className="sec-field">
					<span>Mot de passe actuel</span>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
					/>
				</label>

				{error && (
					<p className="sec-alert sec-alert--error">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				<div className="sec-actions">
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={changeEmail.isPending}>
						Annuler
					</button>
					<button type="submit" className="sec-btn sec-btn--primary" disabled={!email.trim() || !password || changeEmail.isPending}>
						{changeEmail.isPending && <Loader size={16} className="sec-spin" />} Enregistrer
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default ChangeEmailDialog;
