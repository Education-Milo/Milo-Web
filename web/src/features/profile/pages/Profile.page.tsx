import React from "react";
import {
	AlertCircle,
	AtSign,
	BookOpen,
	Check,
	Flame,
	GraduationCap,
	Heart,
	Lock,
	Mail,
	Plus,
	RotateCcw,
	Sparkles,
	Trophy,
	UserRound,
	X,
	Zap,
} from "lucide-react";
import "@features/profile/styles/ProfilePage.css";
import { useProfilePage } from "@features/profile/hooks/useProfilePage";
import ScreenLayout from "@shared/components/ScreenLayout.component";

const CLASSES = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

const ProfilePage: React.FC = () => {
	const {
		profile,
		tempProfile,
		passwordData,
		passwordChecks,
		interests,
		suggestions,
		newInterest,
		setNewInterest,
		handleInputChange,
		handlePasswordChange,
		handleSave,
		handleReset,
		handleAdd,
		handleDelete,
		isDirty,
		saveState,
		formError,
	} = useProfilePage();

	const initials =
		`${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
		"?";

	const classeLabel =
		CLASSES.find((c) => c.value === profile.classe)?.label ?? "Non renseignée";

	const isSaving = saveState === "saving";
	const showSaveBar = isDirty || isSaving || saveState === "saved";

	return (
		<ScreenLayout>
			<div className="pf-page">
				{/* --- FOND ANIMÉ --- */}
				<div className="pf-bg" aria-hidden="true">
					<span className="pf-blob pf-blob-1" />
					<span className="pf-blob pf-blob-2" />
					<span className="pf-blob pf-blob-3" />
				</div>

				{/* --- HERO --- */}
				<section className="pf-hero">
					<div className="pf-hero-halo" aria-hidden="true" />
					<div className="pf-hero-shine" aria-hidden="true" />

					<div className="pf-avatar-wrap">
						<span className="pf-avatar-ring" aria-hidden="true" />
						<div className="pf-avatar">
							<span className="pf-avatar-initials">{initials}</span>
						</div>
						<span className="pf-avatar-badge">
							<Zap size={12} />1
						</span>
					</div>

					<div className="pf-hero-content">
						<div className="pf-hero-chip">
							<Sparkles size={13} />
							<span>Mon profil</span>
						</div>
						<h1 className="pf-hero-title">
							{profile.first_name} {profile.last_name}
						</h1>
						<div className="pf-hero-meta">
							<span className="pf-hero-tag">
								<AtSign size={14} />
								{profile.username}
							</span>
							<span className="pf-hero-tag">
								<GraduationCap size={14} />
								{classeLabel}
							</span>
						</div>

						<div className="pf-xp">
							<div className="pf-xp-head">
								<span className="pf-xp-level">Niveau 1</span>
								<span className="pf-xp-count">0 / 500 XP</span>
							</div>
							<div className="pf-xp-track">
								<div className="pf-xp-fill" style={{ width: "4%" }} />
							</div>
						</div>
					</div>
				</section>

				{/* --- GRILLE PRINCIPALE --- */}
				<div className="pf-grid">
					<div className="pf-main-col">
						{/* IDENTITÉ */}
						<section className="pf-card pf-theme-amber pf-identity">
							<span className="pf-card-glow" aria-hidden="true" />
							<header className="pf-card-header">
								<div className="pf-card-title-wrap">
									<UserRound size={20} className="pf-card-icon" />
									<h2 className="pf-card-title">Informations personnelles</h2>
								</div>
							</header>

							<div className="pf-fields">
								<div className="pf-field">
									<label className="pf-label" htmlFor="pf-first-name">
										Prénom
									</label>
									<input
										id="pf-first-name"
										type="text"
										className="pf-input"
										value={tempProfile.first_name}
										onChange={(e) =>
											handleInputChange("first_name", e.target.value)
										}
									/>
								</div>
								<div className="pf-field">
									<label className="pf-label" htmlFor="pf-last-name">
										Nom
									</label>
									<input
										id="pf-last-name"
										type="text"
										className="pf-input"
										value={tempProfile.last_name}
										onChange={(e) =>
											handleInputChange("last_name", e.target.value)
										}
									/>
								</div>
								<div className="pf-field">
									<label className="pf-label" htmlFor="pf-classe">
										Classe
									</label>
									<select
										id="pf-classe"
										className="pf-input pf-select"
										value={tempProfile.classe ?? ""}
										onChange={(e) => handleInputChange("classe", e.target.value)}
									>
										<option value="" disabled>
											Sélectionne ta classe
										</option>
										{CLASSES.map((c) => (
											<option key={c.value} value={c.value}>
												{c.label}
											</option>
										))}
									</select>
								</div>
								<div className="pf-field">
									<label className="pf-label" htmlFor="pf-email">
										Email
										<span className="pf-label-lock">
											<Lock size={11} /> non modifiable
										</span>
									</label>
									<div className="pf-input pf-input-readonly" id="pf-email">
										<Mail size={15} />
										<span>{profile.email}</span>
									</div>
								</div>
							</div>
						</section>

						{/* SÉCURITÉ */}
						<section className="pf-card pf-theme-violet pf-security">
							<span className="pf-card-glow" aria-hidden="true" />
							<header className="pf-card-header">
								<div className="pf-card-title-wrap">
									<Lock size={20} className="pf-card-icon" />
									<h2 className="pf-card-title">Mot de passe</h2>
								</div>
								<span className="pf-card-sub">
									Laisse vide pour le conserver
								</span>
							</header>

							<div className="pf-fields">
								<div className="pf-field">
									<label className="pf-label" htmlFor="pf-new-password">
										Nouveau mot de passe
									</label>
									<input
										id="pf-new-password"
										type="password"
										className="pf-input"
										autoComplete="new-password"
										placeholder="8 caractères minimum"
										value={passwordData.new_password}
										onChange={(e) =>
											handlePasswordChange("new_password", e.target.value)
										}
									/>
								</div>
								<div className="pf-field">
									<label className="pf-label" htmlFor="pf-confirm-password">
										Confirmation
									</label>
									<input
										id="pf-confirm-password"
										type="password"
										className="pf-input"
										autoComplete="new-password"
										placeholder="Retape ton mot de passe"
										value={passwordData.confirm_password}
										onChange={(e) =>
											handlePasswordChange("confirm_password", e.target.value)
										}
									/>
								</div>
							</div>

							{passwordChecks.active && (
								<ul className="pf-rules">
									<li className={passwordChecks.length ? "is-ok" : ""}>
										{passwordChecks.length ? (
											<Check size={14} />
										) : (
											<AlertCircle size={14} />
										)}
										Au moins 8 caractères
									</li>
									<li className={passwordChecks.match ? "is-ok" : ""}>
										{passwordChecks.match ? (
											<Check size={14} />
										) : (
											<AlertCircle size={14} />
										)}
										Les deux champs sont identiques
									</li>
								</ul>
							)}
						</section>
					</div>

					<div className="pf-side-col">
						{/* CENTRES D'INTÉRÊT */}
						<section className="pf-card pf-theme-rose pf-interests">
							<span className="pf-card-glow" aria-hidden="true" />
							<header className="pf-card-header">
								<div className="pf-card-title-wrap">
									<Heart size={20} className="pf-card-icon" />
									<h2 className="pf-card-title">Centres d'intérêt</h2>
								</div>
								<span className="pf-count">{interests.length}</span>
							</header>

							<div className="pf-tags">
								{interests.length > 0 ? (
									interests.map((interest) => (
										<span key={interest.id} className="pf-tag">
											{interest.name}
											<button
												type="button"
												className="pf-tag-remove"
												onClick={() => handleDelete(interest.id)}
												title={`Retirer ${interest.name}`}
												aria-label={`Retirer ${interest.name}`}
											>
												<X size={12} />
											</button>
										</span>
									))
								) : (
									<p className="pf-empty">
										Aucun intérêt pour le moment. Ajoute-en pour des exercices
										plus personnalisés.
									</p>
								)}
							</div>

							<div className="pf-add-row">
								<input
									type="text"
									className="pf-input pf-add-input"
									placeholder="Ajouter un centre d'intérêt..."
									value={newInterest}
									onChange={(e) => setNewInterest(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAdd()}
								/>
								<button
									type="button"
									className="pf-btn pf-btn-icon"
									onClick={() => handleAdd()}
									disabled={!newInterest.trim()}
									aria-label="Ajouter"
								>
									<Plus size={20} />
								</button>
							</div>

							{suggestions.length > 0 && (
								<div className="pf-suggestions">
									<p className="pf-suggestions-label">Suggestions</p>
									<div className="pf-suggestions-flex">
										{suggestions.map((name) => (
											<button
												key={name}
												type="button"
												className="pf-chip"
												onClick={() => handleAdd(name)}
											>
												<Plus size={13} />
												{name}
											</button>
										))}
									</div>
								</div>
							)}
						</section>

						{/* STATISTIQUES */}
						<section className="pf-card pf-theme-teal pf-stats">
							<span className="pf-card-glow" aria-hidden="true" />
							<header className="pf-card-header">
								<div className="pf-card-title-wrap">
									<Trophy size={20} className="pf-card-icon" />
									<h2 className="pf-card-title">Statistiques</h2>
								</div>
							</header>

							<div className="pf-stats-grid">
								<div className="pf-stat pf-stat-gold">
									<Trophy size={18} className="pf-stat-icon" />
									<span className="pf-stat-value">0</span>
									<span className="pf-stat-label">Succès</span>
								</div>
								<div className="pf-stat pf-stat-teal"> 
									<BookOpen size={18} className="pf-stat-icon" />
									<span className="pf-stat-value">0</span>
									<span className="pf-stat-label">Cours finis</span>
								</div>
								<div className="pf-stat pf-stat-orange">
									<Zap size={18} className="pf-stat-icon" />
									<span className="pf-stat-value">0</span>
									<span className="pf-stat-label">Points</span>
								</div>
								<div className="pf-stat pf-stat-flame">
									<Flame size={18} className="pf-stat-icon" />
									<span className="pf-stat-value">0</span>
									<span className="pf-stat-label">Jours de série</span>
								</div>
							</div>
						</section>
					</div>
				</div>

				{/* --- BARRE DE SAUVEGARDE FLOTTANTE --- */}
				<div
					className={`pf-savebar ${showSaveBar ? "is-visible" : ""}`}
					aria-live="polite"
				>
					<div
						className={`pf-savebar-inner ${saveState === "saved" ? "is-saved" : ""} ${formError ? "is-error" : ""}`}
					>
						<span className="pf-savebar-msg">
							{formError ? (
								<>
									<AlertCircle size={16} />
									{formError}
								</>
							) : saveState === "saved" ? (
								<>
									<Check size={16} />
									Profil enregistré
								</>
							) : (
								<>
									<AlertCircle size={16} />
									Modifications non enregistrées
								</>
							)}
						</span>
						{saveState !== "saved" && (
							<div className="pf-savebar-actions">
								<button
									type="button"
									className="pf-btn pf-btn-ghost"
									onClick={handleReset}
									disabled={isSaving}
								>
									<RotateCcw size={15} />
									Annuler
								</button>
								<button
									type="button"
									className="pf-btn pf-btn-primary"
									onClick={handleSave}
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<span className="pf-btn-spinner" />
											Enregistrement...
										</>
									) : (
										<>
											<Check size={15} />
											Enregistrer
										</>
									)}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default ProfilePage;