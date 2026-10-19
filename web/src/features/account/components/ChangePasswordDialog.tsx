import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Check, Loader, Lock } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useChangePassword } from "@features/account/store/account.queries";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_CHARS } from "@features/account/store/account.model";
import { utf8Length } from "@features/account/utils/profile.format";
import { showToast } from "@shared/store/toast/toast.store";
import "@features/security/styles/Security.css";
import "@features/account/styles/Account.css";

interface ChangePasswordDialogProps {
	onClose: () => void;
}

/** Mot de passe du compte, commun à tous ses profils. Mot de passe actuel exigé. */
const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ onClose }) => {
	const changePassword = useChangePassword();
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);

	const checks = {
		length: next.length >= PASSWORD_MIN_CHARS && utf8Length(next) <= PASSWORD_MAX_BYTES,
		match: next.length > 0 && next === confirm,
	};
	const canSubmit = Boolean(current) && checks.length && checks.match && !changePassword.isPending;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		setError(null);
		changePassword.mutate(
			{ current_password: current, new_password: next },
			{
				onSuccess: () => {
					showToast("Mot de passe modifié.", "success");
					onClose();
				},
				onError: (err) => {
					setError(getSecurityErrorMessage(err));
					setCurrent("");
				},
			},
		);
	};

	return (
		<SecurityDialog
			title="Changer de mot de passe"
			subtitle="Il protège le compte et tous ses profils"
			icon={<Lock size={20} />}
			onClose={onClose}
			dismissible={!changePassword.isPending}
		>
			<form className="sec-form" onSubmit={handleSubmit}>
				<label className="sec-field">
					<span>Mot de passe actuel</span>
					<input
						type="password"
						value={current}
						onChange={(e) => setCurrent(e.target.value)}
						autoComplete="current-password"
						autoFocus
					/>
				</label>
				<label className="sec-field">
					<span>Nouveau mot de passe</span>
					<input
						type="password"
						value={next}
						onChange={(e) => setNext(e.target.value)}
						autoComplete="new-password"
						placeholder={`${PASSWORD_MIN_CHARS} caractères minimum`}
					/>
				</label>
				<label className="sec-field">
					<span>Confirmation</span>
					<input
						type="password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						autoComplete="new-password"
					/>
				</label>

				{next.length > 0 && (
					<ul className="acc-rules">
						<li className={checks.length ? "is-ok" : ""}>
							{checks.length ? <Check size={14} /> : <AlertCircle size={14} />}
							Au moins {PASSWORD_MIN_CHARS} caractères
						</li>
						<li className={checks.match ? "is-ok" : ""}>
							{checks.match ? <Check size={14} /> : <AlertCircle size={14} />}
							Les deux champs sont identiques
						</li>
					</ul>
				)}

				{error && (
					<p className="sec-alert sec-alert--error">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				<div className="sec-actions">
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={changePassword.isPending}>
						Annuler
					</button>
					<button type="submit" className="sec-btn sec-btn--primary" disabled={!canSubmit}>
						{changePassword.isPending && <Loader size={16} className="sec-spin" />} Enregistrer
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default ChangePasswordDialog;
