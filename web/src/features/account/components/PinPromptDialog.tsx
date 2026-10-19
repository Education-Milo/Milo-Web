import React, { useState } from "react";
import { isAxiosError } from "axios";
import { AlertTriangle, Loader, Lock } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import CodeInput from "@features/auth/components/CodeInput.component";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import type { ProfileSummary } from "@shared/store/auth/auth.model";
import { PIN_LENGTH } from "@features/account/store/account.model";
import "@features/security/styles/Security.css";

interface PinPromptDialogProps {
	profile: ProfileSummary;
	/** Ouvre le profil avec le code saisi ; rejette en cas d'échec. */
	onSubmit: (pin: string) => Promise<void>;
	onClose: () => void;
	/** Le jeton de compte a expiré : retour à la connexion. */
	onSessionExpired: () => void;
	/** Le profil n'existe plus (supprimé depuis un autre appareil). */
	onProfileGone: () => void;
}

/** Code PIN d'un profil verrouillé, avant de l'ouvrir. 5 erreurs : 15 minutes de blocage. */
const PinPromptDialog: React.FC<PinPromptDialogProps> = ({
	profile,
	onSubmit,
	onClose,
	onSessionExpired,
	onProfileGone,
}) => {
	const [pin, setPin] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	/** Remonte la saisie après un échec : cases vidées et focus sur la première */
	const [attempt, setAttempt] = useState(0);

	const submit = async (value: string) => {
		if (value.length !== PIN_LENGTH || isSubmitting) return;
		setIsSubmitting(true);
		setError(null);
		try {
			await onSubmit(value);
		} catch (err) {
			const status = isAxiosError(err) ? err.response?.status : undefined;
			if (status === 401) return onSessionExpired();
			if (status === 404) return onProfileGone();
			setError(
				status === 403
					? "Code PIN incorrect."
					: status === 429
						? "Trop d'essais : ce profil est verrouillé pendant 15 minutes."
						: getSecurityErrorMessage(err),
			);
			setPin("");
			setAttempt((n) => n + 1);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (value: string) => {
		setPin(value);
		setError(null);
		// Saisie complète : on valide sans attendre de clic
		if (value.length === PIN_LENGTH) void submit(value);
	};

	return (
		<SecurityDialog
			title={`Profil de ${profile.first_name}`}
			subtitle="Ce profil est protégé par un code PIN"
			icon={<Lock size={20} />}
			onClose={onClose}
			dismissible={!isSubmitting}
		>
			<form
				className="sec-form"
				onSubmit={(e) => {
					e.preventDefault();
					void submit(pin);
				}}
			>
				<CodeInput key={attempt} value={pin} onChange={handleChange} length={PIN_LENGTH} disabled={isSubmitting} autoFocus />
				{error && (
					<p className="sec-alert sec-alert--error">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}
				<p className="sec-note">
					Code oublié ? Le mot de passe du compte permet de le retirer depuis « Gérer les profils ».
				</p>
				<div className="sec-actions">
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={isSubmitting}>
						Annuler
					</button>
					<button type="submit" className="sec-btn sec-btn--primary" disabled={pin.length !== PIN_LENGTH || isSubmitting}>
						{isSubmitting && <Loader size={16} className="sec-spin" />} Ouvrir
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default PinPromptDialog;
