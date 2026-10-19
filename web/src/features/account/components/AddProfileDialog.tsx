import React, { useState } from "react";
import { AlertTriangle, GraduationCap, Loader, UserPlus, Users } from "lucide-react";
import SecurityDialog from "@features/security/components/SecurityDialog";
import { ClassSelector } from "@features/auth/components/ClassSelector.component";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useCreateProfile } from "@features/account/store/account.queries";
import { PIN_LENGTH, type CreateProfilePayload } from "@features/account/store/account.model";
import type { ClassType } from "@shared/store/user/user.model";
import { showToast } from "@shared/store/toast/toast.store";
import "@features/security/styles/Security.css";
import "@features/account/styles/Account.css";

interface AddProfileDialogProps {
	onClose: () => void;
}

type Role = CreateProfilePayload["role"];

const ROLES: { value: Role; label: string; hint: string; icon: React.ReactNode }[] = [
	{ value: "Enfant", label: "Élève", hint: "Cours, missions, duels", icon: <GraduationCap size={20} /> },
	{ value: "Parent", label: "Parent", hint: "Suivi des enfants", icon: <Users size={20} /> },
];

const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

/**
 * Nouveau profil Élève ou Parent dans le compte. Le mot de passe du compte
 * est exigé : la route accepte le jeton de n'importe quel profil, un enfant
 * ne doit pas pouvoir s'ajouter un profil Parent.
 */
const AddProfileDialog: React.FC<AddProfileDialogProps> = ({ onClose }) => {
	const createProfile = useCreateProfile();
	const [role, setRole] = useState<Role>("Enfant");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [username, setUsername] = useState("");
	const [classe, setClasse] = useState<ClassType | "">("");
	const [pin, setPin] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const validate = (): string | null => {
		if (!firstName.trim() || !lastName.trim()) return "Le prénom et le nom sont requis.";
		if (!username.trim()) return "Choisis un pseudo.";
		if (role === "Enfant" && !classe) return "Choisis la classe de l'élève.";
		if (pin && !PIN_PATTERN.test(pin)) return `Le code PIN doit contenir ${PIN_LENGTH} chiffres.`;
		if (!password) return "Le mot de passe du compte est requis.";
		return null;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (createProfile.isPending) return;
		const invalid = validate();
		if (invalid) {
			setError(invalid);
			return;
		}
		setError(null);
		createProfile.mutate(
			{
				current_password: password,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				username: username.trim(),
				role,
				// Une classe pour un parent est refusée (422)
				...(role === "Enfant" && classe ? { class_: classe } : {}),
				...(pin ? { pin } : {}),
			},
			{
				onSuccess: (profile) => {
					showToast(`Profil de ${profile.first_name} créé.`, "success");
					onClose();
				},
				onError: (err) => {
					setError(getSecurityErrorMessage(err));
					setPassword("");
				},
			},
		);
	};

	return (
		<SecurityDialog
			title="Ajouter un profil"
			subtitle="Chaque membre de la famille a sa progression, ses amis et son Milo"
			icon={<UserPlus size={20} />}
			onClose={onClose}
			dismissible={!createProfile.isPending}
		>
			<form className="sec-form" onSubmit={handleSubmit}>
				<div className="acc-roles" role="radiogroup" aria-label="Type de profil">
					{ROLES.map((r) => (
						<button
							key={r.value}
							type="button"
							role="radio"
							aria-checked={role === r.value}
							className={`acc-role ${role === r.value ? "is-active" : ""}`}
							onClick={() => setRole(r.value)}
						>
							{r.icon}
							<strong>{r.label}</strong>
							<small>{r.hint}</small>
						</button>
					))}
				</div>

				<div className="acc-row">
					<label className="sec-field">
						<span>Prénom</span>
						<input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" autoFocus />
					</label>
					<label className="sec-field">
						<span>Nom</span>
						<input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="off" />
					</label>
				</div>

				<label className="sec-field">
					<span>Pseudo</span>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="off"
						autoCapitalize="off"
						spellCheck={false}
						placeholder="Visible par les autres élèves"
					/>
				</label>

				{role === "Enfant" && <ClassSelector value={classe} onChange={(v) => setClasse(v as ClassType)} />}

				<label className="sec-field">
					<span>Code PIN (facultatif)</span>
					<input
						type="password"
						inputMode="numeric"
						autoComplete="off"
						maxLength={PIN_LENGTH}
						value={pin}
						onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
						placeholder={`${PIN_LENGTH} chiffres pour verrouiller ce profil`}
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
					<button type="button" className="sec-btn sec-btn--ghost" onClick={onClose} disabled={createProfile.isPending}>
						Annuler
					</button>
					<button type="submit" className="sec-btn sec-btn--primary" disabled={createProfile.isPending}>
						{createProfile.isPending && <Loader size={16} className="sec-spin" />} Créer le profil
					</button>
				</div>
			</form>
		</SecurityDialog>
	);
};

export default AddProfileDialog;
