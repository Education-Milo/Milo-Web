import React from "react";
import { Mail, Lock } from "lucide-react";
import { useLoginForm } from "@features/auth/hooks/useLoginForm";
import TextFieldComponent from "@shared/components/TextField.component";
import { AuthErrorMessage } from "@features/auth/components/AuthErrorMessage.component";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import "@features/auth/styles/AuthShared.css";
import "@features/auth/styles/Login.css";
import miloLogo from "/milo-logo.png";
import MainButtonComponent from "@shared/components/MainButton.component";

const Login: React.FC = () => {
	const {
		formData,
		errors,
		isLoading,
		generalError,
		handleInputChange,
		handleSubmit,
		handleForgotPassword,
		handleSignUp,
	} = useLoginForm();

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !isLoading) {
			handleSubmit();
		}
	};

	return (
		<div className="auth-page-root">
			<AuthHeader rightLinkTo="/register" rightLinkLabel="Pas de compte ?" />

			<main className="auth-main login-main">
				<div className="auth-card login-card">
					<div className="login-intro">
						<img src={miloLogo} alt="Milo" className="login-logo" />
						<h2 className="form-title">Re-bonjour !</h2>
						<p className="form-subtitle">
							Connecte-toi pour retrouver ton espace Milo
						</p>
					</div>

					<div className="form">
						<AuthErrorMessage message={generalError} />

						<TextFieldComponent
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Ton adresse email"
							icon={<Mail className="w-5 h-5 text-gray-500" />}
							error={errors.email}
							disabled={isLoading}
						/>
						<TextFieldComponent
							type="password"
							value={formData.password}
							onChange={(e) => handleInputChange("password", e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Ton mot de passe"
							icon={<Lock className="w-5 h-5 text-gray-500" />}
							error={errors.password}
							disabled={isLoading}
						/>

						<div className="forgot-password">
							<button
								type="button"
								className="forgot-password-link"
								onClick={handleForgotPassword}
								disabled={isLoading}
							>
								Mot de passe oublié ?
							</button>
						</div>

						<MainButtonComponent
							title={isLoading ? "Connexion en cours..." : "Se connecter"}
							onPress={handleSubmit}
							loading={isLoading}
						/>

						<div className="signup-section">
							<p className="signup-text">
								Pas encore de compte ?{" "}
								<button
									type="button"
									className="signup-link"
									onClick={handleSignUp}
									disabled={isLoading}
								>
									Inscris-toi
								</button>
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default Login;
