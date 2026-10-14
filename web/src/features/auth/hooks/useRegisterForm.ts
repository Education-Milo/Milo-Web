import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@shared/store/auth/auth.store";
import type {
	RegisterFormData,
	FormErrors,
} from "@shared/types/auth.types";
import type { ClassType } from "@shared/store/user/user.model";
import { ROUTES } from "@shared/constants/routes";
import { getRoleBySlug } from "@features/auth/constants/roles.constants";

const CLASS_VALUES: readonly ClassType[] = ["6eme", "5eme", "4eme", "3eme"];
const isClassType = (value: string): value is ClassType =>
	(CLASS_VALUES as readonly string[]).includes(value);

/** Politique du back : 8 caractères minimum, 72 octets UTF-8 maximum (bcrypt). */
const PASSWORD_MIN_CHARS = 8;
const PASSWORD_MAX_BYTES = 72;
const utf8Length = (value: string) => new TextEncoder().encode(value).length;

/** Noms de champs du back (loc des erreurs 422) → champs du formulaire. */
const API_FIELD_TO_FORM: Record<string, string> = {
	class_: "classe",
};

interface ValidationIssue {
	loc?: (string | number)[];
	msg?: string;
}

export const useRegisterForm = () => {
	const { role: roleSlug } = useParams<{ role: string }>();
	const navigate = useNavigate();
	const roleDef = getRoleBySlug(roleSlug);

	const [formData, setFormData] = useState<RegisterFormData>({
		last_name: "",
		first_name: "",
		email: "",
		password: "",
		confirmPassword: "",
		classe: "",
	});
	const isStudent = roleDef?.slug === "eleve";

	useEffect(() => {
		if (!roleDef || !roleDef.active) {
			navigate(ROUTES.REGISTER, { replace: true });
			return;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roleDef?.slug]);

	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [generalError, setGeneralError] = useState("");
	const registerStudent = useAuthStore((state) => state.registerStudent);
	const registerParent = useAuthStore((state) => state.registerParent);

	const handleInputChange = (field: keyof RegisterFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
		if (generalError) {
			setGeneralError("");
		}
	};

	const create_username = (first_name: string, last_name: string) => {
		const baseUsername = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;
		const randomSuffix = Math.floor(1000 + Math.random() * 9000);
		return `${baseUsername}${randomSuffix}`;
	};

	const validateForm = (): FormErrors => {
		const newErrors: FormErrors = {};

		if (!formData.last_name.trim()) {
			newErrors.last_name = "Le nom est requis";
		}

		if (!formData.first_name.trim()) {
			newErrors.first_name = "Le prénom est requis";
		}

		if (!formData.email.trim()) {
			newErrors.email = "L'email est requis";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "L'email n'est pas valide";
		}

		if (!formData.password) {
			newErrors.password = "Le mot de passe est requis";
		} else if (formData.password.length < PASSWORD_MIN_CHARS) {
			newErrors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN_CHARS} caractères`;
		} else if (utf8Length(formData.password) > PASSWORD_MAX_BYTES) {
			// Octets et non caractères : accents et emojis comptent double ou plus
			newErrors.password = "Le mot de passe est trop long";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "La confirmation du mot de passe est requise";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
		}

		if (isStudent && !isClassType(formData.classe)) {
			newErrors.classe = "Sélectionne ta classe";
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
				const common = {
					first_name: formData.first_name.trim(),
					last_name: formData.last_name.trim(),
					username: create_username(formData.first_name, formData.last_name),
					email: formData.email.trim(),
					password: formData.password,
				};
				if (isStudent) {
					await registerStudent({
						...common,
						class_: formData.classe as ClassType,
					});
					navigate(ROUTES.HOME, { replace: true });
				} else {
					await registerParent(common);
					navigate(ROUTES.PARENT.DASHBOARD, { replace: true });
				}
			} catch (error: any) {
				console.error("❌ Erreur d'inscription:", error);
				const status = error?.response?.status;
				const detail = error?.response?.data?.detail;

				if (status === 422 && Array.isArray(detail)) {
					// detail est une liste d'erreurs de validation, pas une chaîne
					const validationErrors: FormErrors = {};
					const unmapped: string[] = [];
					detail.forEach((issue: ValidationIssue) => {
						const apiField = String(issue?.loc?.[issue.loc.length - 1] ?? "");
						const field = API_FIELD_TO_FORM[apiField] ?? apiField;
						const msg = issue?.msg ?? "Valeur invalide";
						const isShownField =
							field in formData &&
							field !== "confirmPassword" &&
							(field !== "classe" || isStudent);
						if (isShownField) {
							validationErrors[field] = msg;
						} else {
							unmapped.push(msg);
						}
					});
					setErrors(validationErrors);
					setGeneralError(
						unmapped.length > 0
							? unmapped.join(" · ")
							: "Le serveur a refusé certaines données. Vérifiez vos informations.",
					);
				} else if (typeof detail === "string" && detail) {
					// 400 : email ou nom d'utilisateur déjà pris, message affichable tel quel
					setGeneralError(detail);
				} else {
					setGeneralError("Une erreur est survenue lors de l'inscription");
				}
			} finally {
				setIsLoading(false);
			}
		}
	};

	return {
		formData,
		errors,
		isLoading,
		generalError,
		roleDef,
		handleInputChange,
		handleSubmit,
		navigate,
	};
};
