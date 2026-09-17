import React, { useState } from "react";
import { BookOpenText, ClipboardCheck, Swords, Trophy } from "lucide-react";
import { usePerformances } from "@features/stats/store/stats.queries";
import type { PerformanceKind } from "@features/stats/store/stats.model";
import {
	KIND_LABELS,
	formatDuration,
	formatRelativeDate,
} from "@features/stats/utils/stats.format";

interface RecentResultsProps {
	days: number;
	subjects: string[];
}

const KIND_ICONS: Record<PerformanceKind, React.ReactNode> = {
	qcm: <ClipboardCheck size={18} />,
	exercise: <BookOpenText size={18} />,
	duel: <Swords size={18} />,
};

const RecentResults: React.FC<RecentResultsProps> = ({ days, subjects }) => {
	const [subject, setSubject] = useState<string>("");
	const [kind, setKind] = useState<PerformanceKind | "">("");

	const { data: results = [], isLoading, isFetching, isError } = usePerformances({
		days,
		limit: 10,
		...(subject ? { subject } : {}),
		...(kind ? { kind } : {}),
	});

	return (
		<section className="st-card st-results">
			<header className="st-card-header">
				<div className="st-card-title-wrap">
					<div className="st-card-icon"><Trophy size={18} /></div>
					<div>
						<h2 className="st-card-title">Derniers résultats</h2>
						<p className="st-card-subtitle">Tes 10 derniers scores</p>
					</div>
				</div>
				<div className="st-filters">
					<select
						className="st-select"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						aria-label="Filtrer par matière"
					>
						<option value="">Toutes les matières</option>
						{subjects.map((s) => (
							<option key={s} value={s}>{s}</option>
						))}
					</select>
					<select
						className="st-select"
						value={kind}
						onChange={(e) => setKind(e.target.value as PerformanceKind | "")}
						aria-label="Filtrer par type"
					>
						<option value="">Tous les types</option>
						<option value="qcm">QCM</option>
						<option value="exercise">Exercices</option>
						<option value="duel">Duels</option>
					</select>
				</div>
			</header>

			<div className={`st-card-body ${isFetching ? "is-fetching" : ""}`}>
				{isLoading && <p className="st-empty-inline">Chargement...</p>}
				{isError && <p className="st-empty-inline">Impossible de charger tes résultats.</p>}
				{!isLoading && !isError && results.length === 0 && (
					<p className="st-empty-inline">Aucun résultat sur cette période.</p>
				)}
				<ul className="st-result-list">
					{results.map((r) => {
						const pct = r.max_score > 0 ? Math.round((r.score / r.max_score) * 100) : 0;
						const title = r.lesson ?? r.subject ?? KIND_LABELS[r.kind] ?? r.kind;
						return (
							<li key={r.id} className="st-result-row">
								<div className={`st-result-icon st-result-icon--${r.kind}`}>
									{KIND_ICONS[r.kind] ?? <ClipboardCheck size={18} />}
								</div>
								<div className="st-result-body">
									<div className="st-result-top">
										<span className="st-result-title">{title}</span>
										<span className="st-result-score">
											{r.score}/{r.max_score}
										</span>
									</div>
									<div className="st-result-meter" aria-hidden="true">
										<div className="st-result-meter-fill" style={{ width: `${pct}%` }} />
									</div>
									<div className="st-result-meta">
										<span>{KIND_LABELS[r.kind] ?? r.kind}</span>
										{r.subject && r.lesson && <span>· {r.subject}</span>}
										{r.best_streak > 0 && <span>· série {r.best_streak}</span>}
										{r.duration_seconds > 0 && <span>· {formatDuration(r.duration_seconds)}</span>}
										<span className="st-result-date">{formatRelativeDate(r.created_at)}</span>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
};

export default RecentResults;
