import React, { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { AUDIT_ACTION_LABELS } from "@features/admin/store/admin.model";
import { getAdminErrorMessage, useAdminAudit } from "@features/admin/store/admin.queries";

const PAGE_SIZE = 50;

const formatDateTime = (value: string) => {
	const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
	const date = new Date(hasZone ? value : `${value}Z`);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
};

const AuditLog: React.FC = () => {
	const [action, setAction] = useState("");
	const [offset, setOffset] = useState(0);

	const { data: entries = [], isLoading, isFetching, isError, error, refetch } = useAdminAudit({
		action: action || undefined,
		limit: PAGE_SIZE,
		offset,
	});

	const page = Math.floor(offset / PAGE_SIZE) + 1;
	const hasNext = entries.length === PAGE_SIZE;

	return (
		<div className="ad-audit">
			<div className="ad-toolbar">
				<label className="ad-field">
					<span>Action</span>
					<select
						value={action}
						onChange={(e) => {
							setAction(e.target.value);
							setOffset(0);
						}}
					>
						<option value="">Toutes les actions</option>
						{Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
							<option key={value} value={value}>{label}</option>
						))}
					</select>
				</label>
				<button type="button" className="ad-btn ad-btn--ghost" onClick={() => refetch()} disabled={isFetching}>
					<RefreshCcw size={14} className={isFetching ? "ad-spin" : ""} />
					Actualiser
				</button>
			</div>

			{isLoading && <p className="ad-muted">Chargement du journal...</p>}
			{isError && entries.length === 0 && (
				<p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>
			)}
			{!isLoading && !isError && entries.length === 0 && (
				<p className="ad-muted">Aucune entrée pour ces critères.</p>
			)}

			{entries.length > 0 && (
				<div className={`ad-table-wrap ${isFetching ? "is-fetching" : ""}`}>
					<table className="ad-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Administrateur</th>
								<th>Action</th>
								<th>Cible</th>
								<th>Détails</th>
								<th>IP</th>
							</tr>
						</thead>
						<tbody>
							{entries.map((entry) => (
								<tr key={entry.id}>
									<td className="ad-nowrap">{formatDateTime(entry.created_at)}</td>
									<td>
										{entry.admin_username}
										<span className="ad-muted"> #{entry.admin_id}</span>
									</td>
									<td>
										<span className="ad-chip">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
									</td>
									<td>
										{entry.target_username ?? "—"}
										{entry.target_user_id !== null && (
											<span className="ad-muted"> #{entry.target_user_id}</span>
										)}
									</td>
									<td>{entry.details ?? "—"}</td>
									<td className="ad-nowrap ad-muted">{entry.ip_address ?? "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className="ad-pagination">
				<button
					type="button"
					className="ad-btn ad-btn--ghost"
					onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
					disabled={offset === 0 || isFetching}
				>
					<ChevronLeft size={16} /> Précédent
				</button>
				<span className="ad-muted">Page {page}</span>
				<button
					type="button"
					className="ad-btn ad-btn--ghost"
					onClick={() => setOffset(offset + PAGE_SIZE)}
					disabled={!hasNext || isFetching}
				>
					Suivant <ChevronRight size={16} />
				</button>
			</div>
		</div>
	);
};

export default AuditLog;
