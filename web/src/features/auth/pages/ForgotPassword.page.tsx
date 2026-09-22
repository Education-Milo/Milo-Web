import React from "react";
import { motion } from "framer-motion";
import { Mail, Lock, KeyRound, Clock, ShieldCheck } from "lucide-react";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import { AuthErrorMessage } from "@features/auth/components/AuthErrorMessage.component";
import { AuthSuccessMessage } from "@features/auth/components/AuthSuccessMessage.component";
import CodeInput from "@features/auth/components/CodeInput.component";
import "@features/auth/styles/AuthShared.css";
import "@features/auth/styles/ForgotPassword.css";
import miloLogo from "/milo-logo.png";
import TextFieldComponent from "@shared/components/TextField.component";
import MainButtonComponent from "@shared/components/MainButton.component";
import useForgotPassword, {
	CODE_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "@features/auth/hooks/userForgotPassword";

const STEP_LABELS = ["Email", "Code", "Mot de passe"];

const formatCountdown = (seconds: number) => {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
};

const ForgotPassword: React.FC = () => {
	const {
		step,
		email,
		setEmail,
		emailError,
		code,
		setCode,
		codeError,
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
		passwordError,
		infoMessage,
		isLoading,
		codeRemainingSeconds,
		isCodeExpired,
		resendRemainingSeconds,
		canResend,
		handleSubmitEmail,
		resendCode,
		handleSubmitCode,
		handleSubmitPassword,
		goToStep,
		handleBackToLogin,
	} = useForgotPassword();

	const stepIndex = step === "email" ? 0 : step === "code" ? 1 : 2;

	const onEnter = (action: () => void) => (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !isLoading) action();
	};

	return (
		<div className="auth-page-root">
			<div className="auth-mesh"></div>

			<AuthHeader onBack={handleBackToLogin} backLabel="Retour à la connexion" />

			<main className="auth-main login-main">
				<motion.div
					className="auth-glass-card login-card"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", stiffness: 100, damping: 15 }}
				>
					{/* Indicateur d'étape */}
					<ol className="forgot-steps" aria-label="Progression">
						{STEP_LABELS.map((label, index) => (
							<li
								key={label}
								className={`forgot-step ${index === stepIndex ? "is-current" : ""} ${index < stepIndex ? "is-done" : ""}`}
								aria-current={index === stepIndex ? "step" : undefined}
							>
								<span className="forgot-step-index">{index + 1}</span>
								<span className="forgot-step-label">{label}</span>
							</li>
						))}
					</ol>

					{step === "email" && (
						<>
							<div className="login-intro">
								<img src={miloLogo} alt="Milo Logo" className="login-logo" />
								<h2 className="form-title">Mot de passe oublié ?</h2>
								<p className="form-subtitle">
									On t'envoie un code à {CODE_LENGTH} chiffres par email pour en choisir un nouveau.
								</p>
							</div>

							<div className="form">
								<TextFieldComponent
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyPress={onEnter(handleSubmitEmail)}
									placeholder="Ton adresse email"
									autoComplete="email"
									icon={<Mail className="w-5 h-5 text-gray-500" />}
									error={emailError}
									disabled={isLoading}
								/>

								<MainButtonComponent
									title={isLoading ? "Envoi en cours..." : "Recevoir un code"}
									onPress={handleSubmitEmail}
									loading={isLoading}
								/>

								<div className="signup-section">
									<p className="signup-text">
										Tu te souviens de ton mot de passe ?{" "}
										<button
											type="button"
											className="signup-link"
											onClick={handleBackToLogin}
											disabled={isLoading}
										>
											Se connecter
										</button>
									</p>
								</div>
							</div>
						</>
					)}

					{step === "code" && (
						<>
							<div className="login-intro">
								<div className="success-icon-circle">
									<KeyRound size={30} />
								</div>
								<h2 className="form-title">Entre le code reçu</h2>
								<p className="form-subtitle">
									Vérifie la boîte de <strong>{email.trim()}</strong>, sans oublier les spams.
								</p>
							</div>

							<div className="form">
								<AuthSuccessMessage message={infoMessage} />

								<CodeInput
									value={code}
									onChange={setCode}
									length={CODE_LENGTH}
									disabled={isLoading}
									error={codeError}
									autoFocus
								/>

								{codeRemainingSeconds !== null && (
									<p className={`forgot-countdown ${isCodeExpired ? "is-expired" : ""}`} role="timer">
										<Clock size={14} />
										{isCodeExpired
											? "Ce code a expiré, demande-en un nouveau."
											: `Code valable encore ${formatCountdown(codeRemainingSeconds)}`}
									</p>
								)}

								<MainButtonComponent
									title="Continuer"
									onPress={handleSubmitCode}
									loading={isLoading}
								/>

								<div className="signup-section">
									<p className="signup-text">
										Rien reçu ?{" "}
										<button
											type="button"
											className="signup-link"
											onClick={resendCode}
											disabled={!canResend}
										>
											{resendRemainingSeconds > 0
												? `Renvoyer un code (${resendRemainingSeconds}s)`
												: "Renvoyer un code"}
										</button>
									</p>
									<p className="signup-text forgot-hint">
										Un nouveau code remplace le précédent. Après 5 codes erronés, il faut en redemander un.
									</p>
									<p className="signup-text">
										<button
											type="button"
											className="signup-link"
											onClick={() => goToStep("email")}
											disabled={isLoading}
										>
											Changer d'adresse email
										</button>
									</p>
								</div>
							</div>
						</>
					)}

					{step === "password" && (
						<>
							<div className="login-intro">
								<div className="success-icon-circle">
									<ShieldCheck size={30} />
								</div>
								<h2 className="form-title">Nouveau mot de passe</h2>
								<p className="form-subtitle">
									Au moins {MIN_PASSWORD_LENGTH} caractères. Tu seras déconnecté de tous tes appareils.
								</p>
							</div>

							<div className="form">
								<AuthErrorMessage message={passwordError} />

								<TextFieldComponent
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Nouveau mot de passe"
									autoComplete="new-password"
									icon={<Lock className="w-5 h-5 text-gray-500" />}
									disabled={isLoading}
								/>
								<TextFieldComponent
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									onKeyPress={onEnter(handleSubmitPassword)}
									placeholder="Confirme le mot de passe"
									autoComplete="new-password"
									icon={<Lock className="w-5 h-5 text-gray-500" />}
									disabled={isLoading}
								/>

								<ul className="forgot-rules">
									<li className={newPassword.length >= MIN_PASSWORD_LENGTH ? "is-ok" : ""}>
										Au moins {MIN_PASSWORD_LENGTH} caractères
									</li>
									<li className={newPassword.length > 0 && newPassword === confirmPassword ? "is-ok" : ""}>
										Les deux champs sont identiques
									</li>
								</ul>

								<MainButtonComponent
									title={isLoading ? "Modification..." : "Changer mon mot de passe"}
									onPress={handleSubmitPassword}
									loading={isLoading}
								/>

								<div className="signup-section">
									<p className="signup-text">
										<button
											type="button"
											className="signup-link"
											onClick={() => goToStep("code")}
											disabled={isLoading}
										>
											Revenir au code
										</button>
									</p>
								</div>
							</div>
						</>
					)}
				</motion.div>
			</main>
		</div>
	);
};

export default ForgotPassword;
