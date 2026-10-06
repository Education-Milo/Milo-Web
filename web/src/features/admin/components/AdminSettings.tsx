import React from "react";
import { KeyRound, Laptop, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { useUserStore } from "@shared/store/user/user.store";
import { ROLE_LABELS } from "@features/admin/store/admin.model";
import TwoFactorPanel from "@features/security/components/TwoFactorPanel";
import TrustedDevicesPanel from "@features/security/components/TrustedDevicesPanel";
import SessionsPanel from "@features/security/components/SessionsPanel";

/** Paramètres du compte administrateur : identité et sécurité. */
const AdminSettings: React.FC = () => {
	const me = useUserStore((state) => state.user);

	return (
		<div className="ad-settings">
			<section className="ad-card">
				<header className="ad-card-header">
					<div className="ad-avatar">
						{`${me?.first_name?.[0] ?? ""}${me?.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
					</div>
					<div className="ad-card-identity">
						<h2 className="ad-card-title">{me?.first_name} {me?.last_name}</h2>
						<span className="ad-muted">@{me?.username}</span>
					</div>
					{me?.role && (
						<span className={`ad-role-badge ad-role-badge--${me.role}`}>{ROLE_LABELS[me.role] ?? me.role}</span>
					)}
				</header>
				<dl className="ad-facts">
					<div><dt>Email</dt><dd>{me?.email ?? "—"}</dd></div>
					<div><dt>Identifiant</dt><dd>#{me?.id}</dd></div>
				</dl>
			</section>

			<section className="ad-card">
				<div className="ad-card-title-wrap">
					<div className="ad-card-icon"><ShieldCheck size={18} /></div>
					<div>
						<h2 className="ad-card-title">Double authentification</h2>
						<p className="ad-card-subtitle">
							Fortement recommandée sur un compte administrateur : il donne accès à tous les comptes.
						</p>
					</div>
				</div>
				<TwoFactorPanel />
			</section>

			<div className="ad-settings-grid">
				<section className="ad-card">
					<div className="ad-card-title-wrap">
						<div className="ad-card-icon"><MonitorSmartphone size={18} /></div>
						<div>
							<h2 className="ad-card-title">Appareils de confiance</h2>
							<p className="ad-card-subtitle">Dispensés du code pendant 30 jours</p>
						</div>
					</div>
					<TrustedDevicesPanel />
				</section>

				<section className="ad-card">
					<div className="ad-card-title-wrap">
						<div className="ad-card-icon"><Laptop size={18} /></div>
						<div>
							<h2 className="ad-card-title">Sessions ouvertes</h2>
							<p className="ad-card-subtitle">Les appareils actuellement connectés à ton compte</p>
						</div>
					</div>
					<SessionsPanel showLogoutEverywhere />
				</section>
			</div>

			<p className="ad-muted ad-settings-foot">
				<KeyRound size={14} /> Mot de passe oublié ? La réinitialisation passe par la page de connexion et
				déconnecte toutes tes sessions.
			</p>
		</div>
	);
};

export default AdminSettings;
