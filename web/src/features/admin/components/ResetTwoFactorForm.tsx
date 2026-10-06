import React, { useState } from "react";
import { AlertTriangle, Loader, ShieldOff } from "lucide-react";
import { showToast } from "@shared/store/toast/toast.store";
import type { AdminUserRow } from "@features/admin/store/admin.model";
import { getAdminErrorMessage, useResetUserTwoFactor } from "@features/admin/store/admin.queries";

const MIN_REASON_LENGTH = 3;

interface ResetTwoFactorFormProps {
	user: Pick<AdminUserRow, "id" | "username">;
}

/**
 * Désactive la double authentification d'un compte (téléphone et codes de
 * secours perdus). Raison obligatoire : l'action est tracée dans le journal.
 */
const ResetTwoFactorForm: React.FC<ResetTwoFactorFormProps> = ({ user }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);
	const reset = useResetUserTwoFactor();

	const canSubmit = reason.trim().length >= MIN_REASON_LENGTH && !reset.isPending;

	const close = () => {
		setIsOpen(false);
		setReason("");
		setError(null);
	};

	const handleConfirm = () => {
		if (!canSubmit) return;
		setError(null);
		reset.mutate(
			{ userId: user.id, reason: reason.trim() },
			{
				onSuccess: () => {
					showToast(`Double authentification de @${user.username} désactivée.`, "success");
					close();
				},
				onError: (err) => setError(getAdminErrorMessage(err)),
			},
		);
	};

	return (
		<div className="ad-role-form">
			<h3 className="ad-subtitle">Double authentification</h3>
			{!isOpen ? (
				<div className="ad-2fa-row">
					<p className="ad-muted">
						Si l'utilisateur a perdu son téléphone et ses codes de secours, tu peux retirer tous ses facteurs.
						Ses sessions ouvertes restent connectées.
					</p>
					<button type="button" className="ad-btn ad-btn--ghost" onClick={() => setIsOpen(true)}>
						<ShieldOff size={16} /> Désactiver la 2FA
					</button>
				</div>
			) : (
				<div className="ad-confirm" role="alertdialog" aria-label="Désactiver la double authentification">
					<p>
						Retirer tous les facteurs de <strong>@{user.username}</strong> ? Ses codes de secours et ses appareils
						de confiance seront supprimés. Vérifie son identité avant de continuer.
					</p>
					<label className="ad-field ad-field--grow">
						<span>Raison (obligatoire, visible dans le journal)</span>
						<input
							type="text"
							value={reason}
							maxLength={200}
							placeholder="Ex. téléphone perdu, identité vérifiée par email le 07/10"
							onChange={(e) => setReason(e.target.value)}
							autoFocus
						/>
					</label>
					{error && (
						<p className="ad-alert ad-alert--error" role="alert">
							<AlertTriangle size={16} />
							<span>{error}</span>
						</p>
					)}
					<div className="ad-actions">
						<button type="button" className="ad-btn ad-btn--ghost" onClick={close} disabled={reset.isPending}>
							Annuler
						</button>
						<button type="button" className="ad-btn ad-btn--danger" onClick={handleConfirm} disabled={!canSubmit}>
							{reset.isPending ? <Loader size={16} className="ad-spin" /> : <ShieldOff size={16} />}
							Désactiver
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ResetTwoFactorForm;
