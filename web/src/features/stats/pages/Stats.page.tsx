import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Award,
	BarChart3,
	ChevronRight,
	Clock,
	Coins,
	Flame,
	LineChart,
	Lock,
	Medal,
	Percent,
	Sparkles,
	Swords,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import ChartCard from "@features/stats/components/ChartCard";
import ActivityChart, { ActivityTable } from "@features/stats/components/ActivityChart";
import SubjectChart, { SubjectTable } from "@features/stats/components/SubjectChart";
import ActivityFeed from "@features/stats/components/ActivityFeed";
import StatsEmptyState from "@features/stats/components/StatsEmptyState";
import { useStats } from "@features/stats/store/stats.queries";
import { useDuelStats } from "@features/stats/hooks/useDuelStats";
import type { StatsPeriodDays } from "@features/stats/store/stats.model";
import { formatDuration, formatPercent } from "@features/stats/utils/stats.format";
import "@features/stats/styles/Stats.css";

const PERIODS: { days: StatsPeriodDays; label: string }[] = [
	{ days: 7, label: "7 jours" },
	{ days: 30, label: "30 jours" },
	{ days: 90, label: "90 jours" },
];

const XP_PER_LEVEL = 500;

const UPCOMING_ACHIEVEMENTS = [
	{ id: "first-course", label: "Premier cours terminé", icon: Award },
	{ id: "ten-duels", label: "10 duels gagnés", icon: Swords },
	{ id: "week-streak", label: "Série de 7 jours", icon: Flame },
];

const StatsPage: React.FC = () => {
	const navigate = useNavigate();
	const [days, setDays] = useState<StatsPeriodDays>(30);
	const { data, isLoading, isError, isFetching, refetch } = useStats(days);
	const { duelStats, rivals, loadingDuels } = useDuelStats();

	const totals = data?.totals;
	const qcm = data?.qcm;

	const level = data ? Math.floor(data.xp / XP_PER_LEVEL) + 1 : 1;
	const xpIntoLevel = data ? data.xp % XP_PER_LEVEL : 0;
	const xpProgressPct = data ? Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100) : 0;

	const activeDaysPct =
		data && data.period.days > 0
			? Math.min((data.totals.active_days / data.period.days) * 100, 100)
			: 0;

	const hasDuels = !!duelStats && duelStats.total_games > 0;
	const winPct = hasDuels ? (duelStats!.wins / duelStats!.total_games) * 100 : 0;
	const drawPct = hasDuels ? (duelStats!.draws / duelStats!.total_games) * 100 : 0;
	const lossPct = hasDuels ? (duelStats!.losses / duelStats!.total_games) * 100 : 0;

	return (
		<ScreenLayout>
			<div className="st-page">
				<header className="st-header">
					<div className="st-header-text">
						<div className="st-header-chip">
							<Sparkles size={13} />
							<span>Tes statistiques</span>
						</div>
						<h1 className="st-header-title">Statistiques</h1>
					</div>
				</header>

				<div className="st-filter-row">
					<div className="st-period" role="tablist" aria-label="Période">
						{PERIODS.map((p) => (
							<button
								key={p.days}
								type="button"
								role="tab"
								aria-selected={days === p.days}
								className={`st-period-btn ${days === p.days ? "active" : ""}`}
								onClick={() => setDays(p.days)}
							>
								{p.label}
							</button>
						))}
					</div>
					{data && (
						<span className="st-period-range">
							Du {data.period.from.split("-").reverse().join("/")} au{" "}
							{data.period.to.split("-").reverse().join("/")}
						</span>
					)}
				</div>

				{isLoading && (
					<div className="st-loading">
						<div className="st-loading-spinner" />
						<p>Calcul de tes statistiques...</p>
					</div>
				)}

				{isError && (
					<div className="st-error">
						<p>Impossible de charger tes statistiques pour le moment.</p>
						<button type="button" className="st-retry" onClick={() => refetch()}>
							Réessayer
						</button>
					</div>
				)}

				{data && totals && qcm && totals.active_days === 0 && <StatsEmptyState />}

				{data && totals && qcm && totals.active_days > 0 && (
					<div className={`st-bento ${isFetching ? "is-fetching" : ""}`}>
						{/* NIVEAU & XP */}
						<section className="st-cell st-c-span2 st-theme-amber">
							<span className="st-cell-glow" aria-hidden="true" />
							<div className="st-cell-icon">
								<Zap size={20} />
							</div>
							<div className="st-level-body">
								<div className="st-level-head">
									<span className="st-cell-label">Niveau</span>
									<span className="st-level-num">{level}</span>
								</div>
								<div className="st-progress-track">
									<div className="st-progress-fill" style={{ width: `${xpProgressPct}%` }} />
								</div>
								<span className="st-cell-sub">
									{xpIntoLevel} / {XP_PER_LEVEL} XP avant le niveau {level + 1}
								</span>
								<span className="st-coins-chip">
									<Coins size={13} />
									{data.coins} coins
								</span>
							</div>
						</section>

						{/* TEMPS & ASSIDUITE */}
						<section className="st-cell st-c-span2 st-theme-teal">
							<span className="st-cell-glow" aria-hidden="true" />
							<header className="st-card-header">
								<div className="st-card-title-wrap">
									<div className="st-cell-icon">
										<Clock size={20} />
									</div>
									<h2 className="st-card-title">Temps & assiduité</h2>
								</div>
								<span className="st-streak-chip">
									<Flame size={13} />
									{data.streak} j de suite
								</span>
							</header>
							<div className="st-time-row">
								<span className="st-big-num">{formatDuration(totals.time_seconds)}</span>
							</div>
							<span className="st-cell-sub">
								{totals.active_days}/{data.period.days} jours actifs sur la période
							</span>
							<div className="st-progress-track">
								<div className="st-progress-fill" style={{ width: `${activeDaysPct}%` }} />
							</div>
						</section>

						{/* QCM */}
						<section className="st-cell st-c-span2 st-theme-violet">
							<span className="st-cell-glow" aria-hidden="true" />
							<header className="st-card-header">
								<div className="st-card-title-wrap">
									<div className="st-cell-icon">
										<Percent size={20} />
									</div>
									<h2 className="st-card-title">QCM</h2>
								</div>
								<span className="st-count">{formatPercent(qcm.avg_score_pct)}</span>
							</header>
							<div className="st-mini-grid">
								<div className="st-mini-stat">
									<span className="st-mini-stat-value">{totals.qcm_completed}</span>
									<span className="st-mini-stat-label">Terminés</span>
								</div>
								<div className="st-mini-stat">
									<span className="st-mini-stat-value">{qcm.questions_answered}</span>
									<span className="st-mini-stat-label">Questions</span>
								</div>
								<div className="st-mini-stat">
									<span className="st-mini-stat-value">{qcm.perfect}</span>
									<span className="st-mini-stat-label">Sans-faute</span>
								</div>
								<div className="st-mini-stat">
									<span className="st-mini-stat-value">{qcm.best_streak}</span>
									<span className="st-mini-stat-label">Meilleure série</span>
								</div>
							</div>
						</section>

						{/* DUELS */}
						<section className="st-cell st-c-span2 st-theme-rose">
							<span className="st-cell-glow" aria-hidden="true" />
							<header className="st-card-header">
								<div className="st-card-title-wrap">
									<div className="st-cell-icon">
										<Swords size={20} />
									</div>
									<h2 className="st-card-title">Duels</h2>
								</div>
								{hasDuels && <span className="st-count">{duelStats!.winrate}% victoires</span>}
							</header>

							{loadingDuels ? (
								<div className="st-skeleton-list">
									<span className="st-skeleton-row" />
								</div>
							) : hasDuels ? (
								<>
									<div className="st-duel-bar" title="Répartition victoires / nuls / défaites">
										<span className="st-duel-seg st-duel-win" style={{ width: `${winPct}%` }} />
										<span className="st-duel-seg st-duel-draw" style={{ width: `${drawPct}%` }} />
										<span className="st-duel-seg st-duel-loss" style={{ width: `${lossPct}%` }} />
									</div>
									<div className="st-duel-legend">
										<span><i className="st-dot-win" />{duelStats!.wins} victoires</span>
										<span><i className="st-dot-draw" />{duelStats!.draws} nuls</span>
										<span><i className="st-dot-loss" />{duelStats!.losses} défaites</span>
									</div>
									<span className="st-cell-footnote">
										{totals.duels_perfect} sans-faute · historique complet
									</span>
								</>
							) : (
								<p className="st-empty-inline">Aucun duel joué pour l'instant.</p>
							)}

							<button type="button" className="st-link-btn" onClick={() => navigate("/duels")}>
								Aller aux duels
								<ChevronRight size={14} />
							</button>
						</section>

						{/* RIVALITES */}
						<section className="st-cell st-c-span2 st-c-row2 st-theme-rose">
							<span className="st-cell-glow" aria-hidden="true" />
							<header className="st-card-header">
								<div className="st-card-title-wrap">
									<div className="st-cell-icon">
										<Users size={20} />
									</div>
									<h2 className="st-card-title">Rivalités</h2>
								</div>
							</header>

							{loadingDuels ? (
								<div className="st-skeleton-list">
									<span className="st-skeleton-row" />
									<span className="st-skeleton-row" />
								</div>
							) : rivals.length > 0 ? (
								<ul className="st-rival-list">
									{rivals.map((opp) => (
										<li key={opp.opponent_id} className="st-rival-row">
											<span className="st-rival-name">{opp.opponent_username}</span>
											<div className="st-rival-bar-track">
												<div className="st-rival-bar-fill" style={{ width: `${opp.winrate}%` }} />
											</div>
											<span className="st-rival-pct">{opp.winrate}%</span>
										</li>
									))}
								</ul>
							) : (
								<p className="st-empty-inline">Défie des amis pour voir vos face-à-face ici.</p>
							)}
						</section>

						{/* ACTIVITE RECENTE */}
						<div className="st-c-span2 st-c-row2">
							<ActivityFeed />
						</div>

						{/* ACTIVITE (graphique) */}
						<div className="st-c-span4">
							<ChartCard
								title="Activité"
								subtitle="Temps de travail et moyenne QCM, jour par jour"
								icon={<LineChart size={18} />}
								isFetching={isFetching}
								table={<ActivityTable days={data.by_day} />}
							>
								<ActivityChart days={data.by_day} />
							</ChartCard>
						</div>

						{/* PAR MATIERE */}
						<div className="st-c-span4">
							<ChartCard
								title="Par matière"
								subtitle="De la plus travaillée à la moins travaillée"
								icon={<BarChart3 size={18} />}
								isFetching={isFetching}
								table={
									<SubjectTable
										subjects={data.by_subject}
										strengths={data.strengths}
										weaknesses={data.weaknesses}
									/>
								}
							>
								<SubjectChart
									subjects={data.by_subject}
									strengths={data.strengths}
									weaknesses={data.weaknesses}
								/>
							</ChartCard>
						</div>

						{/* SUCCES - TEASER */}
						<section className="st-cell st-c-span4 st-theme-teal">
							<span className="st-cell-glow" aria-hidden="true" />
							<header className="st-card-header">
								<div className="st-card-title-wrap">
									<div className="st-cell-icon">
										<Trophy size={20} />
									</div>
									<h2 className="st-card-title">Succès</h2>
								</div>
								<span className="st-soon-tag">Bientôt disponible</span>
							</header>
							<div className="st-achievements-row">
								{UPCOMING_ACHIEVEMENTS.map((a) => (
									<div key={a.id} className="st-achievement-chip">
										<div className="st-achievement-icon">
											<a.icon size={18} />
											<Lock size={11} className="st-achievement-lock" />
										</div>
										<span>{a.label}</span>
									</div>
								))}
								<div className="st-achievement-chip st-achievement-more">
									<Medal size={18} />
									<span>Et bien d'autres à venir</span>
								</div>
							</div>
						</section>
					</div>
				)}
			</div>
		</ScreenLayout>
	);
};

export default StatsPage;
