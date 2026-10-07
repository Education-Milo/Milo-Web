import React, { useState } from "react";
import {
	Activity,
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	HeartHandshake,
	MessageSquareWarning,
	ScrollText,
	ShieldCheck,
	Tags,
	Users,
	X,
} from "lucide-react";
import AiUsageChart from "@features/admin/components/AiUsageChart";
import { BarList, Tile, fmt, formatLatency } from "@features/admin/components/DashboardParts";
import { getAdminErrorMessage } from "@features/admin/store/admin.queries";
import type { ModerationDirection } from "@features/admin/store/moderation.model";
import {
	useAiUsage,
	useModerationEvents,
	useModerationOverview,
} from "@features/admin/store/moderation.queries";
import { formatDateTime } from "@features/security/utils/security.format";

const PERIODS = [7, 30, 90];
const PAGE_SIZE = 50;
const TOP_USERS = 10;

const DIRECTION_LABELS: Record<ModerationDirection, string> = {
	input: "Entrée",
	output: "Sortie",
};

const formatRate = (rate: number) =>
	`${(rate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

const plural = (n: number, word: string) => `${fmt(n)} ${word}${n > 1 ? "s" : ""}`;

/** Compte filtré dans le journal (clic sur un nom dans la table) */
interface AccountFilter {
	id: number;
	username: string | null;
}

/**
 * Modération IA : de l'urgent au diagnostic. Volume des requêtes, tuiles
 * (sorties signalées, autolyse, entrées signalées), familles et comptes les
 * plus actifs, puis le journal. Jamais de classement d'élèves par autolyse :
 * ce compteur vit sur la fiche de l'élève (Support).
 */
const AdminModeration: React.FC = () => {
	const [days, setDays] = useState(30);
	const [direction, setDirection] = useState<ModerationDirection | "">("");
	const [family, setFamily] = useState("");
	const [account, setAccount] = useState<AccountFilter | null>(null);
	const [offset, setOffset] = useState(0);

	const overview = useModerationOverview(days);
	const usage = useAiUsage(days);
	const events = useModerationEvents({
		days,
		direction: direction || undefined,
		family: family || undefined,
		user_id: account?.id,
		limit: PAGE_SIZE,
		offset,
	});

	const resetPage = () => setOffset(0);
	const mod = overview.data;
	const ai = usage.data;
	const log = events.data;
	const hasFilters = Boolean(direction || family || account);

	return (
		<div className="ad-moderation">
			<div className="ad-toolbar ad-toolbar--between">
				<div className="ad-segmented" role="tablist" aria-label="Période">
					{PERIODS.map((p) => (
						<button
							key={p}
							type="button"
							role="tab"
							aria-selected={days === p}
							className={`ad-segmented-btn ${days === p ? "active" : ""}`}
							onClick={() => {
								setDays(p);
								resetPage();
							}}
						>
							{p} jours
						</button>
					))}
				</div>
				<span className="ad-muted">Comptes de démonstration exclus</span>
			</div>

			{/* Volume des requêtes IA */}
			<section className="ad-card">
				<div className="ad-card-title-wrap">
					<div className="ad-card-icon"><Activity size={18} /></div>
					<div>
						<h2 className="ad-card-title">Requêtes IA par jour</h2>
						<p className="ad-card-subtitle">
							À surveiller : une marche d'escalier, à rapprocher d'un déploiement ou d'un changement de réglage.
						</p>
					</div>
				</div>
				{usage.isLoading && <p className="ad-muted">Chargement...</p>}
				{usage.isError && !ai && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(usage.error)}</p>}
				{ai && <AiUsageChart usage={ai} />}
			</section>

			{/* Tuiles : de l'urgent au contexte */}
			<div className="ad-tiles ad-tiles--4">
				<Tile
					icon={<Activity size={18} />}
					label="Requêtes IA"
					value={ai ? fmt(ai.total) : "—"}
					hint={
						ai
							? `${plural(ai.distinct_users, "compte")} · ${formatLatency(ai.latency_ms)}`
							: undefined
					}
				/>
				<Tile
					icon={mod && mod.flagged_output > 0 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
					label="Sorties signalées"
					value={mod ? fmt(mod.flagged_output) : "—"}
					hint={
						mod && mod.flagged_output > 0
							? "0 attendu : une injection a probablement abouti"
							: "0 attendu"
					}
					tone={mod && mod.flagged_output > 0 ? "critical" : undefined}
				/>
				<Tile
					icon={<HeartHandshake size={18} />}
					label="Autolyse"
					value={mod ? fmt(mod.self_harm_events) : "—"}
					hint={mod ? `${plural(mod.self_harm_accounts, "compte")} concerné${mod.self_harm_accounts > 1 ? "s" : ""}` : undefined}
				/>
				<Tile
					icon={<MessageSquareWarning size={18} />}
					label="Entrées signalées"
					value={mod?.flagged_input_rate != null ? formatRate(mod.flagged_input_rate) : "—"}
					hint={
						mod
							? mod.flagged_input_rate == null
								? "aucune requête IA à mesurer"
								: `${fmt(mod.flagged_input)} sur ${fmt(mod.ai_requests_total)} requêtes`
							: undefined
					}
				/>
			</div>
			{overview.isError && !mod && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(overview.error)}</p>}

			{/* Familles et comptes les plus actifs */}
			<div className="ad-moderation-cols">
				<section className="ad-card">
					<h2 className="ad-subtitle"><Tags size={16} /> Signalements par famille</h2>
					{mod && mod.by_family.length === 0 && <p className="ad-muted">Aucun signalement sur la période.</p>}
					{mod && mod.by_family.length > 0 && (
						<BarList rows={mod.by_family.map((f) => ({ label: f.family, value: f.count }))} />
					)}
				</section>
				<section className="ad-card">
					<h2 className="ad-subtitle"><Users size={16} /> Comptes les plus actifs</h2>
					<p className="ad-muted ad-card-note">Pour repérer un usage automatisé, pas pour classer les élèves.</p>
					{ai && ai.top_users.length === 0 && <p className="ad-muted">Aucune requête IA sur la période.</p>}
					{ai && ai.top_users.length > 0 && (
						<BarList
							rows={ai.top_users.slice(0, TOP_USERS).map((u) => ({
								key: String(u.user_id),
								label: u.username ? `@${u.username}` : `Compte supprimé (#${u.user_id})`,
								value: u.count,
							}))}
						/>
					)}
				</section>
			</div>

			{/* Journal */}
			<section className="ad-card">
				<h2 className="ad-subtitle"><ScrollText size={16} /> Journal des signalements</h2>

				<div className="ad-toolbar">
					<label className="ad-field">
						<span>Sens</span>
						<select
							value={direction}
							onChange={(e) => {
								setDirection(e.target.value as ModerationDirection | "");
								resetPage();
							}}
						>
							<option value="">Entrées et sorties</option>
							<option value="input">Entrées (élève → IA)</option>
							<option value="output">Sorties (IA → élève)</option>
						</select>
					</label>
					<label className="ad-field">
						<span>Famille</span>
						<select
							value={family}
							onChange={(e) => {
								setFamily(e.target.value);
								resetPage();
							}}
						>
							<option value="">Toutes</option>
							{/* Familles vues sur la période, plus celle déjà filtrée */}
							{[...new Set([...(mod?.by_family.map((f) => f.family) ?? []), ...(family ? [family] : [])])].map((f) => (
								<option key={f} value={f}>{f}</option>
							))}
						</select>
					</label>
					{account && (
						<span className="ad-chip ad-filter-chip">
							Compte : {account.username ? `@${account.username}` : `#${account.id}`}
							<button
								type="button"
								aria-label="Retirer le filtre de compte"
								onClick={() => {
									setAccount(null);
									resetPage();
								}}
							>
								<X size={12} />
							</button>
						</span>
					)}
					{log && <span className="ad-muted ad-toolbar-count">{plural(log.total, "signalement")}</span>}
				</div>

				{events.isLoading && <p className="ad-muted">Chargement du journal...</p>}
				{events.isError && !log && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(events.error)}</p>}

				{/* L'état vide est l'état normal : le dénominateur prouve que la mesure tourne */}
				{log && log.items.length === 0 && (
					<p className="ad-empty-state">
						{hasFilters
							? "Aucun signalement ne correspond à ces filtres."
							: `Aucun signalement sur les ${days} derniers jours${
									mod ? `, sur ${plural(mod.ai_requests_total, "requête")} IA` : ""
								}.`}
					</p>
				)}

				{log && log.items.length > 0 && (
					<div className={`ad-table-wrap ad-table-wrap--flat ${events.isFetching ? "is-fetching" : ""}`}>
						<table className="ad-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Compte</th>
									<th>Route</th>
									<th>Sens</th>
									<th>Catégories</th>
								</tr>
							</thead>
							<tbody>
								{log.items.map((item) => (
									<tr key={item.id}>
										<td className="ad-nowrap">{formatDateTime(item.created_at)}</td>
										<td>
											<button
												type="button"
												className="ad-link"
												title="Filtrer le journal sur ce compte"
												onClick={() => {
													setAccount({ id: item.user_id, username: item.username });
													resetPage();
												}}
											>
												{item.username ? `@${item.username}` : `Compte supprimé (#${item.user_id})`}
											</button>
										</td>
										<td><code className="ad-code">{item.route}</code></td>
										<td>{DIRECTION_LABELS[item.direction] ?? item.direction}</td>
										<td>
											<div className="ad-chips">
												{item.families.map((f) => (
													<span key={f} className="ad-chip">{f}</span>
												))}
											</div>
											<span className="ad-muted ad-categories">{item.categories.join(", ")}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{log && log.total > PAGE_SIZE && (
					<div className="ad-pagination">
						<button
							type="button"
							className="ad-btn ad-btn--ghost"
							onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
							disabled={offset === 0 || events.isFetching}
						>
							<ChevronLeft size={16} /> Précédent
						</button>
						<span className="ad-muted">
							Page {Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(log.total / PAGE_SIZE)}
						</span>
						<button
							type="button"
							className="ad-btn ad-btn--ghost"
							onClick={() => setOffset(offset + PAGE_SIZE)}
							disabled={offset + PAGE_SIZE >= log.total || events.isFetching}
						>
							Suivant <ChevronRight size={16} />
						</button>
					</div>
				)}

				{log && !log.content_stored && (
					<p className="ad-muted ad-table-foot">
						Le contenu des messages n'est pas conservé. Seules les catégories le sont.
					</p>
				)}
			</section>
		</div>
	);
};

export default AdminModeration;
