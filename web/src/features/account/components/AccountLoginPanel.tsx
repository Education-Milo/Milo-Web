import React, { useState } from "react";
import { Lock, Mail } from "lucide-react";
import ChangeEmailDialog from "@features/account/components/ChangeEmailDialog";
import ChangePasswordDialog from "@features/account/components/ChangePasswordDialog";
import "@features/security/styles/Security.css";
import "@features/account/styles/Account.css";

interface AccountLoginPanelProps {
	email: string;
}

/** Identifiants du compte (email, mot de passe), communs à tous ses profils. */
const AccountLoginPanel: React.FC<AccountLoginPanelProps> = ({ email }) => {
	const [dialog, setDialog] = useState<"email" | "password" | null>(null);

	return (
		<>
			<ul className="acc-settings">
				<li className="acc-setting">
					<span className="acc-setting-icon" aria-hidden="true">
						<Mail size={18} />
					</span>
					<div className="acc-setting-body">
						<strong>{email || "—"}</strong>
						<span>Adresse de connexion</span>
					</div>
					<button type="button" className="sec-btn sec-btn--ghost sec-btn--sm" onClick={() => setDialog("email")}>
						Modifier
					</button>
				</li>
				<li className="acc-setting">
					<span className="acc-setting-icon" aria-hidden="true">
						<Lock size={18} />
					</span>
					<div className="acc-setting-body">
						<strong>Mot de passe</strong>
						<span>Protège le compte et tous ses profils</span>
					</div>
					<button type="button" className="sec-btn sec-btn--ghost sec-btn--sm" onClick={() => setDialog("password")}>
						Modifier
					</button>
				</li>
			</ul>

			{dialog === "email" && <ChangeEmailDialog currentEmail={email} onClose={() => setDialog(null)} />}
			{dialog === "password" && <ChangePasswordDialog onClose={() => setDialog(null)} />}
		</>
	);
};

export default AccountLoginPanel;
