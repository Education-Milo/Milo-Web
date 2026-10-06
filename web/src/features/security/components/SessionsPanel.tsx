import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, Laptop, Loader, LogOut, Pencil, X } from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import { describeUserAgent } from "@shared/utils/device";
import type { UserSession } from "@features/security/store/security.model";
import { useRenameSession, useRevokeSession, useSessions } from "@features/security/store/security.queries";
import { formatDateTime, getSecurityErrorMessage } from "@features/security/utils/security.format";
import "@features/security/styles/Security.css";

interface SessionsPanelProps {
	/** Bouton « Se déconnecter de tous les appareils » (absent si la page l'a déjà) */
	showLogoutEverywhere?: boolean;
}

const byLastUse = (a: UserSession, b: UserSession) =>
	new Date(b.last_used_at ?? b.created_at).getTime() - new Date(a.last_used_at ?? a.created_at).getTime();

/** Sessions ouvertes du compte : renommer, déconnecter une session. */
const SessionsPanel: React.FC<SessionsPanelProps> = ({ showLogoutEverywhere = false }) => {
	const navigate = useNavigate();
	const isDemo = useUserStore((state) => Boolean(state.user?.is_demo));
	const logoutEverywhere = useAuthStore((state) => state.logoutEverywhere);
	const { data = [], isLoading, isError, error } = useSessions(!isDemo);
	const renameSession = useRenameSession();
	const revokeSession = useRevokeSession();
	const [editingId, setEditingId] = useState<number | null>(null);
	const [draftName, setDraftName] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);

	// Session courante d'abord, puis par dernière utilisation
	const sessions = useMemo(
		() => [...data].sort((a, b) => Number(b.is_current === true) - Number(a.is_current === true) || byLastUse(a, b)),
		[data],
	);
	// Hors mode cookie, le back ne sait pas laquelle est la nôtre
	const currentKnown = data.some((s) => s.is_current !== null);

	if (isDemo) return null;

	const startEditing = (session: UserSession) => {
		setEditingId(session.id);
		setDraftName(session.device_name ?? describeUserAgent(session.user_agent));
		setActionError(null);
	};

	const saveName = (sessionId: number) => {
		const name = draftName.trim();
		if (!name) return;
		renameSession.mutate(
			{ sessionId, deviceName: name },
			{
				onSuccess: () => setEditingId(null),
				onError: (err) => setActionError(getSecurityErrorMessage(err)),
			},
		);
	};

	const handleLogoutEverywhere = async () => {
		await logoutEverywhere();
		navigate(ROUTES.LOGIN, { replace: true });
	};

	return (
		<div className="sec-panel">
			{isLoading && <p className="sec-muted">Chargement...</p>}
			{isError && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{getSecurityErrorMessage(error)}</span></p>}
			{!isLoading && !isError && !currentKnown && sessions.length > 0 && (
				<p className="sec-note">Cette session ne peut pas être identifiée ici : elle est probablement la plus récente.</p>
			)}

			{sessions.length > 0 && (
				<ul className="sec-list">
					{sessions.map((session) => {
						const isCurrent = session.is_current === true;
						const isEditing = editingId === session.id;
						const isRevoking = revokeSession.isPending && revokeSession.variables === session.id;
						return (
							<li key={session.id} className={`sec-list-item ${isCurrent ? "is-current" : ""}`}>
								<div className="sec-list-icon"><Laptop size={18} /></div>
								<div className="sec-list-body">
									{isEditing ? (
										<form
											className="sec-inline-edit"
											onSubmit={(e) => {
												e.preventDefault();
												saveName(session.id);
											}}
										>
											<input
												type="text"
												value={draftName}
												maxLength={100}
												onChange={(e) => setDraftName(e.target.value)}
												aria-label="Nom de l'appareil"
												autoFocus
											/>
											<button type="submit" className="sec-icon-btn" aria-label="Enregistrer" disabled={!draftName.trim() || renameSession.isPending}>
												{renameSession.isPending ? <Loader size={16} className="sec-spin" /> : <Check size={16} />}
											</button>
											<button type="button" className="sec-icon-btn" aria-label="Annuler" onClick={() => setEditingId(null)}>
												<X size={16} />
											</button>
										</form>
									) : (
										<div className="sec-list-title">
											<strong>{session.device_name || describeUserAgent(session.user_agent)}</strong>
											{isCurrent && <span className="sec-chip sec-chip--on">Cet appareil</span>}
											<button type="button" className="sec-icon-btn sec-icon-btn--sm" onClick={() => startEditing(session)} aria-label="Renommer">
												<Pencil size={14} />
											</button>
										</div>
									)}
									<span className="sec-muted">
										Dernière activité {formatDateTime(session.last_used_at ?? session.created_at)}
										{session.ip_address ? ` · IP ${session.ip_address}` : ""}
									</span>
									<span className="sec-muted">Ouverte le {formatDateTime(session.created_at)}</span>
								</div>
								{!isCurrent && (
									<button
										type="button"
										className="sec-btn sec-btn--danger-ghost sec-btn--sm"
										disabled={isRevoking}
										onClick={() => {
											setActionError(null);
											revokeSession.mutate(session.id, { onError: (err) => setActionError(getSecurityErrorMessage(err)) });
										}}
									>
										{isRevoking && <Loader size={14} className="sec-spin" />} Déconnecter
									</button>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{actionError && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{actionError}</span></p>}

			{showLogoutEverywhere && (
				<div className="sec-actions sec-actions--start">
					<button type="button" className="sec-btn sec-btn--danger-ghost" onClick={() => void handleLogoutEverywhere()}>
						<LogOut size={16} /> Se déconnecter de tous les appareils
					</button>
				</div>
			)}
		</div>
	);
};

export default SessionsPanel;
