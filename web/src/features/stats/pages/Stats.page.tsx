import React, { useState } from "react";
import {
	BarChart3,
	BookOpenText,
	CalendarDays,
	CheckCircle2,
	Clock,
	Coins,
	Flame,
	HelpCircle,
	LineChart,
	Percent,
	Sparkles,
	Star,
	Swords,
	Target,
	TrendingUp,
	Zap,
} from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import ChartCard from "@features/stats/components/ChartCard";
import StatTile from "@features/stats/components/StatTile";
import ActivityChart, { ActivityTable } from "@features/stats/components/ActivityChart";
import SubjectChart, { SubjectTable } from "@features/stats/components/SubjectChart";
import RecentResults from "@features/stats/components/RecentResults";
import ActivityFeed from "@features/stats/components/ActivityFeed";
import StatsEmptyState from "@features/stats/components/StatsEmptyState";
import { useStats } from "@features/stats/store/stats.queries";
import type { StatsPeriodDays } from "@features/stats/store/stats.model";
import { formatDuration, formatPercent } from "@features/stats/utils/stats.format";
import "@features/stats/styles/Stats.css";

const PERIODS: { days: StatsPeriodDays; label: string }[] = [
	{ days: 7, label: "7 jours" },
	{ days: 30, label: "30 jours" },
	{ days: 90, label: "90 jours" },
];

const StatsPage: React.FC = () => {
	const [days, setDays] = useState<StatsPeriodDays>(30);
	const { data, isLoading, isError, isFetching, refetch } = useStats(days);

	const totals = data?.totals;
	const qcm = data?.qcm;
	const winRate =
		totals && totals.duels_played > 0
			? Math.round((totals.duels_won / totals.duels_played) * 100)
			: null;

	return (
		<ScreenLayout>
			<div className="st-page">
				{/* --- HERO --- */}
				<section className="st-hero">
					<div className="st-hero-halo" aria-hidden="true" />
					<div className="st-hero-center">
						<div className="st-hero-chip">
							<Sparkles size={14} />
							<span>Tes progrès</span>
						</div>
						<h1 className="st-hero-title">Statistiques</h1>
						<p className="st-hero-sub">
							Ton temps de travail, tes scores et tes matières, sur la période de ton choix.
						</p>
					</div>
					{data && (
						<div className="st-hero-stats">
							<div className="st-hero-stat st-hero-stat--streak" title="Jours consécutifs d'activité">
								<Flame size={16} />
								<span>{data.streak} jour{data.streak > 1 ? "s" : ""} de suite</span>
							</div>
							<div className="st-hero-stat st-hero-stat--xp" title="Points d'expérience">
								<Zap size={16} />
								<span>{data.xp} XP</span>
							</div>
							<div className="st-hero-stat st-hero-stat--coins" title="Miloro coins">
								<Coins size={16} />
								<span>{data.coins} coins</span>
							</div>
							<div className="st-hero-stat" title="Temps de travail sur la période">
								<Clock size={16} />
								<span>{formatDuration(data.totals.time_seconds)}</span>
							</div>
							<div className="st-hero-stat" title="Jours avec au moins une action">
								<CalendarDays size={16} />
								<span>
									{data.totals.active_days}/{data.period.days} jours actifs
								</span>
							</div>
						</div>
					)}
				</section>

				{/* --- FILTRE PÉRIODE (au-dessus de tout ce qu'il pilote) --- */}
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
					<>
						{/* --- TUILES --- */}
						<div className={`st-tiles ${isFetching ? "is-fetching" : ""}`}>
							<StatTile
								icon={<CheckCircle2 size={20} />}
								label="QCM terminés"
								value={totals.qcm_completed}
								hint={`${qcm.questions_answered} question${qcm.questions_answered > 1 ? "s" : ""} répondue${qcm.questions_answered > 1 ? "s" : ""}`}
							/>
							<StatTile
								icon={<Percent size={20} />}
								label="Moyenne QCM"
								value={formatPercent(qcm.avg_score_pct)}
								hint={qcm.attempts > 0 ? `sur ${qcm.attempts} QCM` : "aucun QCM"}
							/>
							<StatTile
								icon={<Star size={20} />}
								label="Sans-faute"
								value={qcm.perfect}
								hint="QCM à 100 %"
							/>
							<StatTile
								icon={<TrendingUp size={20} />}
								label="Meilleure série"
								value={qcm.best_streak}
								hint="bonnes réponses d'affilée"
							/>
							<StatTile
								icon={<Swords size={20} />}
								label="Duels"
								value={`${totals.duels_won}/${totals.duels_played}`}
								hint={winRate !== null ? `${winRate} % de victoires` : "aucun duel"}
							/>
							<StatTile
								icon={<BookOpenText size={20} />}
								label="Cours lus"
								value={totals.lessons_read}
								hint={`${totals.questions_asked} question${totals.questions_asked > 1 ? "s" : ""} posée${totals.questions_asked > 1 ? "s" : ""}`}
							/>
							<StatTile
								icon={<Target size={20} />}
								label="Missions terminées"
								value={totals.missions_completed}
								hint="sur la période"
							/>
							<StatTile
								icon={<HelpCircle size={20} />}
								label="Cours importés"
								value={totals.courses_scanned}
								hint={`${totals.chat_messages} message${totals.chat_messages > 1 ? "s" : ""} à Milo`}
							/>
						</div>

						{/* --- GRAPHIQUES --- */}
						<ChartCard
							title="Activité"
							subtitle="Temps de travail et moyenne QCM, jour par jour"
							icon={<LineChart size={18} />}
							isFetching={isFetching}
							table={<ActivityTable days={data.by_day} />}
						>
							<ActivityChart days={data.by_day} />
						</ChartCard>

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

						{/* --- LISTES --- */}
						<div className="st-lists">
							<RecentResults days={days} subjects={data.by_subject.map((s) => s.subject)} />
							<ActivityFeed />
						</div>
					</>
				)}
			</div>
		</ScreenLayout>
	);
};

export default StatsPage;
