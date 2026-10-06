import React, { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import type { TwoFactorChallenge, TwoFactorMethod } from "@shared/store/auth/auth.model";
import CodeInput from "@features/auth/components/CodeInput.component";
import { AuthErrorMessage } from "@features/auth/components/AuthErrorMessage.component";
import MainButtonComponent from "@shared/components/MainButton.component";
import { describeThisDevice } from "@shared/utils/device";
import "@features/auth/styles/TwoFactor.css";

const CODE_LENGTH = 6;
const EMAIL_RESEND_COOLDOWN_S = 30;

const METHOD_META: Record<TwoFactorMethod, { label: string; icon: React.ReactNode; hint: string }> = {
	totp: {
		label: "Application",
		icon: <Smartphone size={16} />,
		hint: "Saisis le code à 6 chiffres affiché dans ton application d'authentification.",
	},
	email: {
		label: "Email",
		icon: <Mail size={16} />,
		hint: "Reçois un code à 6 chiffres sur l'adresse email de ton compte.",
	},
	recovery: {
		label: "Code de secours",
		icon: <KeyRound size={16} />,
		hint: "Saisis l'un des codes de secours conservés lors de l'activation. Chaque code ne sert qu'une fois.",
	},
};

/** Ordre de préférence quand plusieurs méthodes sont disponibles */
const METHOD_ORDER: TwoFactorMethod[] = ["totp", "email", "recovery"];

const errorDetail = (error: unknown): string | null => {
	if (!isAxiosError(error)) return null;
	const detail = error.response?.data?.detail;
	if (typeof detail === "string") return detail;
	if (Array.isArray(detail)) {
		return detail.map((d) => (typeof d === "string" ? d : d?.msg)).filter(Boolean).join(" · ");
	}
	return null;
};

const formatRemaining = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

interface TwoFactorStepProps {
	challenge: TwoFactorChallenge;
	/** Horodatage (ms) d'expiration du défi */
	expiresAt: number;
	onSuccess: () => void;
	/** Défi mort (expiré, épuisé, sessions révoquées) : retour au mot de passe */
	onRestart: (message?: string) => void;
}

const TwoFactorStep: React.FC<TwoFactorStepProps> = ({ challenge, expiresAt, onSuccess, onRestart }) => {
	const completeTwoFactor = useAuthStore((state) => state.completeTwoFactor);
	const sendTwoFactorEmail = useAuthStore((state) => state.sendTwoFactorEmail);

	const methods = METHOD_ORDER.filter((m) => challenge.methods.includes(m));
	const [method, setMethod] = useState<TwoFactorMethod>(methods[0] ?? "totp");
	const [code, setCode] = useState("");
	const [trustDevice, setTrustDevice] = useState(false);
	const [deviceName, setDeviceName] = useState(describeThisDevice);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [emailSent, setEmailSent] = useState(false);
	const [isSendingEmail, setIsSendingEmail] = useState(false);
	const [resendIn, setResendIn] = useState(0);
	const [remaining, setRemaining] = useState(() => Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
	const autoSentRef = useRef(false);

	// Compte à rebours du défi : à zéro, il faut repartir du mot de passe
	useEffect(() => {
		const tick = () => {
			const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
			setRemaining(left);
			if (left === 0) onRestart("Le délai de vérification est écoulé. Reconnecte-toi pour recevoir un nouveau code.");
		};
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [expiresAt, onRestart]);

	useEffect(() => {
		if (resendIn <= 0) return;
		const timeout = setTimeout(() => setResendIn((s) => s - 1), 1000);
		return () => clearTimeout(timeout);
	}, [resendIn]);

	const sendEmail = useCallback(async () => {
		setIsSendingEmail(true);
		setError("");
		try {
			// Réponse générique quoi qu'il arrive : on ne sait pas si l'envoi a eu lieu
			await sendTwoFactorEmail(challenge.challenge_token);
			setEmailSent(true);
			setResendIn(EMAIL_RESEND_COOLDOWN_S);
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 401) {
				onRestart("Le délai de vérification est écoulé. Reconnecte-toi pour recevoir un nouveau code.");
				return;
			}
			setError(errorDetail(err) ?? "Impossible d'envoyer le code pour le moment, réessaie dans un instant.");
		} finally {
			setIsSendingEmail(false);
		}
	}, [challenge.challenge_token, onRestart, sendTwoFactorEmail]);

	// Email seul facteur disponible (hors secours) : on envoie le code d'emblée
	useEffect(() => {
		if (method === "email" && !challenge.methods.includes("totp") && !autoSentRef.current) {
			autoSentRef.current = true;
			void sendEmail();
		}
	}, [method, challenge.methods, sendEmail]);

	const isCodeComplete = method === "recovery" ? code.trim().length > 0 : code.length === CODE_LENGTH;

	const handleSubmit = async () => {
		if (!isCodeComplete || isSubmitting) return;
		setIsSubmitting(true);
		setError("");
		try {
			await completeTwoFactor({
				challengeToken: challenge.challenge_token,
				method,
				code,
				trustDevice,
				deviceName,
			});
			onSuccess();
		} catch (err) {
			const status = isAxiosError(err) ? err.response?.status : undefined;
			const detail = errorDetail(err);
			if (status === 401 && detail && /défi/i.test(detail)) {
				onRestart("Ta vérification a expiré ou a été annulée. Reconnecte-toi pour recevoir un nouveau code.");
				return;
			}
			if (status === 401) {
				setError("Code invalide. Vérifie-le et réessaie.");
			} else if (status === 429) {
				setError(detail ?? "Trop de tentatives. Patiente un instant avant de réessayer.");
			} else {
				setError(detail ?? "Une erreur est survenue, réessaie dans un instant.");
			}
			setCode("");
		} finally {
			setIsSubmitting(false);
		}
	};

	const switchMethod = (next: TwoFactorMethod) => {
		if (next === method) return;
		setMethod(next);
		setCode("");
		setError("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") void handleSubmit();
	};

	return (
		<div className="tf-step" onKeyDown={handleKeyDown}>
			<div className="login-intro">
				<div className="tf-badge" aria-hidden="true">
					<ShieldCheck size={30} />
				</div>
				<h2 className="form-title">Vérification en deux étapes</h2>
				<p className="form-subtitle">
					Ton compte est protégé par un second facteur. Encore une étape avant d'y accéder.
				</p>
			</div>

			<div className="form">
				{methods.length > 1 && (
					<div className="tf-methods" role="tablist" aria-label="Méthode de vérification">
						{methods.map((m) => (
							<button
								key={m}
								type="button"
								role="tab"
								aria-selected={method === m}
								className={`tf-method ${method === m ? "is-active" : ""}`}
								onClick={() => switchMethod(m)}
								disabled={isSubmitting}
							>
								{METHOD_META[m].icon}
								<span>{METHOD_META[m].label}</span>
							</button>
						))}
					</div>
				)}

				<p className="tf-hint">{METHOD_META[method].hint}</p>

				<AuthErrorMessage message={error} />

				{method === "email" && (
					<div className="tf-email">
						{emailSent && (
							<p className="tf-email-sent">
								Si l'envoi a abouti, le code arrive dans ta boîte mail d'ici quelques instants.
							</p>
						)}
						<button
							type="button"
							className="tf-link"
							onClick={() => void sendEmail()}
							disabled={isSendingEmail || resendIn > 0}
						>
							{isSendingEmail
								? "Envoi en cours..."
								: !emailSent
									? "M'envoyer le code par email"
									: resendIn > 0
										? `Renvoyer le code (${resendIn} s)`
										: "Renvoyer le code"}
						</button>
					</div>
				)}

				{method === "recovery" ? (
					<input
						type="text"
						className="tf-recovery-input"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder="Code de secours"
						autoComplete="off"
						autoCapitalize="off"
						spellCheck={false}
						disabled={isSubmitting}
						aria-label="Code de secours"
						autoFocus
					/>
				) : (
					<CodeInput
						key={method}
						value={code}
						onChange={setCode}
						length={CODE_LENGTH}
						disabled={isSubmitting}
						autoFocus={method === "totp"}
					/>
				)}

				<label className="tf-trust">
					<input
						type="checkbox"
						checked={trustDevice}
						onChange={(e) => setTrustDevice(e.target.checked)}
						disabled={isSubmitting}
					/>
					<span>
						<strong>Faire confiance à cet appareil pendant 30 jours</strong>
						<small>Le mot de passe restera demandé, mais plus le code. À éviter sur un ordinateur partagé.</small>
					</span>
				</label>
				{trustDevice && (
					<label className="tf-device-name">
						<span>Nom de l'appareil</span>
						<input
							type="text"
							value={deviceName}
							maxLength={100}
							onChange={(e) => setDeviceName(e.target.value)}
							disabled={isSubmitting}
						/>
					</label>
				)}

				<MainButtonComponent
					title={isSubmitting ? "Vérification..." : "Valider"}
					onPress={() => void handleSubmit()}
					loading={isSubmitting}
					disabled={!isCodeComplete}
				/>

				<div className="tf-footer">
					<button type="button" className="tf-link tf-link--muted" onClick={() => onRestart()} disabled={isSubmitting}>
						<ArrowLeft size={14} /> Revenir à la connexion
					</button>
					<span className="tf-timer" aria-live="off">Expire dans {formatRemaining(remaining)}</span>
				</div>
			</div>
		</div>
	);
};

export default TwoFactorStep;
