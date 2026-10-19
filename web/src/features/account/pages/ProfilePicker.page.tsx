import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, KeyRound, Loader, Lock, LogOut, Plus, Settings2, Trash2 } from "lucide-react";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import PinPromptDialog from "@features/account/components/PinPromptDialog";
import AddProfileDialog from "@features/account/components/AddProfileDialog";
import ProfilePinDialog from "@features/account/components/ProfilePinDialog";
import DeleteProfileDialog from "@features/account/components/DeleteProfileDialog";
import { useAccountProfiles } from "@features/account/store/account.queries";
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
 * Deux usages, selon le jeton en main :
 * - juste après la connexion (route publique), avec le jeton de compte ;
 * - depuis un profil ouvert (« Changer de profil »), avec le jeton du profil :
 *   pas de mot de passe à retaper, mais le PIN du profil cible reste exigé.
 *
 * Le mode « Gérer les profils » ajoute un profil, pose ou retire un PIN,
 * supprime un profil : chaque opération redemande le mot de passe du compte.
 */
const ProfilePickerPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const accessToken = useAuthStore((state) => state.accessToken);
	const accountToken = useAuthStore((state) => state.accountToken);
	const accountTokenExpiresAt = useAuthStore((state) => state.accountTokenExpiresAt);
	const loginProfiles = useAuthStore((state) => state.profiles);
	const selectProfile = useAuthStore((state) => state.selectProfile);
	const clearAccountSession = useAuthStore((state) => state.clearAccountSession);
	const logout = useAuthStore((state) => state.logout);
	const user = useUserStore((state) => state.user);

	const isSwitching = Boolean(accessToken);
	const currentProfileId = isSwitching && user ? Number(user.id) : null;

	const profilesQuery = useAccountProfiles(isSwitching ? undefined : loginProfiles);
	const profiles = profilesQuery.data ?? [];

	const [managing, setManaging] = useState(
		Boolean((location.state as { manage?: boolean } | null)?.manage),
	);
	const [openingId, setOpeningId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pinPromptFor, setPinPromptFor] = useState<ProfileSummary | null>(null);
	const [pinEditFor, setPinEditFor] = useState<ProfileSummary | null>(null);
	const [deleteFor, setDeleteFor] = useState<ProfileSummary | null>(null);
	const [adding, setAdding] = useState(false);

	/** Fin de la session de compte (ou de profil) : retour à la connexion. */
	const backToLogin = useCallback(
		async (message?: string) => {
			if (isSwitching) await logout();
			else clearAccountSession();
			navigate(ROUTES.LOGIN, { replace: true, state: message ? { message } : null });
		},
		[isSwitching, logout, clearAccountSession, navigate],
	);

	const sessionExpired = useCallback(() => void backToLogin(SESSION_EXPIRED_MESSAGE), [backToLogin]);

	// Le jeton de compte vit 30 minutes, sans refresh
	useEffect(() => {
		if (isSwitching || !accountToken) return;
		const timeout = setTimeout(sessionExpired, Math.max(0, accountTokenExpiresAt - Date.now()));
		return () => clearTimeout(timeout);
	}, [isSwitching, accountToken, accountTokenExpiresAt, sessionExpired]);

	useEffect(() => {
		if (!isSwitching && isAxiosError(profilesQuery.error) && profilesQuery.error.response?.status === 401) {
			sessionExpired();
		}
	}, [isSwitching, profilesQuery.error, sessionExpired]);

	// Rechargement de la page : le jeton de compte, gardé en mémoire, est perdu
	if (!isSwitching && !accountToken) return <Navigate to={ROUTES.LOGIN} replace />;
	// Un profil de démonstration n'a pas de compte à gérer
	if (isSwitching && user?.is_demo) return <Navigate to={ROUTES.ROOT} replace />;

	const profileGone = () => {
		setPinPromptFor(null);
		setError("Ce profil n'existe plus.");
		void profilesQuery.refetch();
	};

	const openProfile = async (profile: ProfileSummary) => {
		if (managing || openingId !== null) return;
		if (profile.id === currentProfileId) {
			navigate(ROUTES.ROOT);
			return;
		}
		if (profile.has_pin) {
			setPinPromptFor(profile);
			return;
		}
		setError(null);
		setOpeningId(profile.id);
		try {
			// Changement de profil : la page se recharge sur le nouveau profil.
			// Après la connexion : la session s'ouvre et l'accueil du rôle prend le relais.
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
		<div className="auth-page-root">
			<div className="auth-mesh"></div>

			{isSwitching ? (
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
					<h1 className="pp-title">{managing ? "Gérer les profils" : "Qui est-ce ?"}</h1>
					<p className="pp-subtitle">
						{managing
							? "Ajoute un profil, verrouille-le par un code PIN ou supprime-le."
							: isSwitching
								? "Choisis le profil à ouvrir."
								: "Choisis ton profil pour continuer."}
					</p>
				</motion.div>

				{error && (
					<p className="sec-alert sec-alert--error pp-error">
						<AlertTriangle size={16} />
						<span>{error}</span>
					</p>
				)}

				{profilesQuery.isLoading && <p className="sec-muted">Chargement des profils...</p>}

				<ul className="pp-grid">
					{profiles.map((profile, index) => {
						const isCurrent = profile.id === currentProfileId;
						const isOpening = openingId === profile.id;
						return (
							<motion.li
								key={profile.id}
								className="pp-item"
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.05 * index, type: "spring", stiffness: 140, damping: 16 }}
							>
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
											<span className="pp-lock" aria-hidden="true">
												<Lock size={16} />
											</span>
										)}
									</span>
									<span className="pp-name">{profile.first_name}</span>
									<span className="pp-role">{profileRoleLabel(profile)}</span>
								</button>

								{isCurrent && !managing && <span className="pp-current">Profil actuel</span>}

								{managing && (
									<div className="pp-tile-actions">
										<button type="button" className="pp-action" onClick={() => setPinEditFor(profile)}>
											<KeyRound size={13} /> PIN
										</button>
										<button
											type="button"
											className="pp-action pp-action--danger"
											onClick={() => setDeleteFor(profile)}
											aria-label={`Supprimer le profil de ${profile.first_name}`}
										>
											<Trash2 size={13} /> Supprimer
										</button>
									</div>
								)}
							</motion.li>
						);
					})}

					{canAdd && (
						<li className="pp-item">
							<button
								type="button"
								className="pp-tile"
								onClick={() => setAdding(true)}
								disabled={openingId !== null}
								aria-label="Ajouter un profil"
							>
								<span className="pp-avatar pp-avatar--add">
									<Plus size={40} />
								</span>
								<span className="pp-name">Ajouter</span>
								<span className="pp-role">Nouveau profil</span>
							</button>
						</li>
					)}
				</ul>

				<div className="pp-footer">
					<button type="button" className="pp-btn" onClick={() => setManaging((m) => !m)} disabled={openingId !== null}>
						{managing ? (
							<>
								<Check size={16} /> Terminé
							</>
						) : (
							<>
								<Settings2 size={16} /> Gérer les profils
							</>
						)}
					</button>
					{isSwitching ? (
						<button type="button" className="pp-btn pp-btn--ghost" onClick={() => navigate(ROUTES.ROOT)}>
							<ArrowLeft size={16} /> Revenir à mon profil
						</button>
					) : (
						<button type="button" className="pp-btn pp-btn--ghost" onClick={() => void backToLogin()}>
							<LogOut size={16} /> Se déconnecter
						</button>
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
