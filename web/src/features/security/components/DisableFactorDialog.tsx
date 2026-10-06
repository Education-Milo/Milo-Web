import React, { useState } from "react";
import { AlertTriangle, Loader, ShieldOff } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import type { SecondFactor, TwoFactorStatus } from "@features/security/store/security.model";
import {
	useDisableEmail,
	useDisableTotp,
	useSendSettingsCode,
} from "@features/security/store/security.queries";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { showToast } from "@shared/store/toast/toast.store";

interface DisableFactorDialogProps {
	factor: SecondFactor;
	status: TwoFactorStatus;
	onClose: () => void;
}

/**
 * Retirer un facteur exige le mot de passe ET un code : un jeton d'accès
 * volé ne doit pas suffire à retirer la protection qu'il contourne.
 */
const DisableFactorDialog: React.FC<DisableFactorDialogProps> = ({ factor, status, onClose }) => {
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [codeSent, setCodeSent] = useState(false);

	const disableTotp = useDisableTotp();
	const disableEmail = useDisableEmail();
	const sendCode = useSendSettingsCode();
	const mutation = factor === "totp" ? disableTotp : disableEmail;

	const otherFactorActive = factor === "totp" ? status.email_enabled : status.totp_enabled;
	const factorLabel = factor === "totp" ? "l'application d'authentification" : "le code par email";

	const handleSendCode = () => {
		setError(null);
		sendCode.mutate(undefined, {
			onSuccess: () => setCodeSent(true),
			onError: (err) => setError(getSecurityErrorMessage(err)),
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!password || !code.trim() || mutation.isPending) return;
		setError(null);
		mutation.mutate(
			{ current_password: password, code: code.trim() },
			{
				onSuccess: () => {
					showToast(
						otherFactorActive
							? `${factor === "totp" ? "Application d'authentification" : "Code par email"} désactivé.`
							: "Double authentification désactivée.",
						"success",
					);
					onClose();
				},
				onError: (err) => {
					setError(getSecurityErrorMessage(err));
					setCode("");
				},
			},
		);
	};

	return (
		<SecurityDialog
			title={`Désactiver ${factorLabel}`}
			subtitle="Confirme ton identité avec ton mot de passe et un code"
			icon={<ShieldOff size={20} />}
			onClose={onClose}
			dismissible={!mutation.isPending}
		>
			<form className="sec-form" onSubmit={handleSubmit}>
				{!otherFactorActive && (
					<p className="sec-alert sec-alert--warning">
						<AlertTriangle size={18} />
						<span>
							C'est ton dernier facteur : la double authentification sera désactivée, tes codes de secours
							et tes appareils de confiance avec.
						</span>
					</p>
				)}

				<label className="sec-field">
					<span>Mot de passe actuel</span>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						autoFocus
					/>
				</label>

				<label className="sec-field">
					<span>Code de vérification</span>
					<input
						type="text"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						autoComplete="one-time-code"
						autoCapitalize="off"
						spellCheck={false}
						placeholder="Code de l'application, reçu par email ou de secours"
					/>
				</label>

				<div className="sec-hints">
					{status.email_enabled && (
						<button type="button" className="sec-link" onClick={handleSendCode} disabled={sendCode.isPending}>
							{sendCode.isPending ? "Envoi..." : codeSent ? "Renvoyer un code par email" : "Recevoir un code par email"}
						</button>
					)}
					{codeSent && <span className="sec-note">Code envoyé à l'adresse email de ton compte.</span>}
					{status.totp_enabled && (
						<span className="sec-note">
							Un code d'application ne sert qu'une fois : pour enchaîner deux opérations, attends le code suivant.
						</span>
					)}
				</div>

				{error && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{error}</span></p>}

				<div className="sec-actions">
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={mutation.isPending}>
						Annuler
					</button>
					<button
						type="submit"
						className="sec-btn sec-btn--danger"
						disabled={!password || !code.trim() || mutation.isPending}
					>
						{mutation.isPending && <Loader size={16} className="sec-spin" />} Désactiver
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default DisableFactorDialog;
