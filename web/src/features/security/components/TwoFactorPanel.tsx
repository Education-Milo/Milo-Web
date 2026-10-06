import React, { useState } from "react";
import { FlaskConical, KeyRound, Mail, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { useUserStore } from "@shared/store/user/user.store";
import EnableFactorDialog from "@features/security/components/EnableFactorDialog";
import DisableFactorDialog from "@features/security/components/DisableFactorDialog";
import RegenerateCodesDialog from "@features/security/components/RegenerateCodesDialog";
import type { SecondFactor } from "@features/security/store/security.model";
import { useTwoFactorStatus } from "@features/security/store/security.queries";
import { getSecurityErrorMessage } from "@features/security/utils/security.format";
import "@features/security/styles/Security.css";

type Dialog =
	| { kind: "enable"; factor: SecondFactor; reconfigure?: boolean }
	| { kind: "disable"; factor: SecondFactor }
	| { kind: "codes" }
	| null;

const LOW_CODES_THRESHOLD = 3;

/** Bloc « Double authentification » des réglages du compte. */
const TwoFactorPanel: React.FC = () => {
	const isDemo = useUserStore((state) => Boolean(state.user?.is_demo));
	const { data: status, isLoading, isError, error } = useTwoFactorStatus(!isDemo);
	const [dialog, setDialog] = useState<Dialog>(null);

	// Jeton forgé par un admin, sans mot de passe ni second facteur : l'enrôlement répond 403
	if (isDemo) {
		return (
			<div className="sec-panel">
				<p className="sec-alert sec-alert--info">
					<FlaskConical size={18} />
					<span>Profil de démonstration : la double authentification n'est pas disponible sur ce compte.</span>
				</p>
			</div>
		);
	}

	if (isLoading) return <p className="sec-muted">Chargement...</p>;
	if (isError || !status) {
		return <p className="sec-alert sec-alert--error"><ShieldAlert size={16} /><span>{getSecurityErrorMessage(error)}</span></p>;
	}

	const isProtected = status.totp_enabled || status.email_enabled;
	const lowCodes = status.recovery_codes_remaining <= LOW_CODES_THRESHOLD;

	return (
		<div className="sec-panel">
			<div className={`sec-summary ${isProtected ? "is-on" : ""}`}>
				{isProtected ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
				<div>
					<strong>{isProtected ? "Double authentification activée" : "Double authentification désactivée"}</strong>
					<span>
						{isProtected
							? "Un code est demandé après ton mot de passe sur les appareils qui ne sont pas de confiance."
							: "Ajoute un second facteur : même si ton mot de passe est découvert, personne ne pourra entrer sans le code."}
					</span>
				</div>
			</div>

			<ul className="sec-factors">
				<li className="sec-factor">
					<div className="sec-factor-icon"><Smartphone size={18} /></div>
					<div className="sec-factor-body">
						<div className="sec-factor-title">
							<strong>Application d'authentification</strong>
							{status.totp_enabled ? (
								<span className="sec-chip sec-chip--on">Activée</span>
							) : status.totp_pending ? (
								<span className="sec-chip sec-chip--warn">Configuration non terminée</span>
							) : null}
						</div>
						<span className="sec-factor-desc">
							Un code qui change toutes les 30 secondes, généré par une application sur ton téléphone.
						</span>
					</div>
					<div className="sec-factor-actions">
						{status.totp_enabled ? (
							<>
								<button
									type="button"
									className="sec-btn sec-btn--ghost sec-btn--sm"
									onClick={() => setDialog({ kind: "enable", factor: "totp", reconfigure: true })}
								>
									Reconfigurer
								</button>
								<button
									type="button"
									className="sec-btn sec-btn--danger-ghost sec-btn--sm"
									onClick={() => setDialog({ kind: "disable", factor: "totp" })}
								>
									Désactiver
								</button>
							</>
						) : (
							<button
								type="button"
								className="sec-btn sec-btn--primary sec-btn--sm"
								onClick={() => setDialog({ kind: "enable", factor: "totp" })}
							>
								Configurer
							</button>
						)}
					</div>
				</li>

				<li className="sec-factor">
					<div className="sec-factor-icon"><Mail size={18} /></div>
					<div className="sec-factor-body">
						<div className="sec-factor-title">
							<strong>Code par email</strong>
							{status.email_enabled && <span className="sec-chip sec-chip--on">Activé</span>}
						</div>
						<span className="sec-factor-desc">Un code à 6 chiffres envoyé sur ton adresse email à chaque connexion.</span>
					</div>
					<div className="sec-factor-actions">
						{status.email_enabled ? (
							<button
								type="button"
								className="sec-btn sec-btn--danger-ghost sec-btn--sm"
								onClick={() => setDialog({ kind: "disable", factor: "email" })}
							>
								Désactiver
							</button>
						) : (
							<button
								type="button"
								className="sec-btn sec-btn--primary sec-btn--sm"
								onClick={() => setDialog({ kind: "enable", factor: "email" })}
							>
								Activer
							</button>
						)}
					</div>
				</li>

				{isProtected && (
					<li className="sec-factor">
						<div className="sec-factor-icon"><KeyRound size={18} /></div>
						<div className="sec-factor-body">
							<div className="sec-factor-title">
								<strong>Codes de secours</strong>
								<span className={`sec-chip ${lowCodes ? "sec-chip--warn" : ""}`}>
									{status.recovery_codes_remaining} restant{status.recovery_codes_remaining > 1 ? "s" : ""}
								</span>
							</div>
							<span className="sec-factor-desc">
								{status.recovery_codes_remaining === 0
									? "Tu n'as plus aucun code de secours : génère-en de nouveaux dès maintenant."
									: "Pour te connecter si tu n'as plus accès à ton téléphone ni à tes emails."}
							</span>
						</div>
						<div className="sec-factor-actions">
							<button
								type="button"
								className={`sec-btn sec-btn--sm ${lowCodes ? "sec-btn--primary" : "sec-btn--ghost"}`}
								onClick={() => setDialog({ kind: "codes" })}
							>
								Générer de nouveaux codes
							</button>
						</div>
					</li>
				)}
			</ul>

			{isProtected && (
				<p className="sec-note">
					La réinitialisation du mot de passe ne contourne pas la double authentification. Sans téléphone ni
					codes de secours, seul un administrateur peut débloquer ton compte.
				</p>
			)}

			{dialog?.kind === "enable" && (
				<EnableFactorDialog factor={dialog.factor} isReconfigure={dialog.reconfigure} onClose={() => setDialog(null)} />
			)}
			{dialog?.kind === "disable" && (
				<DisableFactorDialog factor={dialog.factor} status={status} onClose={() => setDialog(null)} />
			)}
			{dialog?.kind === "codes" && <RegenerateCodesDialog onClose={() => setDialog(null)} />}
		</div>
	);
};

export default TwoFactorPanel;
