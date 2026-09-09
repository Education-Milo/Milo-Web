import React from "react";
import { User, Mail, Lock } from "lucide-react";
import { useRegisterForm } from "@features/auth/hooks/useRegisterForm";
import TextField from "@shared/components/TextField.component";
import { AuthErrorMessage } from "@features/auth/components/AuthErrorMessage.component";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import { StepProgress } from "@features/auth/components/StepProgress.component";
import "@features/auth/styles/AuthShared.css";
import "@features/auth/styles/Register.css";
import MainButtonComponent from "@shared/components/MainButton.component";
import { ClassSelector } from "@features/auth/components/ClassSelector.component";

const STEPS = [
	{ id: "role", label: "Ton rôle" },
	{ id: "infos", label: "Tes informations" },
];

const Register: React.FC = () => {
	const {
		formData,
		errors,
		isLoading,
		generalError,
		roleDef,
		handleInputChange,
		handleSubmit,
		navigate,
	} = useRegisterForm();

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" && !isLoading) {
			handleSubmit();
		}
	};

	if (!roleDef) return null;

	const RoleIcon = roleDef.icon;

	return (
		<div className="auth-page-root">
			<AuthHeader
				onBack={() => navigate("/register")}
				backLabel="Changer de rôle"
			/>

			<main className="auth-main">
				<StepProgress steps={STEPS} currentStep={1} />

				<div className="auth-card">
					<div className="register-role-pill">
						<RoleIcon size={16} />
						{roleDef.label}
					</div>

					<div className="form-header">
						<h2 className="form-title">Créer ton compte</h2>
						<p className="form-subtitle">Deux minutes, et c'est parti.</p>
					</div>

					<div className="form">
						<AuthErrorMessage message={generalError} />

						<div className="form-row">
							<TextField
								type="text"
								value={formData.last_name}
								onChange={(e) => handleInputChange("last_name", e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Nom"
								icon={<User className="w-5 h-5 text-gray-500" />}
								error={errors.last_name}
								disabled={isLoading}
							/>

							<TextField
								type="text"
								value={formData.first_name}
								onChange={(e) =>
									handleInputChange("first_name", e.target.value)
								}
								onKeyPress={handleKeyPress}
								placeholder="Prénom"
								icon={<User className="w-5 h-5 text-gray-500" />}
								error={errors.first_name}
								disabled={isLoading}
							/>
						</div>

						<TextField
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Adresse email"
							icon={<Mail className="w-5 h-5 text-gray-500" />}
							error={errors.email}
							disabled={isLoading}
						/>

						<div className="form-row">
							<TextField
								type="password"
								value={formData.password}
								onChange={(e) => handleInputChange("password", e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Mot de passe"
								icon={<Lock className="w-5 h-5 text-gray-500" />}
								error={errors.password}
								disabled={isLoading}
							/>

							<TextField
								type="password"
								value={formData.confirmPassword}
								onChange={(e) =>
									handleInputChange("confirmPassword", e.target.value)
								}
								onKeyPress={handleKeyPress}
								placeholder="Confirmation"
								icon={<Lock className="w-5 h-5 text-gray-500" />}
								error={errors.confirmPassword}
								disabled={isLoading}
							/>
						</div>

						{formData.role === "Élève" && (
							<ClassSelector
								value={formData.classe}
								onChange={(classe: string) => handleInputChange("classe", classe)}
								error={errors.classe}
								disabled={isLoading}
							/>
						)}

						<p className="legal-text">
							En rejoignant Milo, tu confirmes avoir lu et accepté les{" "}
							<a href="#">conditions générales d'utilisation</a> et la{" "}
							<a href="#">politique de confidentialité</a>.
						</p>

						<MainButtonComponent
							title={isLoading ? "Inscription en cours..." : "S'inscrire"}
							onPress={handleSubmit}
							loading={isLoading}
						/>

						<div className="signup-section">
							<p className="signup-text">
								Déjà un compte ?{" "}
								<button
									type="button"
									className="signup-link"
									onClick={() => navigate("/login")}
									disabled={isLoading}
								>
									Se connecter
								</button>
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default Register;
