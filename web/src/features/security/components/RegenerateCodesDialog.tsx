import React, { useState } from "react";
import { AlertTriangle, KeyRound, Loader } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import RecoveryCodesBlock from "@features/security/components/RecoveryCodesBlock";
import { useRegenerateRecoveryCodes } from "@features/security/store/security.queries";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";

interface RegenerateCodesDialogProps {
	onClose: () => void;
}

/** Nouveau jeu de codes de secours : remplace l'ancien en entier. */
const RegenerateCodesDialog: React.FC<RegenerateCodesDialogProps> = ({ onClose }) => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [codes, setCodes] = useState<string[] | null>(null);
	const [saved, setSaved] = useState(false);
	const regenerate = useRegenerateRecoveryCodes();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!password || regenerate.isPending) return;
		setError(null);
		regenerate.mutate(password, {
			onSuccess: (data) => {
				setCodes(data.recovery_codes);
				setPassword("");
			},
			onError: (err) => setError(getSecurityErrorMessage(err)),
		});
	};

	const locked = codes !== null && !saved;

	return (
		<SecurityDialog
			title="Codes de secours"
			subtitle={codes ? "Ton nouveau jeu de codes" : "Confirme ton mot de passe pour générer de nouveaux codes"}
			icon={<KeyRound size={20} />}
			onClose={onClose}
			dismissible={!locked && !regenerate.isPending}
		>
			{codes ? (
				<div className="sec-form">
					<RecoveryCodesBlock codes={codes} acknowledged={saved} onAcknowledge={setSaved} />
					<div className="sec-actions">
						<button type="button" className="sec-btn sec-btn--primary" onClick={onClose} disabled={locked}>
							Terminer
						</button>
					</div>
				</div>
			) : (
				<form className="sec-form" onSubmit={handleSubmit}>
					<p className="sec-alert sec-alert--warning">
						<AlertTriangle size={18} />
						<span>Les codes actuels cesseront immédiatement de fonctionner.</span>
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
						<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={regenerate.isPending}>
							Annuler
						</button>
						<button type="submit" className="sec-btn sec-btn--primary" disabled={!password || regenerate.isPending}>
							{regenerate.isPending && <Loader size={16} className="sec-spin" />} Générer
						</button>
					</div>
				</form>
			)}
		</SecurityDialog>
	);
};

export default RegenerateCodesDialog;
