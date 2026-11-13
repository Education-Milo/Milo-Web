import React, { useId, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { AlertTriangle, Loader, X } from "lucide-react";
import { useDialogFocus } from "@shared/hooks/useDialogFocus";
import { useCreateProfile } from "@features/account/store/account.queries";
import { PIN_LENGTH } from "@features/account/store/account.model";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import type { ProfileSummary } from "@shared/store/auth/auth.model";
import type { ClassType } from "@shared/store/user/user.model";

const CLASSES: { value: ClassType; label: string }[] = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

/** "Léa", "Martin" → "lea.martin4821" (même forme qu'à l'inscription) */
const suggestUsername = (firstName: string, lastName: string) => {
	const slug = (value: string) =>
		value
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "");
	const base = [slug(firstName), slug(lastName)].filter(Boolean).join(".");
	return base ? `${base}${Math.floor(1000 + Math.random() * 9000)}` : "";
};

type Field = "first_name" | "last_name" | "username" | "classe" | "pin" | "password";
type FieldErrors = Partial<Record<Field, string>>;

/** Champs accompagnés d'une indication sous la saisie */
const HINTED: Field[] = ["username", "classe", "pin", "password"];

interface AddChildDialogProps {
	onClose: () => void;
	onCreated: (profile: ProfileSummary) => void;
}

/**
 * Création d'un profil élève dans le compte famille (POST /profiles, rôle
 * Enfant). Le back exige le mot de passe du compte et une classe, et refuse
 * un pseudo déjà pris sur la plateforme.
 */
const AddChildDialog: React.FC<AddChildDialogProps> = ({ onClose, onCreated }) => {
	const createProfile = useCreateProfile();
	const dialogRef = useRef<HTMLDivElement>(null);
	const firstFieldRef = useRef<HTMLInputElement>(null);
	const uid = useId();
	const isPending = createProfile.isPending;
	useDialogFocus({
		open: true,
		containerRef: dialogRef,
		initialFocusRef: firstFieldRef,
		onEscape: isPending ? undefined : onClose,
	});

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [username, setUsername] = useState("");
	const [usernameEdited, setUsernameEdited] = useState(false);
	const [classe, setClasse] = useState<ClassType | "">("");
	const [pin, setPin] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [formError, setFormError] = useState<string | null>(null);

	const fieldId = (field: Field) => `${uid}-${field}`;
	const hintId = (field: Field) => `${uid}-${field}-hint`;
	const errorId = (field: Field) => `${uid}-${field}-error`;

	// Le pseudo suit le prénom et le nom tant que le parent ne l'a pas modifié
	const updateName = (first: string, last: string) => {
		if (usernameEdited) return;
		const suggested = suggestUsername(first, last);
		setUsername(suggested);
		if (suggested) setErrors((prev) => ({ ...prev, username: undefined }));
	};

	const clearError = (field: Field) => {
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
		if (formError) setFormError(null);
	};

	const validate = (): FieldErrors => {
		const next: FieldErrors = {};
		if (!firstName.trim()) next.first_name = "Indiquez le prénom de votre enfant.";
		if (!lastName.trim()) next.last_name = "Indiquez son nom.";
		if (!username.trim()) next.username = "Choisissez un pseudo.";
		else if (/\s/.test(username.trim())) next.username = "Le pseudo ne doit pas contenir d'espace.";
		if (!classe) next.classe = "Choisissez sa classe.";
		if (pin && !PIN_PATTERN.test(pin)) next.pin = `Le code PIN doit contenir ${PIN_LENGTH} chiffres.`;
		if (!password) next.password = "Saisissez le mot de passe de votre compte.";
		return next;
	};

	/** Erreurs du back rattachées au bon champ quand c'est possible */
	const applyServerError = (err: unknown) => {
		const status = isAxiosError(err) ? err.response?.status : undefined;
		const message = getSecurityErrorMessage(err);
		setPassword("");
		if (status === 403 && /mot de passe/i.test(message)) {
			setErrors({ password: "Mot de passe incorrect." });
			document.getElementById(fieldId("password"))?.focus();
		} else if (status === 400 && /utilisateur|pseudo/i.test(message)) {
			setErrors({ username: "Ce pseudo est déjà pris : choisissez-en un autre." });
			document.getElementById(fieldId("username"))?.focus();
		} else if (status === 409) {
			setFormError("Votre compte a atteint le nombre maximum de profils.");
		} else if (status === 403) {
			setFormError("La création de profil n'est pas disponible pour ce compte.");
		} else {
			setFormError(message);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isPending) return;
		const invalid = validate();
		setErrors(invalid);
		setFormError(null);
		const firstInvalid = (Object.keys(invalid) as Field[])[0];
		if (firstInvalid) {
			document.getElementById(fieldId(firstInvalid))?.focus();
			return;
		}
		createProfile.mutate(
			{
				current_password: password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				username: username.trim(),
				role: "Enfant",
				class_: classe as ClassType,
				...(pin ? { pin } : {}),
			},
			{ onSuccess: onCreated, onError: applyServerError },
		);
	};

	const fieldProps = (field: Field) => {
		const describedBy = [errors[field] ? errorId(field) : null, HINTED.includes(field) ? hintId(field) : null]
			.filter(Boolean)
			.join(" ");
		return {
			id: fieldId(field),
			"aria-invalid": errors[field] ? true : undefined,
			"aria-describedby": describedBy || undefined,
			disabled: isPending,
		};
	};

	const fieldError = (field: Field) =>
		errors[field] ? (
			<p id={errorId(field)} className="pa-field-error">
				{errors[field]}
			</p>
		) : null;

	return (
		<div className="pa-dialog-backdrop" onClick={isPending ? undefined : onClose}>
			<div
				ref={dialogRef}
				className="pa-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby={`${uid}-title`}
				aria-describedby={`${uid}-desc`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="pa-dialog-head">
					<div>
						<p className="pa-eyebrow">Compte famille</p>
						<h2 id={`${uid}-title`} className="pa-dialog-title">
							Ajouter un profil enfant
						</h2>
						<p id={`${uid}-desc`} className="pa-text pa-dialog-desc">
							Votre enfant retrouvera ce profil sur l'écran « Qui est-ce ? » en se connectant avec les
							identifiants de votre compte.
						</p>
					</div>
					<button type="button" className="pa-icon-btn" onClick={onClose} disabled={isPending} aria-label="Fermer">
						<X size={20} aria-hidden="true" />
					</button>
				</div>

				<form className="pa-form pa-form--dialog" onSubmit={handleSubmit} noValidate>
					<div className="pa-form-row">
						<div className="pa-field">
							<label htmlFor={fieldId("first_name")} className="pa-label">
								Prénom
							</label>
							<input
								ref={firstFieldRef}
								className="pa-input pa-input--text"
								type="text"
								autoComplete="off"
								value={firstName}
								onChange={(e) => {
									setFirstName(e.target.value);
									updateName(e.target.value, lastName);
									clearError("first_name");
								}}
								{...fieldProps("first_name")}
							/>
							{fieldError("first_name")}
						</div>
						<div className="pa-field">
							<label htmlFor={fieldId("last_name")} className="pa-label">
								Nom
							</label>
							<input
								className="pa-input pa-input--text"
								type="text"
								autoComplete="off"
								value={lastName}
								onChange={(e) => {
									setLastName(e.target.value);
									updateName(firstName, e.target.value);
									clearError("last_name");
								}}
								{...fieldProps("last_name")}
							/>
							{fieldError("last_name")}
						</div>
					</div>

					<div className="pa-field">
						<label htmlFor={fieldId("username")} className="pa-label">
							Pseudo
						</label>
						<input
							className="pa-input pa-input--text"
							type="text"
							autoComplete="off"
							autoCapitalize="off"
							spellCheck={false}
							maxLength={40}
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
								setUsernameEdited(true);
								clearError("username");
							}}
							{...fieldProps("username")}
						/>
						<p id={hintId("username")} className="pa-field-hint">
							Visible par les autres élèves (amis, duels). Il doit être unique sur Milo.
						</p>
						{fieldError("username")}
					</div>

					<div className="pa-field">
						<label htmlFor={fieldId("classe")} className="pa-label">
							Classe
						</label>
						<select
							className="pa-input pa-input--text pa-select"
							value={classe}
							onChange={(e) => {
								setClasse(e.target.value as ClassType);
								clearError("classe");
							}}
							{...fieldProps("classe")}
						>
							<option value="" disabled>
								Choisir une classe
							</option>
							{CLASSES.map((c) => (
								<option key={c.value} value={c.value}>
									{c.label}
								</option>
							))}
						</select>
						<p id={hintId("classe")} className="pa-field-hint">
							Milo propose les cours du programme de cette classe.
						</p>
						{fieldError("classe")}
					</div>

					<div className="pa-field">
						<label htmlFor={fieldId("pin")} className="pa-label">
							Code PIN <span className="pa-optional">(facultatif)</span>
						</label>
						<input
							className="pa-input pa-input--text pa-input--pin"
							type="password"
							inputMode="numeric"
							autoComplete="off"
							maxLength={PIN_LENGTH}
							value={pin}
							onChange={(e) => {
								setPin(e.target.value.replace(/\D/g, ""));
								clearError("pin");
							}}
							{...fieldProps("pin")}
						/>
						<p id={hintId("pin")} className="pa-field-hint">
							{PIN_LENGTH} chiffres, demandés à l'ouverture du profil. Vous pourrez le changer plus tard.
						</p>
						{fieldError("pin")}
					</div>

					<div className="pa-field">
						<label htmlFor={fieldId("password")} className="pa-label">
							Mot de passe de votre compte
						</label>
						<input
							className="pa-input pa-input--text"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								clearError("password");
							}}
							{...fieldProps("password")}
						/>
						<p id={hintId("password")} className="pa-field-hint">
							Par sécurité, chaque ajout de profil est confirmé par ce mot de passe.
						</p>
						{fieldError("password")}
					</div>

					{formError && (
						<p className="pa-form-error" role="alert">
							<AlertTriangle size={18} aria-hidden="true" />
							<span>{formError}</span>
						</p>
					)}

					<div className="pa-dialog-actions">
						<button type="button" className="pa-btn pa-btn--ghost" onClick={onClose} disabled={isPending}>
							Annuler
						</button>
						<button type="submit" className="pa-btn pa-btn--primary" disabled={isPending}>
							{isPending && <Loader size={18} className="pa-spin" aria-hidden="true" />}
							{isPending ? "Création…" : "Créer le profil"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddChildDialog;
