import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, Check, KeyRound, Loader, LogOut, Plus, Settings2, Trash2, Users } from "lucide-react";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import PinPromptDialog from "@features/account/components/PinPromptDialog";
import AddProfileDialog from "@features/account/components/AddProfileDialog";
import ProfilePinDialog from "@features/account/components/ProfilePinDialog";
import DeleteProfileDialog from "@features/account/components/DeleteProfileDialog";
import { useAccountProfiles } from "@features/account/store/account.queries";
import { useLeaveProfile } from "@features/account/hooks/useLeaveProfile";
import { MAX_PROFILES_PER_ACCOUNT, type DeleteProfileResponse } from "@features/account/store/account.model";
import { profileInitials, profileRoleLabel, profileTone } from "@features/account/utils/profile.format";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useUserStore } from "@shared/store/user/user.store";
import type { ProfileSummary } from "@shared/store/auth/auth.model";
import { showToast } from "@shared/store/toast/toast.store";
import { ROUTES } from "@shared/constants/routes";
import "@features/auth/styles/AuthShared.css";
import "@features/security/styles/Security.css";
import "@features/account/styles/Account.css";

const SESSION_EXPIRED_MESSAGE = "Ta session a expiré. Reconnecte-toi pour choisir un profil.";

/**
 * « Qui est-ce ? » : choix du profil, sur le modèle de Netflix.
 *
 * Deux usages, selon la session en cours :
 * - session de compte (route publique /profiles) : choisir un profil, PIN
 *   compris. On y arrive par la connexion ou par « Changer de profil »
 *   (POST /logout/profile), jamais avec le jeton d'un profil ;
 * - profil ouvert (/profiles/manage) : gestion seule, sans ouverture de
 *   profil. Ouvrir un profil avec le jeton d'un autre dispenserait le profil
 *   courant de son PIN ; on passe donc par « Changer de profil ».
 *
 * La gestion ajoute un profil, pose ou retire un PIN, supprime un profil :
 * chaque opération redemande le mot de passe du compte.
 */
const ProfilePickerPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const accessToken = useAuthStore((state) => state.accessToken);
	const hasAccountSession = useAuthStore((state) => state.hasAccountSession);
	const accountTokenExpiresAt = useAuthStore((state) => state.accountTokenExpiresAt);
	const loginProfiles = useAuthStore((state) => state.profiles);
	const selectProfile = useAuthStore((state) => state.selectProfile);
	const clearAccountSession = useAuthStore((state) => state.clearAccountSession);
	const logout = useAuthStore((state) => state.logout);
	const user = useUserStore((state) => state.user);

	const isManagePage = Boolean(accessToken);
	const currentProfileId = isManagePage && user ? Number(user.id) : null;
	const { leave, isLeaving } = useLeaveProfile();

	const profilesQuery = useAccountProfiles(isManagePage ? undefined : loginProfiles);
	const profiles = profilesQuery.data ?? [];

	const [manageToggle, setManageToggle] = useState(
		Boolean((location.state as { manage?: boolean } | null)?.manage),
	);
	const managing = isManagePage || manageToggle;
	const [openingId, setOpeningId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pinPromptFor, setPinPromptFor] = useState<ProfileSummary | null>(null);
	const [pinEditFor, setPinEditFor] = useState<ProfileSummary | null>(null);
	const [deleteFor, setDeleteFor] = useState<ProfileSummary | null>(null);
	const [adding, setAdding] = useState(false);

	/** Fin de la session de compte (ou de profil) : retour à la connexion. */
	const backToLogin = useCallback(
		async (message?: string) => {
			if (isManagePage) await logout();
			else await clearAccountSession();
			navigate(ROUTES.LOGIN, { replace: true, state: message ? { message } : null });
		},
		[isManagePage, logout, clearAccountSession, navigate],
	);

	const sessionExpired = useCallback(() => void backToLogin(SESSION_EXPIRED_MESSAGE), [backToLogin]);

	// Le jeton de compte vit 30 minutes, sans refresh. Échéance inconnue
	// après un rechargement (session reprise par GET /profiles) : le 401 fera foi.
	useEffect(() => {
		if (isManagePage || !hasAccountSession || !accountTokenExpiresAt) return;
		const timeout = setTimeout(sessionExpired, Math.max(0, accountTokenExpiresAt - Date.now()));
		return () => clearTimeout(timeout);
	}, [isManagePage, hasAccountSession, accountTokenExpiresAt, sessionExpired]);

	useEffect(() => {
		if (!isManagePage && isAxiosError(profilesQuery.error) && profilesQuery.error.response?.status === 401) {
			sessionExpired();
		}
	}, [isManagePage, profilesQuery.error, sessionExpired]);

	// Pas (ou plus) de session de compte : rien à choisir. En mode cookie, un
	// rechargement la reprend au démarrage (cookie milo_account) ; hors mode
	// cookie, le jeton gardé en mémoire est perdu.
	if (!isManagePage && !hasAccountSession) return <Navigate to={ROUTES.LOGIN} replace />;
	// Un profil de démonstration n'a pas de compte à gérer
	if (isManagePage && user?.is_demo) return <Navigate to={ROUTES.ROOT} replace />;

	const profileGone = () => {
		setPinPromptFor(null);
		setError("Ce profil n'existe plus.");
		void profilesQuery.refetch();
	};

	const openProfile = async (profile: ProfileSummary) => {
		if (managing || openingId !== null) return;
		if (profile.has_pin) {
			setPinPromptFor(profile);
			return;
		}
		setError(null);
		setOpeningId(profile.id);
		try {
			// La session s'ouvre et l'accueil du rôle prend le relais
			await selectProfile(profile.id);
		} catch (err) {
			const status = isAxiosError(err) ? err.response?.status : undefined;
			if (status === 401) sessionExpired();
			else if (status === 404) profileGone();
			else setError(getSecurityErrorMessage(err));
			setOpeningId(null);
		}
	};

	const handleDeleted = async (result: DeleteProfileResponse, profile: ProfileSummary) => {
		setDeleteFor(null);
		if (result.account_deleted) {
			await backToLogin("Le compte a été supprimé avec son dernier profil.");
			return;
		}
		if (profile.id === currentProfileId) {
			// Le jeton présenté était celui du profil supprimé : il ne vaut plus rien
			await backToLogin("Profil supprimé. Reconnecte-toi pour choisir un autre profil.");
			return;
		}
		showToast(`Profil de ${profile.first_name} supprimé.`, "success");
	};

	const canAdd = profiles.length > 0 && profiles.length < MAX_PROFILES_PER_ACCOUNT;

	return (
		<div className="auth-page-root pp-root">
			{isManagePage ? (
				<AuthHeader onBack={() => navigate(ROUTES.ROOT)} backLabel="Retour" />
			) : (
				<AuthHeader />
			)}

			<main className="auth-main pp-main">
				<motion.div
					className="pp-intro"
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ type: "spring", stiffness: 120, damping: 16 }}
				>
					<span className="pp-eyebrow">
						<i aria-hidden="true" />
						{managing ? "Mode gestion" : "Compte famille"}
					</span>
					<h1 className="pp-title">
						{managing ? (
							<>
								Gérer les <span className="pp-hl">profils</span>
							</>
						) : (
							<>
								Qui <span className="pp-hl">est-ce</span> ?
							</>
						)}
					</h1>
					<p className="pp-subtitle">
						{managing
							? "Ajoute un profil, verrouille-le par un code PIN ou supprime-le."
							: "Choisis ton profil pour reprendre ton aventure."}
					</p>
				</motion.div>

				{error && (
					<p className="sec-alert sec-alert--error pp-error" role="alert">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				<div className="pp-stage">
					<div className="pp-sun" aria-hidden="true" />

					{profilesQuery.isLoading ? (
						<ul className="pp-grid" aria-label="Chargement des profils...">
							{[0, 1, 2].map((i) => (
								<li key={i} className="pp-card pp-card--skeleton" />
							))}
						</ul>
					) : (
						<ul className={`pp-grid${managing ? " is-managing" : ""}`}>
							{profiles.map((profile, index) => {
								const isCurrent = profile.id === currentProfileId;
								const isOpening = openingId === profile.id;
								return (
									<motion.li
										key={profile.id}
										className={`pp-card${isOpening ? " is-opening" : ""}${isCurrent ? " is-current" : ""}`}
										initial={{ opacity: 0, y: 18, scale: 0.96 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										transition={{ delay: 0.06 * index, type: "spring", stiffness: 220, damping: 18 }}
									>
										{isCurrent && (
											<span className="pp-current">
												<i aria-hidden="true" />
												Profil actuel
											</span>
										)}

										<button
											type="button"
											className="pp-tile"
											onClick={() => void openProfile(profile)}
											disabled={managing || (openingId !== null && !isOpening)}
											aria-label={`Ouvrir le profil de ${profile.first_name}${profile.has_pin ? " (code PIN)" : ""}`}
										>
											<span className={`pp-avatar pp-avatar--${profileTone(profile.id)}`}>
												{isOpening ? <Loader size={34} className="sec-spin" /> : profileInitials(profile)}
												{profile.has_pin && (
													<span className="pp-lock" title="Protégé par un code PIN">
														<img src="/landing/emoji/locked.webp" alt="" draggable={false} />
													</span>
												)}
											</span>
											<span className="pp-name">{profile.first_name}</span>
											<span className="pp-role">{profileRoleLabel(profile)}</span>
										</button>

										{managing && (
											<div className="pp-tile-actions">
												<button type="button" className="pp-action" onClick={() => setPinEditFor(profile)}>
													<KeyRound size={14} /> {profile.has_pin ? "Code PIN" : "Ajouter un PIN"}
												</button>
												<button
													type="button"
													className="pp-action pp-action--danger"
													onClick={() => setDeleteFor(profile)}
													aria-label={`Supprimer le profil de ${profile.first_name}`}
													title="Supprimer"
												>
													<Trash2 size={14} />
												</button>
											</div>
										)}
									</motion.li>
								);
							})}

							{canAdd && (
								<motion.li
									className="pp-card pp-card--add"
									initial={{ opacity: 0, y: 18, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									transition={{ delay: 0.06 * profiles.length, type: "spring", stiffness: 220, damping: 18 }}
								>
									<button
										type="button"
										className="pp-tile"
										onClick={() => setAdding(true)}
										disabled={openingId !== null}
										aria-label="Ajouter un profil"
									>
										<span className="pp-avatar pp-avatar--add">
											<Plus size={36} strokeWidth={3} />
										</span>
										<span className="pp-name">Ajouter</span>
										<span className="pp-role">
											{profiles.length}/{MAX_PROFILES_PER_ACCOUNT} profils
										</span>
									</button>
								</motion.li>
							)}
						</ul>
					)}
				</div>

				<div className="pp-footer">
					{isManagePage ? (
						<>
							<button type="button" className="pp-btn pp-btn--primary" onClick={() => navigate(ROUTES.ROOT)} disabled={isLeaving}>
								<Check size={18} strokeWidth={2.6} /> Terminé
							</button>
							<button type="button" className="pp-btn pp-btn--ghost" onClick={() => void leave()} disabled={isLeaving}>
								{isLeaving ? <Loader size={18} className="sec-spin" /> : <Users size={18} />} Changer de profil
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								className={`pp-btn ${managing ? "pp-btn--primary" : "pp-btn--ghost"}`}
								onClick={() => setManageToggle((m) => !m)}
								disabled={openingId !== null}
							>
								{managing ? (
									<>
										<Check size={18} strokeWidth={2.6} /> Terminé
									</>
								) : (
									<>
										<Settings2 size={18} /> Gérer les profils
									</>
								)}
							</button>
							<button type="button" className="pp-link" onClick={() => void backToLogin()}>
								<LogOut size={16} /> Se déconnecter
							</button>
						</>
					)}
				</div>
			</main>

			{pinPromptFor && (
				<PinPromptDialog
					profile={pinPromptFor}
					onSubmit={(pin) => selectProfile(pinPromptFor.id, pin)}
					onClose={() => setPinPromptFor(null)}
					onSessionExpired={sessionExpired}
					onProfileGone={profileGone}
				/>
			)}
			{adding && <AddProfileDialog onClose={() => setAdding(false)} />}
			{pinEditFor && <ProfilePinDialog profile={pinEditFor} onClose={() => setPinEditFor(null)} />}
			{deleteFor && (
				<DeleteProfileDialog
					profile={deleteFor}
					isLastProfile={profiles.length === 1}
					onClose={() => setDeleteFor(null)}
					onDeleted={(result) => void handleDeleted(result, deleteFor)}
				/>
			)}
		</div>
	);
};

export default ProfilePickerPage;
