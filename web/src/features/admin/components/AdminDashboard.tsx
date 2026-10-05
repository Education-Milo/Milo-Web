import React, { useState } from "react";
import {
	BookOpenText,
	CheckCircle2,
	Clock,
	Coins,
	Gauge,
	HelpCircle,
	ScanLine,
	ShoppingBag,
	Shirt,
	Sparkles,
	Swords,
	Target,
	TrendingUp,
	UserPlus,
	Users,
	FlaskConical,
} from "lucide-react";
import { ROLE_LABELS } from "@features/admin/store/admin.model";
import { getAdminErrorMessage, useAdminDashboard } from "@features/admin/store/admin.queries";
import { formatDuration, formatPercent } from "@features/stats/utils/stats.format";
import type { UserRole } from "@shared/store/user/user.model";

const PERIODS = [
	{ days: 7, label: "7 jours" },
	{ days: 30, label: "30 jours" },
	{ days: 90, label: "90 jours" },
	{ days: 365, label: "1 an" },
];

const ROLE_ORDER: UserRole[] = ["Enfant", "Parent", "Prof", "Admin"];

const fmt = (n: number) => n.toLocaleString("fr-FR");

const Tile: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({
	icon,
	label,
	value,
	hint,
}) => (
	<div className="ad-tile">
		<div className="ad-tile-icon">{icon}</div>
		<div className="ad-tile-body">
			<span className="ad-tile-label">{label}</span>
			<span className="ad-tile-value">{value}</span>
			{hint && <span className="ad-tile-hint">{hint}</span>}
		</div>
	</div>
);

/** Barres horizontales, une seule teinte, valeur écrite au bout de chaque barre. */
const BarList: React.FC<{ rows: { label: string; value: number; note?: string }[]; unit?: string }> = ({
	rows,
	unit = "",
}) => {
	const max = Math.max(1, ...rows.map((r) => r.value));
	return (
		<ul className="ad-barlist">
			{rows.map((row) => (
				<li key={row.label} className="ad-barlist-row" title={`${row.label} : ${fmt(row.value)}${unit}`}>
					<span className="ad-barlist-label">{row.label}</span>
					<span className="ad-barlist-track">
						<span className="ad-barlist-fill" style={{ width: `${(row.value / max) * 100}%` }} />
					</span>
					<span className="ad-barlist-value">
						{fmt(row.value)}
						{unit}
						{row.note && <span className="ad-muted"> · {row.note}</span>}
					</span>
				</li>
			))}
		</ul>
	);
};

const AdminDashboard: React.FC = () => {
	const [days, setDays] = useState(30);
	const { data, isLoading, isError, error, isFetching } = useAdminDashboard(days);

	return (
		<div className="ad-dashboard">
			<div className="ad-toolbar ad-toolbar--between">
				<div className="ad-segmented" role="tablist" aria-label="Période">
					{PERIODS.map((p) => (
						<button
							key={p.days}
							type="button"
							role="tab"
							aria-selected={days === p.days}
							className={`ad-segmented-btn ${days === p.days ? "active" : ""}`}
							onClick={() => setDays(p.days)}
						>
							{p.label}
						</button>
					))}
				</div>
				{data && (
					<span className="ad-muted">
						Du {data.period.from.split("-").reverse().join("/")} au {data.period.to.split("-").reverse().join("/")}
						{" · "}profils de démo exclus
					</span>
				)}
			</div>

			{isLoading && <p className="ad-muted">Chargement du tableau de bord...</p>}
			{isError && !data && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>}

			{data && (
				<div className={`ad-dashboard-body ${isFetching ? "is-fetching" : ""}`}>
					{/* Utilisateurs */}
					<section className="ad-card">
						<h2 className="ad-subtitle"><Users size={16} /> Utilisateurs</h2>
						<div className="ad-tiles">
							<Tile icon={<Users size={18} />} label="Comptes" value={fmt(data.users.total)} hint="hors profils de démo" />
							<Tile icon={<UserPlus size={18} />} label="Nouveaux" value={fmt(data.users.new)} hint="inscrits sur la période" />
							<Tile icon={<TrendingUp size={18} />} label="Actifs" value={fmt(data.users.active)} hint="au moins une action" />
							<Tile icon={<FlaskConical size={18} />} label="Profils de démo" value={fmt(data.users.demo)} hint="non comptés ailleurs" />
						</div>
						<h3 className="ad-subtitle ad-subtitle--sm">Par rôle</h3>
						<BarList
							rows={ROLE_ORDER.map((role) => ({
								label: ROLE_LABELS[role],
								value: data.users.by_role[role] ?? 0,
							}))}
						/>
					</section>

					{/* Engagement */}
					<section className="ad-card">
						<h2 className="ad-subtitle"><Gauge size={16} /> Engagement</h2>
						<div className="ad-tiles">
							<Tile icon={<Clock size={18} />} label="Temps de travail" value={formatDuration(data.engagement.time_seconds)} />
							<Tile icon={<BookOpenText size={18} />} label="Cours lus" value={fmt(data.engagement.lessons_read)} />
							<Tile icon={<CheckCircle2 size={18} />} label="QCM terminés" value={fmt(data.engagement.qcm_completed)} />
							<Tile
								icon={<Sparkles size={18} />}
								label="Moyenne QCM"
								value={formatPercent(data.engagement.avg_score_pct)}
								hint={data.engagement.avg_score_pct === null ? "aucun QCM sur la période" : undefined}
							/>
							<Tile
								icon={<Swords size={18} />}
								label="Duels"
								value={`${fmt(data.engagement.duels_won)} / ${fmt(data.engagement.duels_played)}`}
								hint="gagnés / joués"
							/>
							<Tile icon={<HelpCircle size={18} />} label="Questions posées" value={fmt(data.engagement.questions_asked)} />
							<Tile icon={<ScanLine size={18} />} label="Cours importés" value={fmt(data.engagement.courses_scanned)} />
							<Tile icon={<Target size={18} />} label="Missions terminées" value={fmt(data.engagement.missions_completed)} />
						</div>
					</section>

					<div className="ad-dashboard-split">
						{/* Économie */}
						<section className="ad-card">
							<h2 className="ad-subtitle"><Coins size={16} /> Économie</h2>
							<div className="ad-tiles ad-tiles--stack">
								<Tile icon={<Shirt size={18} />} label="Cosmétiques au catalogue" value={fmt(data.economy.cosmetics)} />
								<Tile icon={<ShoppingBag size={18} />} label="Achats" value={fmt(data.economy.purchases)} />
								<Tile icon={<Coins size={18} />} label="Miloros en circulation" value={fmt(data.economy.coins_in_circulation)} />
							</div>
						</section>

						{/* Matières */}
						<section className="ad-card">
							<h2 className="ad-subtitle"><BookOpenText size={16} /> Matières les plus travaillées</h2>
							{data.top_subjects.length === 0 ? (
								<p className="ad-muted">Aucun QCM sur la période.</p>
							) : (
								<BarList
									unit=" QCM"
									rows={data.top_subjects.map((s) => ({
										label: s.subject,
										value: s.qcm_attempts,
										note: `moyenne ${formatPercent(s.avg_score_pct)}`,
									}))}
								/>
							)}
						</section>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
