import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@shared/store/auth/auth.store";
import type {
	LoginFormData,
	FormErrors,
} from "@shared/types/auth.types";
import { ROUTES } from "@shared/constants/routes";

export const useLoginForm = () => {
	const [formData, setFormData] = useState<LoginFormData>({
		email: "",
		password: "",
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [generalError, setGeneralError] = useState("");
	const navigate = useNavigate();
	const login = useAuthStore((state) => state.login);

	const handleInputChange = (field: keyof LoginFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
		if (generalError) {
			setGeneralError("");
		}
	};

	const validateForm = (): FormErrors => {
		const newErrors: FormErrors = {};
		if (!formData.email.trim()) {
			newErrors.email = "L'email est requis";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "L'email n'est pas valide";
		}
		if (!formData.password) {
			newErrors.password = "Le mot de passe est requis";
		}

		return newErrors;
	};

	const handleSubmit = async () => {
		setGeneralError("");
		const newErrors = validateForm();
		setErrors(newErrors);

		if (Object.keys(newErrors).length === 0) {
			setIsLoading(true);
			try {
				await login(formData.email.trim(), formData.password);
				navigate(ROUTES.HOME, { replace: true });
			} catch (error: any) {
				console.error("❌ Erreur de connexion:", error);
				const errorMessage =
					error?.response?.data?.detail ||
					error?.message ||
					"Une erreur est survenue";
				if (typeof errorMessage === "string") {
					if (
						errorMessage
							.toLowerCase()
							.includes("incorrect username or password")
					) {
						setGeneralError("Email ou mot de passe incorrect");
					} else if (errorMessage.toLowerCase().includes("user not found")) {
						setGeneralError("Aucun compte trouvé avec cet email");
					} else {
						setGeneralError(errorMessage);
					}
				} else {
					setGeneralError("Une erreur est survenue lors de la connexion");
				}
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleForgotPassword = () => {
		navigate(ROUTES.FORGOT_PASSWORD);
	};

	const handleSignUp = () => {
		navigate(ROUTES.REGISTER);
	};

	return {
		formData,
		errors,
		isLoading,
		generalError,
		handleInputChange,
		handleSubmit,
		handleForgotPassword,
		handleSignUp,
		navigate,
	};
};
