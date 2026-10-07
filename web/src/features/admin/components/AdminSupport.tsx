import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Coins, FlaskConical, Search } from "lucide-react";
import type { UserRole } from "@shared/store/user/user.model";
import {
	ROLE_LABELS,
	type AdminUserRow,
} from "@features/admin/store/admin.model";
import { getAdminErrorMessage, useAdminUsers } from "@features/admin/store/admin.queries";
import { StatsScopeProvider } from "@features/stats/context/StatsScope";
import StatsView from "@features/stats/components/StatsView";
import { usePerformances } from "@features/stats/store/stats.queries";
import GrantCoinsModal from "@features/admin/components/GrantCoinsModal";
import UserRoleForm from "@features/admin/components/UserRoleForm";
import ResetTwoFactorForm from "@features/admin/components/ResetTwoFactorForm";
import UserModerationSummary from "@features/admin/components/UserModerationSummary";
import UserAiUsage from "@features/admin/components/UserAiUsage";
import { KIND_LABELS, formatDuration, formatRelativeDate } from "@features/stats/utils/stats.format";

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const ROLES: UserRole[] = ["Enfant", "Parent", "Prof", "Admin"];

const formatDate = (value: string) => {
	const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
	const date = new Date(hasZone ? value : `${value}Z`);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
};

/** Derniers résultats notés du compte (dans le StatsScope de l'utilisateur). */
const UserPerformances: React.FC = () => {
	const { data: results = [], isLoading, isError, error } = usePerformances({ days: 30, limit: 50 });
	return (
		<section className="ad-card">
			<h2 className="ad-subtitle">Derniers résultats (30 jours)</h2>
			{isLoading && <p className="ad-muted">Chargement...</p>}
			{isError && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>}
			{!isLoading && !isError && results.length === 0 && <p className="ad-muted">Aucun résultat sur la période.</p>}
			{results.length > 0 && (
				<div className="ad-table-wrap ad-table-wrap--flat">
					<table className="ad-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Type</th>
								<th>Matière</th>
								<th>Leçon</th>
								<th>Score</th>
								<th>Série</th>
								<th>Durée</th>
							</tr>
						</thead>
						<tbody>
							{results.map((r) => (
								<tr key={r.id}>
									<td className="ad-nowrap">{formatRelativeDate(r.created_at)}</td>
									<td>{KIND_LABELS[r.kind] ?? r.kind}</td>
									<td>{r.subject ?? "—"}</td>
									<td>{r.lesson ?? "—"}</td>
									<td className="ad-nowrap"><strong>{r.score}/{r.max_score}</strong></td>
									<td>{r.best_streak || "—"}</td>
									<td className="ad-nowrap">{r.duration_seconds > 0 ? formatDuration(r.duration_seconds) : "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
};

interface UserDetailProps {
	user: AdminUserRow;
	onBack: () => void;
	/** Reporte sur la fiche ouverte un changement fait depuis le détail */
	onUpdate: (patch: Partial<AdminUserRow>) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onBack, onUpdate }) => {
	const [isGranting, setIsGranting] = useState(false);

	return (
		<StatsScopeProvider scope={{ kind: "user", userId: user.id, username: user.username }}>
			<div className="ad-support-detail">
				<div className="ad-toolbar">
					<button type="button" className="ad-btn ad-btn--ghost" onClick={onBack}>
						<ArrowLeft size={16} /> Retour à la liste
					</button>
				</div>

				<section className="ad-card">
					<header className="ad-card-header">
						<div className="ad-avatar">
							{`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
						</div>
						<div className="ad-card-identity">
							<h2 className="ad-card-title">{user.first_name} {user.last_name}</h2>
							<span className="ad-muted">@{user.username} · {user.email}</span>
						</div>
						{user.is_demo && <span className="ad-chip"><FlaskConical size={12} /> Démo</span>}
						<span className={`ad-role-badge ad-role-badge--${user.role}`}>{ROLE_LABELS[user.role] ?? user.role}</span>
						<button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={() => setIsGranting(true)}>
							<Coins size={14} /> Créditer des miloros
						</button>
					</header>
					<dl className="ad-facts">
						<div><dt>Classe</dt><dd>{user.class_ ?? "—"}</dd></div>
						<div><dt>XP</dt><dd>{user.xp.toLocaleString("fr-FR")}</dd></div>
						<div><dt>Miloros</dt><dd>{user.miloro_coin.toLocaleString("fr-FR")}</dd></div>
						<div><dt>Série</dt><dd>{user.streak} j</dd></div>
						<div><dt>Inscrit le</dt><dd>{formatDate(user.created_at)}</dd></div>
						<div><dt>Identifiant</dt><dd>#{user.id}</dd></div>
					</dl>

					<UserRoleForm user={user} onChanged={(result) => onUpdate({ role: result.role })} />

					{/* Un profil de démo ne peut pas activer la 2FA : rien à désactiver */}
					{!user.is_demo && <ResetTwoFactorForm key={user.id} user={user} />}

					{/* Les comptes de démo sont exclus de la modération côté back */}
					{!user.is_demo && <UserModerationSummary userId={user.id} />}
				</section>

				{isGranting && (
					<GrantCoinsModal
						user={user}
						onClose={() => setIsGranting(false)}
						onGranted={(result) => onUpdate({ miloro_coin: result.newCoins })}
					/>
				)}

				<UserAiUsage key={user.id} userId={user.id} />

				<UserPerformances />

				{/* Même vue que la page Statistiques de l'élève */}
				<StatsView />
			</div>
		</StatsScopeProvider>
	);
};

const AdminSupport: React.FC = () => {
	const [searchInput, setSearchInput] = useState("");
	const [q, setQ] = useState("");
	const [role, setRole] = useState<UserRole | "">("");
	const [offset, setOffset] = useState(0);
	const [selected, setSelected] = useState<AdminUserRow | null>(null);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setQ(searchInput.trim());
			setOffset(0);
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [searchInput]);

	const { data, isLoading, isError, error, isFetching } = useAdminUsers({
		q: q || undefined,
		role: role || undefined,
		limit: PAGE_SIZE,
		offset,
	});

	if (selected) {
		return (
			<UserDetail
				key={selected.id}
				user={selected}
				onBack={() => setSelected(null)}
				onUpdate={(patch) => setSelected((current) => (current ? { ...current, ...patch } : current))}
			/>
		);
	}

	const total = data?.total ?? 0;
	const page = Math.floor(offset / PAGE_SIZE) + 1;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className="ad-support">
			<div className="ad-toolbar">
				<div className="ad-search-box ad-search-box--inline">
					<Search size={18} />
					<input
						type="text"
						placeholder="Pseudo, email ou nom..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						aria-label="Rechercher un compte"
						autoComplete="off"
					/>
				</div>
				<label className="ad-field">
					<span>Rôle</span>
					<select
						value={role}
						onChange={(e) => {
							setRole(e.target.value as UserRole | "");
							setOffset(0);
						}}
					>
						<option value="">Tous les rôles</option>
						{ROLES.map((r) => (
							<option key={r} value={r}>{ROLE_LABELS[r]}</option>
						))}
					</select>
				</label>
				{data && <span className="ad-muted ad-toolbar-count">{total.toLocaleString("fr-FR")} compte{total > 1 ? "s" : ""}</span>}
			</div>

			{isLoading && <p className="ad-muted">Chargement des comptes...</p>}
			{isError && !data && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>}
			{data && data.users.length === 0 && <p className="ad-muted">Aucun compte ne correspond.</p>}

			{data && data.users.length > 0 && (
				<div className={`ad-table-wrap ${isFetching ? "is-fetching" : ""}`}>
					<table className="ad-table ad-table--clickable">
						<thead>
							<tr>
								<th>Compte</th>
								<th>Rôle</th>
								<th>Classe</th>
								<th>XP</th>
								<th>Miloros</th>
								<th>Série</th>
								<th>Inscrit le</th>
							</tr>
						</thead>
						<tbody>
							{data.users.map((u) => (
								<tr
									key={u.id}
									onClick={() => setSelected(u)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSelected(u);
										}
									}}
									tabIndex={0}
									title="Voir le détail"
								>
									<td>
										<div className="ad-user-cell">
											<strong>{u.first_name} {u.last_name}</strong>
											<span className="ad-muted">@{u.username} · {u.email}</span>
										</div>
									</td>
									<td>
										<span className={`ad-role-badge ad-role-badge--${u.role}`}>{ROLE_LABELS[u.role] ?? u.role}</span>
										{u.is_demo && <span className="ad-chip ad-chip--demo">Démo</span>}
									</td>
									<td>{u.class_ ?? "—"}</td>
									<td className="ad-nowrap">{u.xp.toLocaleString("fr-FR")}</td>
									<td className="ad-nowrap">{u.miloro_coin.toLocaleString("fr-FR")}</td>
									<td>{u.streak} j</td>
									<td className="ad-nowrap">{formatDate(u.created_at)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{data && total > PAGE_SIZE && (
				<div className="ad-pagination">
					<button
						type="button"
						className="ad-btn ad-btn--ghost"
						onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
						disabled={offset === 0 || isFetching}
					>
						<ChevronLeft size={16} /> Précédent
					</button>
					<span className="ad-muted">Page {page} / {pageCount}</span>
					<button
						type="button"
						className="ad-btn ad-btn--ghost"
						onClick={() => setOffset(offset + PAGE_SIZE)}
						disabled={offset + PAGE_SIZE >= total || isFetching}
					>
						Suivant <ChevronRight size={16} />
					</button>
				</div>
			)}
		</div>
	);
};

export default AdminSupport;
