import React from "react";
import { Briefcase, GraduationCap, Laptop, Mail, User } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { CLASSES, DEVICES, ROLES } from "@features/feedback/data/betaJourney.data";
import type { BetaProfile } from "@features/feedback/types";
import type { ProfileErrors } from "@features/feedback/utils/validateProfile";

interface ProfileStepProps {
	profile: BetaProfile;
	errors: ProfileErrors;
	onChange: (patch: Partial<BetaProfile>) => void;
	onBlur: (field: keyof BetaProfile) => void;
}

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
	message ? (
		<span className="fb-error" id={id}>
			{message}
		</span>
	) : null;

interface ChipsProps {
	legend: React.ReactNode;
	name: string;
	options: readonly string[];
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

const Chips: React.FC<ChipsProps> = ({ legend, name, options, value, onChange, error }) => (
	<fieldset className="lp-field" aria-describedby={error ? `${name}-error` : undefined}>
		<legend className="lp-field__label">{legend}</legend>
		<div className="fb-chips">
			{options.map((option) => (
				<label key={option} className={`fb-chip${value === option ? " is-active" : ""}`}>
					<input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
					{option}
				</label>
			))}
		</div>
		<FieldError id={`${name}-error`} message={error} />
	</fieldset>
);

const ProfileStep: React.FC<ProfileStepProps> = ({ profile, errors, onChange, onBlur }) => {
	const input = (field: "firstName" | "lastName" | "email" | "profession") => ({
		value: profile[field],
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [field]: e.target.value }),
		onBlur: () => onBlur(field),
		"aria-invalid": Boolean(errors[field]),
		"aria-describedby": errors[field] ? `${field}-error` : undefined,
	});

	return (
		<div className="fb-step">
			<header className="fb-step__head">
				<Emoji3D name="student" className="fb-step__icon" />
				<div>
					<p className="fb-step__eyebrow">Avant de commencer</p>
					<h2 className="lp-display fb-step__title">Qui es-tu&nbsp;?</h2>
					<p className="fb-step__goal">Ça nous aide à comprendre tes réponses. Rien n'est affiché publiquement.</p>
				</div>
			</header>

			<fieldset className="lp-field" aria-describedby={errors.role ? "role-error" : undefined}>
				<legend className="lp-field__label">Tu es…</legend>
				<div className="fb-roles">
					{ROLES.map((role) => (
						<label key={role.value} className={`lp-subject${profile.role === role.value ? " is-active" : ""}`}>
							<input
								type="radio"
								name="role"
								value={role.value}
								checked={profile.role === role.value}
								onChange={() => onChange({ role: role.value })}
							/>
							<Emoji3D name={role.icon} className="lp-subject__icon" />
							<span>
								<strong className="fb-role__label">{role.label}</strong>
								<span className="fb-role__hint">{role.hint}</span>
							</span>
						</label>
					))}
				</div>
				<FieldError id="role-error" message={errors.role} />
			</fieldset>

			<div className="lp-contact-form__row">
				<label className="lp-field">
					<span className="lp-field__label">
						<User size={16} aria-hidden="true" /> Prénom
					</span>
					<input type="text" autoComplete="given-name" {...input("firstName")} />
					<FieldError id="firstName-error" message={errors.firstName} />
				</label>
				<label className="lp-field">
					<span className="lp-field__label">
						<User size={16} aria-hidden="true" /> Nom
					</span>
					<input type="text" autoComplete="family-name" {...input("lastName")} />
					<FieldError id="lastName-error" message={errors.lastName} />
				</label>
			</div>

			{profile.role === "eleve" && (
				<Chips
					legend={
						<>
							<GraduationCap size={16} aria-hidden="true" /> Ta classe
						</>
					}
					name="classe"
					options={CLASSES}
					value={profile.classe}
					onChange={(classe) => onChange({ classe })}
					error={errors.classe}
				/>
			)}

			{profile.role === "parent" && (
				<>
					<label className="lp-field">
						<span className="lp-field__label">
							<Briefcase size={16} aria-hidden="true" /> Ta profession
						</span>
						<input type="text" autoComplete="organization-title" {...input("profession")} />
						<FieldError id="profession-error" message={errors.profession} />
					</label>
					<Chips
						legend={
							<>
								<GraduationCap size={16} aria-hidden="true" /> Classe de ton enfant <span className="fb-optional">facultatif</span>
							</>
						}
						name="childClasse"
						options={CLASSES}
						value={profile.childClasse}
						onChange={(childClasse) => onChange({ childClasse })}
					/>
				</>
			)}

			<Chips
				legend={
					<>
						<Laptop size={16} aria-hidden="true" /> Tu testes surtout sur <span className="fb-optional">facultatif</span>
					</>
				}
				name="device"
				options={DEVICES}
				value={profile.device}
				onChange={(device) => onChange({ device })}
			/>

			<label className="lp-field">
				<span className="lp-field__label">
					<Mail size={16} aria-hidden="true" /> Email <span className="fb-optional">facultatif, pour qu'on puisse te répondre</span>
				</span>
				<input type="email" autoComplete="email" placeholder="prenom@gmail.com" {...input("email")} />
				<FieldError id="email-error" message={errors.email} />
			</label>
		</div>
	);
};

export default ProfileStep;
