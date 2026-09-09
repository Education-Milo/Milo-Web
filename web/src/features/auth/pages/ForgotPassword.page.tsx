import React from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import "@features/auth/styles/AuthShared.css";
import "@features/auth/styles/ForgotPassword.css";
import miloLogo from "/milo-logo.png";
import TextFieldComponent from "@shared/components/TextField.component";
import MainButtonComponent from "@shared/components/MainButton.component";
import useForgotPassword from "@features/auth/hooks/userForgotPassword";

const ForgotPassword: React.FC = () => {
	const {
		email,
		setEmail,
		emailError,
		isLoading,
		isSubmitted,
		handleSubmit,
		handleBackToLogin,
		resend,
	} = useForgotPassword();

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !isLoading) {
			handleSubmit();
		}
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
					{isSubmitted ? (
						<>
							<div className="login-intro">
								<div className="success-icon-circle">
									<CheckCircle2 size={30} />
								</div>
								<h2 className="form-title">Email envoyé !</h2>
								<p className="form-subtitle">
									On a envoyé un lien de réinitialisation à{" "}
									<strong>{email}</strong>.
								</p>
							</div>

							<div className="form">
								<MainButtonComponent
									title="Retour à la connexion"
									onPress={handleBackToLogin}
								/>

								<div className="signup-section">
									{emailError && (
										<p className="forgot-error-text">{emailError}</p>
									)}
									<p className="signup-text">
										Rien reçu ?{" "}
										<button
											type="button"
											className="signup-link"
											onClick={resend}
											disabled={isLoading}
										>
											{isLoading ? "Envoi en cours..." : "Renvoyer l'email"}
										</button>
									</p>
								</div>
							</div>
						</>
					) : (
						<>
							<div className="login-intro">
								<img src={miloLogo} alt="Milo Logo" className="login-logo" />
								<h2 className="form-title">Mot de passe oublié ?</h2>
								<p className="form-subtitle">
									On t'envoie un lien pour le réinitialiser.
								</p>
							</div>

							<div className="form">
								<TextFieldComponent
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder="Ton adresse email"
									icon={<Mail className="w-5 h-5 text-gray-500" />}
									error={emailError}
									disabled={isLoading}
								/>

								<MainButtonComponent
									title={isLoading ? "Envoi en cours..." : "Envoyer le lien"}
									onPress={handleSubmit}
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
				</motion.div>
			</main>
		</div>
	);
};

export default ForgotPassword;
