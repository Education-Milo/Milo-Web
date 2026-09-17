import React from "react";
import { AlertTriangle, PartyPopper, TrendingUp } from "lucide-react";
import type { StatsBySubject } from "@features/stats/store/stats.model";
import {
	formatDuration,
	formatPercent,
	formatRelativeDate,
} from "@features/stats/utils/stats.format";

interface SubjectChartProps {
	subjects: StatsBySubject[];
	strengths: string[];
	weaknesses: string[];
}

const SubjectBadge: React.FC<{ subject: string; strengths: string[]; weaknesses: string[] }> = ({
	subject,
	strengths,
	weaknesses,
}) => {
	if (strengths.includes(subject)) {
		return (
			<span className="st-badge st-badge--strong">
				<TrendingUp size={12} /> Point fort
			</span>
		);
	}
	if (weaknesses.includes(subject)) {
		return (
			<span className="st-badge st-badge--weak">
				<AlertTriangle size={12} /> À travailler
			</span>
		);
	}
	return null;
};

const SubjectChart: React.FC<SubjectChartProps> = ({ subjects, strengths, weaknesses }) => {
	if (subjects.length === 0) {
		return <p className="st-empty-inline">Aucune matière travaillée sur la période.</p>;
	}

	const maxTime = Math.max(1, ...subjects.map((s) => s.time_seconds));

	return (
		<div className="st-subjects">
			<div className="st-subjects-legend" aria-hidden="true">
				<span><i className="st-key st-key--time" /> Temps</span>
				<span><i className="st-key st-key--score" /> Moyenne QCM</span>
			</div>
			<ul className="st-subject-list">
				{subjects.map((s) => (
					<li key={s.subject} className="st-subject-row">
						<div className="st-subject-head">
							<span className="st-subject-name">{s.subject}</span>
							<SubjectBadge subject={s.subject} strengths={strengths} weaknesses={weaknesses} />
							<span className="st-subject-meta">
								{s.lessons_read} cours · {s.qcm_attempts} QCM
								{s.last_activity ? ` · ${formatRelativeDate(s.last_activity)}` : ""}
							</span>
						</div>
						<div className="st-hbar-group">
							<div className="st-hbar" title={`${formatDuration(s.time_seconds)} de travail`}>
								<div className="st-hbar-track">
									<div
										className="st-hbar-fill st-hbar-fill--time"
										style={{ width: `${(s.time_seconds / maxTime) * 100}%` }}
									/>
								</div>
								<span className="st-hbar-value">{formatDuration(s.time_seconds)}</span>
							</div>
							<div
								className="st-hbar"
								title={
									typeof s.avg_score_pct === "number"
										? `${formatPercent(s.avg_score_pct)} de moyenne sur ${s.qcm_attempts} QCM`
										: "Aucun QCM sur cette matière"
								}
							>
								<div className="st-hbar-track">
									<div
										className="st-hbar-fill st-hbar-fill--score"
										style={{ width: `${typeof s.avg_score_pct === "number" ? s.avg_score_pct : 0}%` }}
									/>
								</div>
								<span className="st-hbar-value">{formatPercent(s.avg_score_pct)}</span>
							</div>
						</div>
					</li>
				))}
			</ul>
			{weaknesses.length === 0 && (
				<div className="st-encouragement">
					<PartyPopper size={18} />
					<span>Aucune matière en difficulté pour l'instant. Continue comme ça !</span>
				</div>
			)}
		</div>
	);
};

export const SubjectTable: React.FC<SubjectChartProps> = ({ subjects, strengths, weaknesses }) => (
	<table className="st-table">
		<thead>
			<tr>
				<th>Matière</th>
				<th>Temps</th>
				<th>Cours lus</th>
				<th>QCM</th>
				<th>Moyenne</th>
				<th>Statut</th>
			</tr>
		</thead>
		<tbody>
			{subjects.map((s) => (
				<tr key={s.subject}>
					<td>{s.subject}</td>
					<td>{formatDuration(s.time_seconds)}</td>
					<td>{s.lessons_read}</td>
					<td>{s.qcm_attempts}</td>
					<td>{formatPercent(s.avg_score_pct)}</td>
					<td>
						{strengths.includes(s.subject)
							? "Point fort"
							: weaknesses.includes(s.subject)
								? "À travailler"
								: "—"}
					</td>
				</tr>
			))}
		</tbody>
	</table>
);

export default SubjectChart;
