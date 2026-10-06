import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Check, CheckCircle2, Copy, Loader, Mail, Smartphone } from "lucide-react";
import CodeInput from "@features/auth/components/CodeInput.component";
import SecurityDialog from "@features/security/components/SecurityDialog";
import RecoveryCodesBlock from "@features/security/components/RecoveryCodesBlock";
import type { SecondFactor, TotpSetupResponse } from "@features/security/store/security.model";
import {
	useConfirmEmail,
	useConfirmTotp,
	useEnableEmail,
	useRevokeOtherSessions,
	useSetupTotp,
} from "@features/security/store/security.queries";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";

const CODE_LENGTH = 6;

interface EnableFactorDialogProps {
	factor: SecondFactor;
	/** Reconfiguration d'un facteur déjà actif (ex. nouveau téléphone) */
	isReconfigure?: boolean;
	onClose: () => void;
}

type Step = "password" | "verify" | "done";

/** "JBSWY3DPEHPK3PXP" → "JBSW Y3DP EHPK 3PXP" pour la saisie manuelle */
const groupSecret = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

const EnableFactorDialog: React.FC<EnableFactorDialogProps> = ({ factor, isReconfigure = false, onClose }) => {
	const [step, setStep] = useState<Step>("password");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
	const [secretCopied, setSecretCopied] = useState(false);
	const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
	const [codesSaved, setCodesSaved] = useState(false);
	const [sessionsMessage, setSessionsMessage] = useState<string | null>(null);

	const setupTotp = useSetupTotp();
	const confirmTotp = useConfirmTotp();
	const enableEmail = useEnableEmail();
	const confirmEmail = useConfirmEmail();
	const revokeOthers = useRevokeOtherSessions();

	const isTotp = factor === "totp";
	const isBusy = setupTotp.isPending || confirmTotp.isPending || enableEmail.isPending || confirmEmail.isPending;
	// Les codes de secours doivent être sauvegardés avant de pouvoir fermer
	const mustAcknowledgeCodes = step === "done" && recoveryCodes !== null && !codesSaved;

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!password || isBusy) return;
		setError(null);
		const onError = (err: unknown) => setError(getSecurityErrorMessage(err));
		if (isTotp) {
			setupTotp.mutate(password, {
				onSuccess: (data) => {
					setSetup(data);
					setStep("verify");
				},
				onError,
			});
		} else {
			enableEmail.mutate(password, { onSuccess: () => setStep("verify"), onError });
		}
	};

	const handleResendEmail = () => {
		setError(null);
		enableEmail.mutate(password, { onError: (err) => setError(getSecurityErrorMessage(err)) });
	};

	const handleVerify = (e: React.FormEvent) => {
		e.preventDefault();
		if (code.length !== CODE_LENGTH || isBusy) return;
		setError(null);
		const confirm = isTotp ? confirmTotp : confirmEmail;
		confirm.mutate(code, {
			onSuccess: (data) => {
				// Clé absente (pas null) hors activation du premier facteur
				if (Array.isArray(data.recovery_codes) && data.recovery_codes.length > 0) {
					setRecoveryCodes(data.recovery_codes);
				}
				setPassword("");
				setStep("done");
			},
			onError: (err) => {
				setError(getSecurityErrorMessage(err));
				setCode("");
			},
		});
	};

	const handleCopySecret = async () => {
		if (!setup) return;
		try {
			await navigator.clipboard.writeText(setup.secret);
			setSecretCopied(true);
			setTimeout(() => setSecretCopied(false), 2000);
		} catch {
			// presse-papiers indisponible : le secret reste lisible à l'écran
		}
	};

	const handleRevokeOthers = () => {
		setSessionsMessage(null);
		revokeOthers.mutate(undefined, {
			onSuccess: (count) =>
				setSessionsMessage(
					count > 0
						? `${count} autre${count > 1 ? "s" : ""} session${count > 1 ? "s" : ""} déconnectée${count > 1 ? "s" : ""}.`
						: "Aucune autre session ouverte.",
				),
			onError: () =>
				setSessionsMessage(
					"Impossible d'identifier cette session ici. Utilise « Se déconnecter de tous les appareils » si besoin.",
				),
		});
	};

	const title = isTotp
		? isReconfigure ? "Reconfigurer l'application" : "Application d'authentification"
		: "Code par email";

	return (
		<SecurityDialog
			title={title}
			subtitle={
				step === "password"
					? "Confirme ton mot de passe pour continuer"
					: step === "verify"
						? isTotp ? "Scanne le QR code, puis saisis le code affiché" : "Saisis le code reçu par email"
						: "C'est prêt"
			}
			icon={isTotp ? <Smartphone size={20} /> : <Mail size={20} />}
			onClose={onClose}
			dismissible={!mustAcknowledgeCodes && !isBusy}
		>
			{step === "password" && (
				<form className="sec-form" onSubmit={handlePasswordSubmit}>
					<p className="sec-text">
						{isTotp
							? "Tu utiliseras une application comme Google Authenticator, Microsoft Authenticator ou 1Password pour générer un code à chaque connexion."
							: "À chaque connexion, un code à 6 chiffres sera envoyé sur l'adresse email de ton compte."}
						{isReconfigure && " L'ancienne configuration reste active tant que la nouvelle n'est pas confirmée."}
					</p>
					<p className="sec-note">
						La double authentification nécessite la dernière version de l'application Milo sur tous tes appareils.
					</p>
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
					{error && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{error}</span></p>}
					<div className="sec-actions">
						<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={isBusy}>
							Annuler
						</button>
						<button type="submit" className="sec-btn sec-btn--primary" disabled={!password || isBusy}>
							{isBusy && <Loader size={16} className="sec-spin" />} Continuer
						</button>
					</div>
				</form>
			)}

			{step === "verify" && (
				<form className="sec-form" onSubmit={handleVerify}>
					{isTotp && setup && (
						<div className="sec-qr">
							<div className="sec-qr-code">
								<QRCodeSVG value={setup.otpauth_uri} size={176} marginSize={2} title="QR code de configuration" />
							</div>
							<div className="sec-qr-manual">
								<span className="sec-label">Saisie manuelle</span>
								<code className="sec-secret">{groupSecret(setup.secret)}</code>
								<button type="button" className="sec-btn sec-btn--ghost sec-btn--sm" onClick={() => void handleCopySecret()}>
									{secretCopied ? <Check size={14} /> : <Copy size={14} />}
									{secretCopied ? "Copiée" : "Copier la clé"}
								</button>
								<span className="sec-note">
									Cette clé expire dans {Math.round(setup.expires_in / 60)} minutes et ne sera plus jamais affichée.
								</span>
							</div>
						</div>
					)}
					{!isTotp && (
						<div className="sec-email-sent">
							<p className="sec-text">Un code vient d'être envoyé à l'adresse email de ton compte.</p>
							<button type="button" className="sec-link" onClick={handleResendEmail} disabled={isBusy}>
								Renvoyer le code
							</button>
						</div>
					)}
					<CodeInput value={code} onChange={setCode} length={CODE_LENGTH} disabled={isBusy} autoFocus />
					{error && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{error}</span></p>}
					<div className="sec-actions">
						<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={isBusy}>
							Annuler
						</button>
						<button type="submit" className="sec-btn sec-btn--primary" disabled={code.length !== CODE_LENGTH || isBusy}>
							{isBusy && <Loader size={16} className="sec-spin" />} Activer
						</button>
					</div>
				</form>
			)}

			{step === "done" && (
				<div className="sec-form">
					<p className="sec-alert sec-alert--success">
						<CheckCircle2 size={18} />
						<span>
							{isTotp ? "L'application d'authentification est activée." : "Le code par email est activé."} Tes
							appareils de confiance ont été révoqués : le code sera redemandé partout.
						</span>
					</p>

					{recoveryCodes && (
						<RecoveryCodesBlock codes={recoveryCodes} acknowledged={codesSaved} onAcknowledge={setCodesSaved} />
					)}

					<div className="sec-sessions-tip">
						<p className="sec-text">
							Tes sessions déjà ouvertes restent connectées. Si quelqu'un d'autre a pu accéder à ton compte,
							déconnecte-les.
						</p>
						<button
							type="button"
							className="sec-btn sec-btn--ghost sec-btn--sm"
							onClick={handleRevokeOthers}
							disabled={revokeOthers.isPending}
						>
							{revokeOthers.isPending && <Loader size={14} className="sec-spin" />}
							Déconnecter mes autres sessions
						</button>
						{sessionsMessage && <span className="sec-note">{sessionsMessage}</span>}
					</div>

					<div className="sec-actions">
						<button type="button" className="sec-btn sec-btn--primary" onClick={onClose} disabled={mustAcknowledgeCodes}>
							Terminer
						</button>
					</div>
				</div>
			)}
		</SecurityDialog>
	);
};

export default EnableFactorDialog;
