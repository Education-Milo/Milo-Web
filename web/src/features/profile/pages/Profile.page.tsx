import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, AtSign, Check, Lock, LogOut, Plus, RotateCcw, X } from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { ROUTES } from "@shared/constants/routes";
import "@features/profile/styles/ProfilePage.css";
import { useProfilePage } from "@features/profile/hooks/useProfilePage";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import ProfileHero from "@features/profile/components/ProfileHero.component";
import ProfileStats from "@features/profile/components/ProfileStats.component";
import ProfileCard from "@features/profile/components/ProfileCard.component";
import ProfileTabs from "@features/profile/components/ProfileTabs.component";
import type { ProfileTab } from "@features/profile/components/ProfileTabs.component";
import TwoFactorPanel from "@features/security/components/TwoFactorPanel";
import TrustedDevicesPanel from "@features/security/components/TrustedDevicesPanel";
import SessionsPanel from "@features/security/components/SessionsPanel";
import AccountLoginPanel from "@features/account/components/AccountLoginPanel";
import AccountProfilesPanel from "@features/account/components/AccountProfilesPanel";
import DeleteAccountPanel from "@features/account/components/DeleteAccountPanel";
import { AI_LIMITS } from "@shared/lib/aiRequests";
import { useStats } from "@features/stats/store/stats.queries";
import type { StatsPeriodDays } from "@features/stats/store/stats.model";

const CLASSES = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

type TabId = "progression" | "matieres" | "compte" | "securite";

const TAB_IDS: TabId[] = ["progression", "matieres", "compte", "securite"];

/// Profil de l'élève : identité et niveau (hero), puis des sous-menus pour
/// les statistiques (ex-page /stats) et les réglages du compte. L'onglet est
/// dans l'URL (?onglet=…) : il survit au rechargement et se partage.
const ProfilePage: React.FC = () => {
	const {
		profile,
		tempProfile,
		user,
		interests,
		suggestions,
		newInterest,
		setNewInterest,
		handleInputChange,
		handleSave,
		handleReset,
		handleAdd,
		handleDelete,
		isDirty,
		saveState,
		formError,
	} = useProfilePage();
	const navigate = useNavigate();
	// Un profil de démonstration n'a pas de compte : ni identifiants ni profils à gérer
	const isDemo = Boolean(user?.is_demo);
	const logoutEverywhere = useAuthStore((state) => state.logoutEverywhere);
	const handleLogoutEverywhere = async () => {
		await logoutEverywhere();
		navigate(ROUTES.LOGIN, { replace: true });
	};

	// Une seule requête de stats : le hero (XP, miloros, série) et la section
	// « Ma progression » la partagent
	const [days, setDays] = useState<StatsPeriodDays>(30);
	const stats = useStats(days);

	const classeLabel = CLASSES.find((c) => c.value === profile.classe)?.label ?? "Classe non renseignée";

	const isSaving = saveState === "saving";
	const showSaveBar = isDirty || isSaving || saveState === "saved";

	const [searchParams, setSearchParams] = useSearchParams();
	const requested = searchParams.get("onglet") as TabId | null;
	const tab: TabId = requested && TAB_IDS.includes(requested) ? requested : "progression";
	const selectTab = (id: TabId) => setSearchParams(id === "progression" ? {} : { onglet: id }, { replace: true });

	const tabs: ProfileTab<TabId>[] = [
		{ id: "progression", label: "Progression", icon: "bar_chart" },
		{ id: "matieres", label: "Matières & duels", icon: "crossed_swords" },
		// Les champs modifiables sont tous dans « Mon compte » : la pastille
		// rappelle d'enregistrer quand on change d'onglet
		{ id: "compte", label: "Mon compte", icon: "student", hasDot: isDirty },
		{ id: "securite", label: "Sécurité", icon: "shield" },
	];

	return (
		<ScreenLayout>
			<div className="pf">
				<div className="pf-wrap">
					<ProfileHero
						firstName={profile.first_name}
						lastName={profile.last_name}
						username={profile.username}
						classeLabel={classeLabel}
						xp={stats.data?.xp}
						coins={stats.data?.coins}
						streak={stats.data?.streak}
					/>

					<ProfileTabs tabs={tabs} active={tab} onChange={selectTab} />

					{/* La clé rejoue l'entrée des cartes à chaque changement d'onglet */}
					<div
						key={tab}
						role="tabpanel"
						id={`pf-panel-${tab}`}
						aria-labelledby={`pf-tab-${tab}`}
						className="pf-panel"
					>
						{(tab === "progression" || tab === "matieres") && (
							<ProfileStats
								view={tab === "progression" ? "progress" : "subjects"}
								days={days}
								onDaysChange={setDays}
								stats={stats}
							/>
						)}

						{tab === "compte" && (
							<div className="pf-bento">
								{/* Rangée 1 : identité du profil + identifiants du compte */}
								<ProfileCard icon="student" title="Informations personnelles" className="pf-span-2">
									<div className="pf-fields">
										<div className="pf-field">
											<label className="pf-label" htmlFor="pf-first-name">
												Prénom
											</label>
											<input
												id="pf-first-name"
												type="text"
												className="pf-input"
												autoComplete="given-name"
												value={tempProfile.first_name}
												onChange={(e) => handleInputChange("first_name", e.target.value)}
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
												autoComplete="family-name"
												value={tempProfile.last_name}
												onChange={(e) => handleInputChange("last_name", e.target.value)}
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
											<span className="pf-label" id="pf-username-label">
												Pseudo
												<span className="pf-label-lock">
													<Lock size={11} aria-hidden="true" /> non modifiable
												</span>
											</span>
											<div className="pf-input pf-input-readonly" aria-labelledby="pf-username-label">
												<AtSign size={16} aria-hidden="true" />
												<span>{profile.username}</span>
											</div>
										</div>
									</div>
								</ProfileCard>

								<ProfileCard
									icon="locked"
									title="Connexion"
									subtitle="Identifiants du compte, communs à tous ses profils"
									className="pf-span-2"
								>
									{!isDemo && <AccountLoginPanel email={profile.email} />}

									<button
										type="button"
										className="pf-btn pf-btn-danger pf-card-end"
										onClick={handleLogoutEverywhere}
										title="Déconnecte tous les profils du compte, sur tous tes appareils"
									>
										<LogOut size={16} aria-hidden="true" />
										Se déconnecter de tous les appareils
									</button>
								</ProfileCard>

								{/* Rangée 2 : centres d'intérêt, sur toute la largeur */}
								<ProfileCard
									icon="sparkles"
									title="Centres d'intérêt"
									subtitle="Milo s'en sert pour personnaliser tes exercices"
									aside={<span className="pf-count">{interests.length}</span>}
									className="pf-span-4"
								>
									<div className="pf-tags">
										{interests.length > 0 ? (
											interests.map((interest) => (
												<span key={interest.id} className="pf-tag">
													{interest.name}
													<button
														type="button"
														className="pf-tag-remove"
														onClick={() => handleDelete(interest.id)}
														aria-label={`Retirer ${interest.name}`}
													>
														<X size={13} aria-hidden="true" />
													</button>
												</span>
											))
										) : (
											<p className="pf-muted">
												Aucun intérêt pour le moment. Ajoute-en pour des exercices plus personnalisés.
											</p>
										)}
									</div>

									<div className="pf-add-row">
										<input
											type="text"
											className="pf-input"
											placeholder="Ajouter un centre d'intérêt..."
											aria-label="Nouveau centre d'intérêt"
											value={newInterest}
											maxLength={AI_LIMITS.INTEREST_NAME}
											onChange={(e) => setNewInterest(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleAdd()}
										/>
										<button
											type="button"
											className="pf-btn pf-btn-primary pf-btn-square"
											onClick={() => handleAdd()}
											disabled={!newInterest.trim()}
											aria-label="Ajouter"
										>
											<Plus size={20} aria-hidden="true" />
										</button>
									</div>

									{suggestions.length > 0 && (
										<div className="pf-suggestions">
											<p className="pf-label">Suggestions</p>
											<div className="pf-suggestions-list">
												{suggestions.map((name) => (
													<button key={name} type="button" className="pf-suggestion" onClick={() => handleAdd(name)}>
														<Plus size={13} aria-hidden="true" />
														{name}
													</button>
												))}
											</div>
										</div>
									)}
								</ProfileCard>

								{/* Rangée 3 : profils du compte + suppression du compte */}
								{!isDemo && (
									<>
										<ProfileCard
											icon="student"
											title="Profils du compte"
											subtitle="Chaque membre de la famille a le sien"
											className="pf-span-2"
										>
											<AccountProfilesPanel />
										</ProfileCard>

										<ProfileCard
											icon="fire"
											title="Supprimer le compte"
											subtitle="Effacement définitif de toutes les données"
											className="pf-span-2"
										>
											<DeleteAccountPanel />
										</ProfileCard>
									</>
								)}
							</div>
						)}

						{tab === "securite" && (
							<div className="pf-bento">
								{/* Rangée 1 : double authentification, méthodes côte à côte */}
								<ProfileCard
									icon="shield"
									title="Double authentification"
									subtitle="Un code en plus du mot de passe"
									className="pf-span-4 pf-2fa"
								>
									<TwoFactorPanel />
								</ProfileCard>

								{/* Rangée 2 : appareils et sessions, côte à côte */}
								<ProfileCard
									icon="globe"
									title="Appareils et sessions"
									subtitle="Là où ton compte est connecté"
									className="pf-span-4"
								>
									<div className="pf-split">
										<div>
											<h4 className="pf-subtitle">Appareils de confiance</h4>
											<TrustedDevicesPanel />
										</div>
										<div>
											<h4 className="pf-subtitle">Sessions ouvertes</h4>
											<SessionsPanel />
										</div>
									</div>
								</ProfileCard>
							</div>
						)}
					</div>
				</div>

				{/* --- BARRE DE SAUVEGARDE FLOTTANTE --- */}
				<div className={`pf-savebar ${showSaveBar ? "is-visible" : ""}`} aria-live="polite">
					<div
						className={`pf-savebar-inner ${saveState === "saved" ? "is-saved" : ""} ${formError ? "is-error" : ""}`}
					>
						<span className="pf-savebar-msg">
							{formError ? (
								<>
									<AlertCircle size={16} aria-hidden="true" />
									{formError}
								</>
							) : saveState === "saved" ? (
								<>
									<Check size={16} aria-hidden="true" />
									Profil enregistré
								</>
							) : (
								<>
									<AlertCircle size={16} aria-hidden="true" />
									Modifications non enregistrées
								</>
							)}
						</span>
						{saveState !== "saved" && (
							<div className="pf-savebar-actions">
								<button type="button" className="pf-btn pf-btn-ghost" onClick={handleReset} disabled={isSaving}>
									<RotateCcw size={15} aria-hidden="true" />
									Annuler
								</button>
								<button type="button" className="pf-btn pf-btn-primary" onClick={handleSave} disabled={isSaving}>
									{isSaving ? (
										<>
											<span className="pf-btn-spinner" aria-hidden="true" />
											Enregistrement...
										</>
									) : (
										<>
											<Check size={15} aria-hidden="true" />
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
