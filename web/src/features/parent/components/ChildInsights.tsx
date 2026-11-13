import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, FileText, History, TrendingDown, TrendingUp } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";
import ParentEmptyState from "@features/parent/components/ParentEmptyState";
import type { ParentData, WeeklyReport } from "@features/parent/store/parent.model";
import type { ActivityItem, StatsResponse } from "@features/stats/store/stats.model";
import {
	describeActivity,
	formatDayLong,
	formatDuration,
	formatPercent,
	formatRelativeDate,
} from "@features/stats/utils/stats.format";
import { formatReportWeek } from "@features/parent/components/ReportReader";

/**
 * Repère hebdomadaire affiché face au temps de travail : environ 20 minutes
 * par jour. Valeur front tant que l'API ne porte pas d'objectif par enfant.
 */
export const WEEKLY_GOAL_SECONDS = 150 * 60;

/** "2026-11-10" → "mar." */
const weekdayShort = (isoDay: string) => {
	const [year, month, day] = isoDay.split("-").map(Number);
	return new Date(year, (month ?? 1) - 1, day ?? 1).toLocaleDateString("fr-FR", { weekday: "short" });
};

interface DataViewProps<T> {
	query: ParentData<T>;
	/** État vide quand l'API n'expose pas encore la donnée */
	unavailable: React.ReactNode;
	children: (data: T) => React.ReactNode;
}

/** Chargement, erreur, donnée absente de l'API, puis rendu. */
export function DataView<T>({ query, unavailable, children }: DataViewProps<T>) {
	if (query.isUnavailable) return <>{unavailable}</>;
	if (query.isLoading) {
		return (
			<p className="pa-muted" role="status">
				Chargement…
			</p>
		);
	}
	if (query.isError || query.data === undefined) {
		return <p className="pa-muted">Impossible de charger ces informations. Réessayez dans quelques instants.</p>;
	}
	return <>{children(query.data)}</>;
}

interface CardProps {
	childName: string;
}

// ─── Activité de la semaine ──────────────────────────────────────────────────

export const WeeklyActivityCard: React.FC<CardProps & { stats: ParentData<StatsResponse> }> = ({
	childName,
	stats,
}) => (
	<section className="pa-card pa-card--wide" aria-labelledby="pa-week-title">
		<div className="pa-card-head">
			<h2 id="pa-week-title" className="pa-card-title">
				<Clock3 size={20} aria-hidden="true" />
				Activité de la semaine
			</h2>
			<span className="pa-card-hint">7 derniers jours</span>
		</div>
		<DataView
			query={stats}
			unavailable={
				<ParentEmptyState compact icon={Clock3} title="Temps de travail bientôt disponible">
					Le temps passé par {childName} sur Milo s'affichera ici, comparé à un repère de{" "}
					{formatDuration(WEEKLY_GOAL_SECONDS)} par semaine.
				</ParentEmptyState>
			}
		>
			{(data) => {
				const spent = data.totals.time_seconds;
				const pct = Math.min(100, Math.round((spent * 100) / WEEKLY_GOAL_SECONDS));
				const maxDay = Math.max(1, ...data.by_day.map((d) => d.time_seconds));
				return (
					<div className="pa-week">
						<div className="pa-goal">
							<p className="pa-goal-figure">
								<strong>{formatDuration(spent)}</strong>
								<span> sur un repère de {formatDuration(WEEKLY_GOAL_SECONDS)}</span>
							</p>
							<div
								className="pa-goal-track"
								role="progressbar"
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={pct}
								aria-label={`Temps de travail : ${pct} % du repère hebdomadaire`}
							>
								<span className="pa-goal-fill" style={{ width: `${pct}%` }} />
							</div>
						</div>

						<dl className="pa-kpis">
							<div>
								<dt>Jours actifs</dt>
								<dd>{data.totals.active_days} / 7</dd>
							</div>
							<div>
								<dt>QCM terminés</dt>
								<dd>{data.totals.qcm_completed}</dd>
							</div>
							<div>
								<dt>Score moyen</dt>
								<dd>{formatPercent(data.qcm.avg_score_pct)}</dd>
							</div>
							<div>
								<dt>Leçons lues</dt>
								<dd>{data.totals.lessons_read}</dd>
							</div>
						</dl>

						<ol className="pa-days" aria-label="Temps de travail par jour">
							{data.by_day.map((d) => (
								<li key={d.date}>
									<span className="pa-day-bar" aria-hidden="true">
										<span style={{ height: `${Math.round((d.time_seconds * 100) / maxDay)}%` }} />
									</span>
									<span className="pa-day-label" aria-hidden="true">
										{weekdayShort(d.date)}
									</span>
									<span className="sr-only">
										{formatDayLong(d.date)} : {formatDuration(d.time_seconds)}
									</span>
								</li>
							))}
						</ol>
					</div>
				);
			}}
		</DataView>
	</section>
);

// ─── Analyse pédagogique ─────────────────────────────────────────────────────

export const SubjectInsightsCard: React.FC<CardProps & { stats: ParentData<StatsResponse> }> = ({
	childName,
	stats,
}) => (
	<section className="pa-card" aria-labelledby="pa-insights-title">
		<div className="pa-card-head">
			<h2 id="pa-insights-title" className="pa-card-title">
				<TrendingUp size={20} aria-hidden="true" />
				Analyse pédagogique
			</h2>
		</div>
		<DataView
			query={stats}
			unavailable={
				<ParentEmptyState compact icon={TrendingUp} title="Analyse bientôt disponible">
					Les matières où {childName} réussit le mieux, et celles à renforcer, apparaîtront ici d'après ses
					résultats aux QCM.
				</ParentEmptyState>
			}
		>
			{(data) => {
				const score = (subject: string) =>
					data.by_subject.find((s) => s.subject === subject)?.avg_score_pct ?? null;
				if (data.strengths.length === 0 && data.weaknesses.length === 0) {
					return (
						<p className="pa-muted">
							Pas encore assez de QCM cette semaine pour dégager des tendances : il en faut au moins deux par
							matière.
						</p>
					);
				}
				return (
					<div className="pa-insights">
						<div className="pa-insight pa-insight--ok">
							<h3 className="pa-insight-title">
								<TrendingUp size={18} aria-hidden="true" />
								Points forts
							</h3>
							{data.strengths.length > 0 ? (
								<ul>
									{data.strengths.map((subject) => (
										<li key={subject}>
											<span>{subject}</span>
											<span className="pa-insight-score">{formatPercent(score(subject))}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="pa-muted">Aucune matière au-dessus de 70 % pour l'instant.</p>
							)}
						</div>
						<div className="pa-insight pa-insight--ko">
							<h3 className="pa-insight-title">
								<TrendingDown size={18} aria-hidden="true" />
								À renforcer
							</h3>
							{data.weaknesses.length > 0 ? (
								<ul>
									{data.weaknesses.map((subject) => (
										<li key={subject}>
											<span>{subject}</span>
											<span className="pa-insight-score">{formatPercent(score(subject))}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="pa-muted">Aucune matière sous 60 %.</p>
							)}
						</div>
					</div>
				);
			}}
		</DataView>
	</section>
);

// ─── Activité récente ────────────────────────────────────────────────────────

export const RecentActivityCard: React.FC<CardProps & { activity: ParentData<ActivityItem[]> }> = ({
	childName,
	activity,
}) => (
	<section className="pa-card" aria-labelledby="pa-recent-title">
		<div className="pa-card-head">
			<h2 id="pa-recent-title" className="pa-card-title">
				<History size={20} aria-hidden="true" />
				Activité récente
			</h2>
		</div>
		<DataView
			query={activity}
			unavailable={
				<ParentEmptyState compact icon={History} title="Journal bientôt disponible">
					Les dernières leçons, QCM et duels de {childName} s'afficheront ici.
				</ParentEmptyState>
			}
		>
			{(items) =>
				items.length === 0 ? (
					<p className="pa-muted">Aucune activité ces 7 derniers jours.</p>
				) : (
					<ul className="pa-feed">
						{items.slice(0, 6).map((item) => (
							<li key={item.id}>
								<span className="pa-feed-text">{describeActivity(item)}</span>
								<span className="pa-feed-date">{formatRelativeDate(item.created_at)}</span>
							</li>
						))}
					</ul>
				)
			}
		</DataView>
		<Link to={ROUTES.PARENT.REPORTS} className="pa-card-link">
			Voir les bilans hebdomadaires
			<ArrowRight size={16} aria-hidden="true" />
		</Link>
	</section>
);

// ─── Dernier bilan ───────────────────────────────────────────────────────────

export const LatestReportCard: React.FC<CardProps & { reports: ParentData<WeeklyReport[]> }> = ({
	childName,
	reports,
}) => (
	<section className="pa-card" aria-labelledby="pa-latest-report-title">
		<div className="pa-card-head">
			<h2 id="pa-latest-report-title" className="pa-card-title">
				<FileText size={20} aria-hidden="true" />
				Bilan de la semaine
			</h2>
		</div>
		<DataView
			query={reports}
			unavailable={
				<ParentEmptyState compact icon={FileText} title="Bilans bientôt disponibles">
					Chaque semaine, Milo rédigera un bilan du travail de {childName}.
				</ParentEmptyState>
			}
		>
			{(items) => {
				const latest = items[0];
				if (!latest) return <p className="pa-muted">Aucun bilan pour l'instant.</p>;
				return (
					<div className="pa-report-preview">
						<p className="pa-report-week">{formatReportWeek(latest)}</p>
						<p className="pa-report-excerpt">{latest.text}</p>
					</div>
				);
			}}
		</DataView>
		<Link to={ROUTES.PARENT.REPORTS} className="pa-card-link">
			Tous les bilans
			<ArrowRight size={16} aria-hidden="true" />
		</Link>
	</section>
);
