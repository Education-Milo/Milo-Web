import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, ChevronRight, Lock, RotateCcw, Table2 } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import ProfileCard from "@features/profile/components/ProfileCard.component";
import ActivityChart, { ActivityTable } from "@features/stats/components/ActivityChart";
import SubjectChart, { SubjectTable } from "@features/stats/components/SubjectChart";
import { ActivityFeedList } from "@features/stats/components/ActivityFeed";
import { useDuelStats } from "@features/stats/hooks/useDuelStats";
import type { useStats } from "@features/stats/store/stats.queries";
import type { StatsPeriodDays } from "@features/stats/store/stats.model";
import { formatDuration, formatPercent } from "@features/stats/utils/stats.format";
import { ROUTES } from "@shared/constants/routes";
import "@features/stats/styles/Stats.css";

const PERIODS:{ days: StatsPeriodDays; label: string }[] = [
	{ days: 7, label: "7 jours" },
	{ days: 30, label: "30 jours" },
	{ days: 90, label: "90 jours" },
];

const UPCOMING_ACHIEVEMENTS: { label: string; icon: Emoji3DName }[] = [
	{ label: "Premier cours terminé", icon: "books" },
	{ label: "10 duels gagnés", icon: "crossed_swords" },
	{ label: "Série de 7 jours", icon: "fire" },
];

const EMPTY_ACTIONS: { title: string; text: string; icon: Emoji3DName; path: string }[] = [
	{ title: "Lis un cours", text: "Milo t'explique une leçon pas à pas.", icon: "books", path: ROUTES.COURSES },
	{ title: "Fais un QCM", text: "Teste-toi sur une leçon et gagne des XP.", icon: "bullseye", path: ROUTES.COURSES },
	{ title: "Lance un duel", text: "Affronte un ami en direct.", icon: "crossed_swords", path: ROUTES.DUELS },
];

/** "2026-10-08" → "08/10/2026" */
const toFrDate = (iso: string) => iso.split("-").reverse().join("/");

/** 1 → "", 2 → "s" */
const plural = (n: number) => (n > 1 ? "s" : "");

interface KpiProps {
	icon: Emoji3DName;
	label: string;
	value: React.ReactNode;
	children: React.ReactNode;
}

/** Tuile chiffre clé : même hauteur pour les quatre, valeur en Luckiest Guy */
const Kpi: React.FC<KpiProps> = ({ icon, label, value, children }) => (
	<section className="pf-card pf-kpi">
		<div className="pf-kpi-top">
			<span className="pf-card-icon" aria-hidden="true">
				<Emoji3D name={icon} />
			</span>
			<h3 className="pf-kpi-label">{label}</h3>
		</div>
		<p className="pf-kpi-value">{value}</p>
		<div className="pf-kpi-foot">{children}</div>
	</section>
);

/** Bascule graphique / tableau (le tableau reste l'alternative accessible) */
const ViewToggle: React.FC<{ showTable: boolean; onToggle: () => void }> = ({ showTable, onToggle }) => (
	<button type="button" className="pf-toggle" onClick={onToggle} aria-pressed={showTable}>
		{showTable ? <BarChart3 size={15} aria-hidden="true" /> : <Table2 size={15} aria-hidden="true" />}
		{showTable ? "Graphique" : "Tableau"}
	</button>
);

export type ProfileStatsView = "progress" | "subjects";

interface ProfileStatsProps {
	/** Onglet affiché : chiffres clés + activité, ou matières + duels */
	view: ProfileStatsView;
	days: StatsPeriodDays;
	onDaysChange: (days: StatsPeriodDays) => void;
	stats: ReturnType<typeof useStats>;
}

/** Statistiques de l'élève (ex-page /stats), réparties sur deux onglets du profil. */
const ProfileStats: React.FC<ProfileStatsProps> = ({ view, days, onDaysChange, stats }) => {
	const navigate = useNavigate();
	const { data, isLoading, isError, isFetching, refetch } = stats;
	const { duelStats, rivals, loadingDuels } = useDuelStats();
	const [activityAsTable, setActivityAsTable] = useState(false);
	const [subjectsAsTable, setSubjectsAsTable] = useState(false);

	const totals = data?.totals;
	const qcm = data?.qcm;
	const hasActivity = !!totals && totals.active_days > 0;

	const activeDaysPct =
		data && data.period.days > 0 ? Math.min((data.totals.active_days / data.period.days) * 100, 100) : 0;

	const hasDuels = !!duelStats && duelStats.total_games > 0;
	const duelPct = (n: number) => (hasDuels ? (n / duelStats!.total_games) * 100 : 0);

	return (
		<div className="pf-section">
			<div className="pf-panel-head">
				<p className="pf-panel-range">
					{data ? `Du ${toFrDate(data.period.from)} au ${toFrDate(data.period.to)}` : "Tes chiffres, jour après jour"}
				</p>
				<div className="pf-period" role="group" aria-label="Période des statistiques">
					{PERIODS.map((p) => (
						<button
							key={p.days}
							type="button"
							className={`pf-period-btn ${days === p.days ? "is-active" : ""}`}
							aria-pressed={days === p.days}
							onClick={() => onDaysChange(p.days)}
						>
							{p.label}
						</button>
					))}
				</div>
			</div>

			{isLoading && (
				<div className="pf-bento" aria-busy="true" aria-label="Chargement des statistiques">
					{view === "progress" ? (
						<>
							{[0, 1, 2, 3].map((i) => (
								<div key={i} className="pf-card pf-kpi pf-skeleton" />
							))}
							<div className="pf-card pf-span-4 pf-skeleton pf-skeleton--tall" />
						</>
					) : (
						<>
							<div className="pf-card pf-span-2 pf-skeleton pf-skeleton--tall" />
							<div className="pf-card pf-skeleton pf-skeleton--tall" />
							<div className="pf-card pf-skeleton pf-skeleton--tall" />
						</>
					)}
				</div>
			)}

			{isError && !data && (
				<div className="pf-card pf-state">
					<Emoji3D name="speech_balloon" className="pf-state-icon" />
					<p>Impossible de charger tes statistiques pour le moment.</p>
					<button type="button" className="pf-btn pf-btn-ghost" onClick={() => refetch()}>
						<RotateCcw size={16} aria-hidden="true" />
						Réessayer
					</button>
				</div>
			)}

			{data && !hasActivity && (
				<div className="pf-card pf-empty-stats">
					<img src="/miloBook.webp" alt="" className="pf-empty-mascot" />
					<div className="pf-empty-copy">
						<h3 className="pf-empty-title">Tes statistiques t'attendent</h3>
						<p>
							Dès que tu travailles avec Milo, tes progrès s'affichent ici : temps passé, scores, points
							forts et matières à renforcer.
						</p>
						<div className="pf-empty-actions">
							{EMPTY_ACTIONS.map((action) => (
								<button key={action.title} type="button" className="pf-action" onClick={() => navigate(action.path)}>
									<Emoji3D name={action.icon} className="pf-action-icon" />
									<span className="pf-action-title">{action.title}</span>
									<span className="pf-action-text">{action.text}</span>
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{data && totals && qcm && hasActivity && view === "progress" && (
				<div className={`pf-bento ${isFetching ? "is-fetching" : ""}`}>
					{/* --- Rangée 1 : quatre chiffres clés --- */}
					<Kpi icon="spiral_calendar" label="Temps de travail" value={formatDuration(totals.time_seconds)}>
						<div className="pf-meter" aria-hidden="true">
							<span style={{ width: `${activeDaysPct}%` }} />
						</div>
						<span>
							{totals.active_days}/{data.period.days} jours actifs
						</span>
					</Kpi>

					<Kpi icon="bullseye" label="Moyenne QCM" value={formatPercent(qcm.avg_score_pct)}>
						<span>
							{totals.qcm_completed} terminé{plural(totals.qcm_completed)} · {qcm.perfect} sans-faute
						</span>
						<span>Meilleure série : {qcm.best_streak}</span>
					</Kpi>

					<Kpi
						icon="crossed_swords"
						label="Duels gagnés"
						value={loadingDuels ? "…" : hasDuels ? `${duelStats!.winrate}%` : "—"}
					>
						{hasDuels ? (
							<>
								<div className="pf-duel-bar" title="Victoires, nuls et défaites">
									<span className="pf-duel-win" style={{ width: `${duelPct(duelStats!.wins)}%` }} />
									<span className="pf-duel-draw" style={{ width: `${duelPct(duelStats!.draws)}%` }} />
									<span className="pf-duel-loss" style={{ width: `${duelPct(duelStats!.losses)}%` }} />
								</div>
								<span>
									{duelStats!.wins} victoire{plural(duelStats!.wins)} · {duelStats!.draws} nul
									{plural(duelStats!.draws)} · {duelStats!.losses} défaite{plural(duelStats!.losses)}
								</span>
							</>
						) : (
							!loadingDuels && (
								<button type="button" className="pf-link" onClick={() => navigate(ROUTES.DUELS)}>
									Lancer mon premier duel <ChevronRight size={14} aria-hidden="true" />
								</button>
							)
						)}
					</Kpi>

					<Kpi icon="books" label="Leçons lues" value={totals.lessons_read}>
						<span>
							{totals.questions_asked} question{plural(totals.questions_asked)} posée
							{plural(totals.questions_asked)} à Milo
						</span>
						<span>
							{totals.missions_completed} mission{plural(totals.missions_completed)} réussie
							{plural(totals.missions_completed)}
						</span>
					</Kpi>

					{/* --- Rangée 2 : activité jour par jour + fil récent --- */}
					<ProfileCard
						icon="bar_chart"
						title="Activité"
						subtitle="Temps de travail et moyenne QCM, jour par jour"
						aside={<ViewToggle showTable={activityAsTable} onToggle={() => setActivityAsTable((v) => !v)} />}
						className="pf-span-3"
					>
						{activityAsTable ? (
							<div className="st-table-wrap">
								<ActivityTable days={data.by_day} />
							</div>
						) : (
							<ActivityChart days={data.by_day} />
						)}
					</ProfileCard>

					<ProfileCard icon="high_voltage" title="Fil d'activité" subtitle="7 derniers jours" className="pf-feed">
						<ActivityFeedList />
					</ProfileCard>
				</div>
			)}

			{data && hasActivity && view === "subjects" && (
				<div className={`pf-bento ${isFetching ? "is-fetching" : ""}`}>
					{/* --- Une rangée : matières, rivalités, succès --- */}
					<ProfileCard
						icon="brain"
						title="Par matière"
						subtitle="De la plus travaillée à la moins travaillée"
						aside={<ViewToggle showTable={subjectsAsTable} onToggle={() => setSubjectsAsTable((v) => !v)} />}
						className="pf-span-2"
					>
						{subjectsAsTable ? (
							<div className="st-table-wrap">
								<SubjectTable subjects={data.by_subject} strengths={data.strengths} weaknesses={data.weaknesses} />
							</div>
						) : (
							<SubjectChart subjects={data.by_subject} strengths={data.strengths} weaknesses={data.weaknesses} />
						)}
					</ProfileCard>

					<ProfileCard icon="trophy" title="Rivalités" subtitle="Tes face-à-face">
						{loadingDuels ? (
							<div className="pf-skeleton-lines">
								<span />
								<span />
							</div>
						) : rivals.length > 0 ? (
							<ul className="pf-rivals">
								{rivals.map((opp) => (
									<li key={opp.opponent_id}>
										<span className="pf-rival-name">{opp.opponent_username}</span>
										<span className="pf-rival-pct">{opp.winrate}%</span>
										<div className="pf-meter" aria-hidden="true">
											<span style={{ width: `${opp.winrate}%` }} />
										</div>
									</li>
								))}
							</ul>
						) : (
							<p className="pf-muted">Défie des amis pour voir vos face-à-face ici.</p>
						)}
						<button type="button" className="pf-link pf-card-end" onClick={() => navigate(ROUTES.DUELS)}>
							Aller aux duels <ChevronRight size={14} aria-hidden="true" />
						</button>
					</ProfileCard>

					<ProfileCard icon="sports_medal" title="Succès" subtitle="Bientôt disponibles">
						<ul className="pf-achievements">
							{UPCOMING_ACHIEVEMENTS.map((a) => (
								<li key={a.label}>
									<span className="pf-achievement-icon">
										<Emoji3D name={a.icon} />
										<Lock size={11} className="pf-achievement-lock" aria-hidden="true" />
									</span>
									{a.label}
								</li>
							))}
						</ul>
						<p className="pf-muted pf-card-end">Et bien d'autres à venir…</p>
					</ProfileCard>
				</div>
			)}
		</div>
	);
};

export default ProfileStats;
