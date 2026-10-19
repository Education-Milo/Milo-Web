import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Lock, Settings2 } from "lucide-react";
import { useAccountProfiles } from "@features/account/store/account.queries";
import { profileInitials, profileRoleLabel, profileTone } from "@features/account/utils/profile.format";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import "@features/security/styles/Security.css";
import "@features/account/styles/Account.css";

/** Profils du compte, avec un accès à leur gestion (ajout, PIN, suppression). */
const AccountProfilesPanel: React.FC = () => {
	const navigate = useNavigate();
	const currentId = useUserStore((state) => (state.user ? Number(state.user.id) : null));
	const { data: profiles = [], isLoading, isError, error } = useAccountProfiles();

	return (
		<div className="sec-panel">
			{isLoading && <p className="sec-muted">Chargement...</p>}
			{isError && (
				<p className="sec-alert sec-alert--error">
					<AlertTriangle size={16} />
					<span>{getSecurityErrorMessage(error)}</span>
				</p>
			)}

			{profiles.length > 0 && (
				<ul className="acc-settings">
					{profiles.map((profile) => (
						<li key={profile.id} className="acc-setting">
							<span className={`acc-mini-avatar pp-avatar--${profileTone(profile.id)}`} aria-hidden="true">
								{profileInitials(profile)}
							</span>
							<div className="acc-setting-body">
								<strong>
									{profile.first_name} {profile.last_name}
								</strong>
								<span>
									{profileRoleLabel(profile)} · @{profile.username}
								</span>
							</div>
							{profile.has_pin && <Lock size={15} aria-label="Protégé par un code PIN" />}
							{profile.id === currentId && <span className="sec-chip sec-chip--on">Actuel</span>}
						</li>
					))}
				</ul>
			)}

			<div className="sec-actions sec-actions--start">
				<button
					type="button"
					className="sec-btn sec-btn--ghost"
					onClick={() => navigate(ROUTES.PROFILE_MANAGE)}
				>
					<Settings2 size={16} /> Gérer les profils
				</button>
			</div>
		</div>
	);
};

export default AccountProfilesPanel;
