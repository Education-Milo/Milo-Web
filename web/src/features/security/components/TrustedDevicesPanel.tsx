import React, { useState } from "react";
import { AlertTriangle, Loader, MonitorSmartphone } from "lucide-react";
import { useUserStore } from "@shared/store/user/user.store";
import { describeUserAgent } from "@shared/utils/device";
import { useRevokeAllDevices, useRevokeDevice, useTrustedDevices } from "@features/security/store/security.queries";
import { formatDate, formatDateTime, getSecurityErrorMessage } from "@features/security/utils/security.format";
import "@features/security/styles/Security.css";

/** Appareils dispensés du second facteur pendant 30 jours. */
const TrustedDevicesPanel: React.FC = () => {
	const isDemo = useUserStore((state) => Boolean(state.user?.is_demo));
	const { data: devices = [], isLoading, isError, error } = useTrustedDevices(!isDemo);
	const revokeDevice = useRevokeDevice();
	const revokeAll = useRevokeAllDevices();
	const [confirmAll, setConfirmAll] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	if (isDemo) return null;

	const onError = (err: unknown) => setActionError(getSecurityErrorMessage(err));

	return (
		<div className="sec-panel">
			<p className="sec-text">
				Ces appareils ne redemandent pas le code après le mot de passe, pendant 30 jours. En retirer un ne le
				déconnecte pas : le code y sera simplement redemandé à la prochaine connexion.
			</p>

			{isLoading && <p className="sec-muted">Chargement...</p>}
			{isError && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{getSecurityErrorMessage(error)}</span></p>}
			{!isLoading && !isError && devices.length === 0 && (
				<p className="sec-empty">
					Aucun appareil de confiance. Coche « Faire confiance à cet appareil » au moment de saisir ton code
					pour ne plus le saisir pendant 30 jours.
				</p>
			)}

			{devices.length > 0 && (
				<ul className="sec-list">
					{devices.map((device) => (
						<li key={device.id} className="sec-list-item">
							<div className="sec-list-icon"><MonitorSmartphone size={18} /></div>
							<div className="sec-list-body">
								<strong>{device.device_name || describeUserAgent(device.user_agent)}</strong>
								<span className="sec-muted">
									Ajouté le {formatDate(device.created_at)} · Dernière utilisation {formatDateTime(device.last_used_at)}
								</span>
								<span className="sec-muted">
									Expire le {formatDate(device.expires_at)}
									{device.ip_address ? ` · IP ${device.ip_address}` : ""}
								</span>
							</div>
							<button
								type="button"
								className="sec-btn sec-btn--danger-ghost sec-btn--sm"
								onClick={() => {
									setActionError(null);
									revokeDevice.mutate(device.id, { onError });
								}}
								disabled={revokeDevice.isPending && revokeDevice.variables === device.id}
							>
								{revokeDevice.isPending && revokeDevice.variables === device.id && <Loader size={14} className="sec-spin" />}
								Retirer
							</button>
						</li>
					))}
				</ul>
			)}

			{actionError && <p className="sec-alert sec-alert--error"><AlertTriangle size={16} /><span>{actionError}</span></p>}

			{devices.length > 1 && (
				<div className="sec-actions sec-actions--start">
					{!confirmAll ? (
						<button type="button" className="sec-btn sec-btn--danger-ghost sec-btn--sm" onClick={() => setConfirmAll(true)}>
							Retirer tous les appareils
						</button>
					) : (
						<div className="sec-confirm">
							<span>Le code sera redemandé sur tous ces appareils.</span>
							<button type="button" className="sec-btn sec-btn--ghost sec-btn--sm" onClick={() => setConfirmAll(false)}>
								Annuler
							</button>
							<button
								type="button"
								className="sec-btn sec-btn--danger sec-btn--sm"
								disabled={revokeAll.isPending}
								onClick={() => {
									setActionError(null);
									revokeAll.mutate(undefined, { onSuccess: () => setConfirmAll(false), onError });
								}}
							>
								{revokeAll.isPending && <Loader size={14} className="sec-spin" />} Tout retirer
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default TrustedDevicesPanel;
