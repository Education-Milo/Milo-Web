import React, { useState } from "react";
import { AlertTriangle, KeyRound, Loader } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useUpdateProfilePin } from "@features/account/store/account.queries";
import { PIN_LENGTH } from "@features/account/store/account.model";
import type { ProfileSummary } from "@shared/store/auth/auth.model";
import { showToast } from "@shared/store/toast/toast.store";
import "@features/security/styles/Security.css";

interface ProfilePinDialogProps {
	profile: ProfileSummary;
	onClose: () => void;
}

/**
 * Pose, change ou retire le code PIN d'un profil. Mot de passe du compte
 * exigé : un enfant ne doit pas pouvoir retirer le verrou du profil parent.
 * C'est aussi la porte de sortie d'un PIN oublié.
 */
const ProfilePinDialog: React.FC<ProfilePinDialogProps> = ({ profile, onClose }) => {
	const updatePin = useUpdateProfilePin();
	const [pin, setPin] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const save = (nextPin: string | null) => {
		if (updatePin.isPending || !password) return;
		setError(null);
		updatePin.mutate(
			{ profileId: profile.id, current_password: password, pin: nextPin },
			{
				onSuccess: () => {
					showToast(nextPin ? "Code PIN enregistré." : "Code PIN retiré.", "success");
					onClose();
				},
				onError: (err) => {
					setError(getSecurityErrorMessage(err));
					setPassword("");
				},
			},
		);
	};

	const pinComplete = pin.length === PIN_LENGTH;

	return (
		<SecurityDialog
			title={profile.has_pin ? `Code PIN de ${profile.first_name}` : `Verrouiller le profil de ${profile.first_name}`}
			subtitle="Le code est demandé à l'ouverture du profil"
			icon={<KeyRound size={20} />}
			onClose={onClose}
			dismissible={!updatePin.isPending}
		>
			<form
				className="sec-form"
				onSubmit={(e) => {
					e.preventDefault();
					if (pinComplete) save(pin);
				}}
			>
				<label className="sec-field">
					<span>{profile.has_pin ? "Nouveau code PIN" : "Code PIN"}</span>
					<input
						type="password"
						inputMode="numeric"
						autoComplete="off"
						maxLength={PIN_LENGTH}
						value={pin}
						onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
						placeholder={`${PIN_LENGTH} chiffres`}
						autoFocus
					/>
				</label>

				<label className="sec-field">
					<span>Mot de passe du compte</span>
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
					{profile.has_pin && (
						<button
							type="button"
							className="sec-btn sec-btn--danger-ghost"
							onClick={() => save(null)}
							disabled={!password || updatePin.isPending}
						>
							Retirer le code
						</button>
					)}
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={updatePin.isPending}>
						Annuler
					</button>
					<button
						type="submit"
						className="sec-btn sec-btn--primary"
						disabled={!pinComplete || !password || updatePin.isPending}
					>
						{updatePin.isPending && <Loader size={16} className="sec-spin" />} Enregistrer
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default ProfilePinDialog;
