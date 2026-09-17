import React, { useMemo, useState } from "react";
import type { StatsByDay } from "@features/stats/store/stats.model";
import {
	formatDayLabel,
	formatDayLong,
	formatDuration,
	formatPercent,
	niceMax,
	toMinutes,
} from "@features/stats/utils/stats.format";

interface ActivityChartProps {
	days: StatsByDay[];
}

// Géométrie en unités de viewBox : le SVG s'étire en largeur (width 100 %).
const W = 720;
const PAD_LEFT = 52;
const PAD_RIGHT = 14;
const BARS_TOP = 16;
const BARS_BOTTOM = 156;
const BARS_H = 176;
const LINE_TOP = 14;
const LINE_BOTTOM = 96;
const LINE_H = 124;
const X_LABEL_Y = 116;
const MAX_BAR_W = 24;
const GAP = 2;

/** Rectangle à coins supérieurs arrondis (4px), carré à la base. */
const roundedTopRect = (x: number, y: number, w: number, h: number, r: number) => {
	const radius = Math.min(r, h, w / 2);
	if (radius <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
	return [
		`M${x},${y + radius}`,
		`q0,${-radius} ${radius},${-radius}`,
		`h${w - 2 * radius}`,
		`q${radius},0 ${radius},${radius}`,
		`v${h - radius}`,
		`h${-w}`,
		"Z",
	].join(" ");
};

const ActivityChart: React.FC<ActivityChartProps> = ({ days }) => {
	const [hovered, setHovered] = useState<number | null>(null);
	const n = days.length;

	const layout = useMemo(() => {
		const plotW = W - PAD_LEFT - PAD_RIGHT;
		const bandW = n > 0 ? plotW / n : plotW;
		const barW = Math.max(2, Math.min(MAX_BAR_W, bandW - GAP));
		const maxMinutes = niceMax(Math.max(0, ...days.map((d) => toMinutes(d.time_seconds))));
		const centerX = (i: number) => PAD_LEFT + i * bandW + bandW / 2;
		const barY = (seconds: number) =>
			BARS_BOTTOM - (toMinutes(seconds) / maxMinutes) * (BARS_BOTTOM - BARS_TOP);
		const lineY = (pct: number) => LINE_BOTTOM - (pct / 100) * (LINE_BOTTOM - LINE_TOP);
		const tickEvery = Math.max(1, Math.ceil(n / 6));
		const tickIndexes = days
			.map((_, i) => i)
			.filter((i) => i % tickEvery === 0 || i === n - 1);
		const maxIndex = days.reduce(
			(best, d, i) => (d.time_seconds > (days[best]?.time_seconds ?? 0) ? i : best),
			0,
		);
		// Courbe de la moyenne QCM : les jours sans QCM (null) sont ignorés,
		// la courbe relie les jours qui ont une valeur.
		const linePoints = days
			.map((d, i) => (typeof d.avg_score_pct === "number" ? { i, pct: d.avg_score_pct } : null))
			.filter((p): p is { i: number; pct: number } => p !== null);
		const linePath = linePoints
			.map((p, idx) => `${idx === 0 ? "M" : "L"}${centerX(p.i).toFixed(1)},${lineY(p.pct).toFixed(1)}`)
			.join(" ");
		return { bandW, barW, maxMinutes, centerX, barY, lineY, tickIndexes, maxIndex, linePath, hasLine: linePoints.length > 1 };
	}, [days, n]);

	if (n === 0) {
		return <p className="st-empty-inline">Aucune activité sur la période.</p>;
	}

	const { bandW, barW, maxMinutes, centerX, barY, lineY, tickIndexes, maxIndex, linePath, hasLine } = layout;
	const showMarkers = n <= 31;
	const hoveredDay = hovered !== null ? days[hovered] : null;
	const tooltipLeft = hovered !== null ? (centerX(hovered) / W) * 100 : 0;
	const tooltipAlignRight = hovered !== null && hovered > n * 0.6;
	const gridMinutes = [0, maxMinutes / 2, maxMinutes];

	return (
		<div className="st-activity-chart">
			{/* Panneau 1 : temps par jour */}
			<div className="st-chart-panel">
				<div className="st-panel-title">Temps de travail par jour</div>
				<svg viewBox={`0 0 ${W} ${BARS_H}`} className="st-svg" role="img" aria-label="Temps de travail par jour">
					{gridMinutes.map((m) => {
						const y = barY(m * 60);
						return (
							<g key={m}>
								<line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y} y2={y} className="st-grid" />
								<text x={PAD_LEFT - 8} y={y + 4} className="st-axis-text" textAnchor="end">
									{m === 0 ? "0" : formatDuration(m * 60)}
								</text>
							</g>
						);
					})}
					{days.map((d, i) => {
						const y = barY(d.time_seconds);
						const h = BARS_BOTTOM - y;
						if (h <= 0) return null;
						return (
							<path
								key={d.date}
								d={roundedTopRect(centerX(i) - barW / 2, y, barW, h, 4)}
								className={`st-bar ${hovered === i ? "is-hovered" : ""}`}
							/>
						);
					})}
					{days[maxIndex]?.time_seconds > 0 && (
						<text
							x={centerX(maxIndex)}
							y={barY(days[maxIndex].time_seconds) - 6}
							className="st-direct-label"
							textAnchor="middle"
						>
							{formatDuration(days[maxIndex].time_seconds)}
						</text>
					)}
					{hovered !== null && (
						<line
							x1={centerX(hovered)}
							x2={centerX(hovered)}
							y1={BARS_TOP}
							y2={BARS_BOTTOM}
							className="st-crosshair"
						/>
					)}
					<line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={BARS_BOTTOM} y2={BARS_BOTTOM} className="st-axis" />
					{/* Zones de survol : toute la bande verticale du jour */}
					{days.map((d, i) => (
						<rect
							key={`hit-${d.date}`}
							x={PAD_LEFT + i * bandW}
							y={0}
							width={bandW}
							height={BARS_H}
							className="st-hit"
							onMouseEnter={() => setHovered(i)}
							onMouseLeave={() => setHovered(null)}
							onFocus={() => setHovered(i)}
							onBlur={() => setHovered(null)}
							tabIndex={0}
							aria-label={`${formatDayLong(d.date)} : ${formatDuration(d.time_seconds)}`}
						/>
					))}
				</svg>
			</div>

			{/* Panneau 2 : moyenne QCM du jour (même axe des jours) */}
			<div className="st-chart-panel">
				<div className="st-panel-title">Moyenne QCM du jour</div>
				<svg viewBox={`0 0 ${W} ${LINE_H}`} className="st-svg" role="img" aria-label="Moyenne QCM par jour">
					{[0, 50, 100].map((pct) => {
						const y = lineY(pct);
						return (
							<g key={pct}>
								<line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={y} y2={y} className="st-grid" />
								<text x={PAD_LEFT - 8} y={y + 4} className="st-axis-text" textAnchor="end">
									{pct} %
								</text>
							</g>
						);
					})}
					{hasLine && <path d={linePath} className="st-line" />}
					{days.map((d, i) => {
						if (typeof d.avg_score_pct !== "number") return null;
						if (!showMarkers && hovered !== i) return null;
						return (
							<circle
								key={d.date}
								cx={centerX(i)}
								cy={lineY(d.avg_score_pct)}
								r={hovered === i ? 5 : 4}
								className="st-marker"
							/>
						);
					})}
					{hovered !== null && (
						<line
							x1={centerX(hovered)}
							x2={centerX(hovered)}
							y1={LINE_TOP}
							y2={LINE_BOTTOM}
							className="st-crosshair"
						/>
					)}
					{tickIndexes.map((i) => (
						<text
							key={days[i].date}
							x={centerX(i)}
							y={X_LABEL_Y}
							className="st-axis-text"
							textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"}
						>
							{formatDayLabel(days[i].date)}
						</text>
					))}
					{days.map((d, i) => (
						<rect
							key={`hit-${d.date}`}
							x={PAD_LEFT + i * bandW}
							y={0}
							width={bandW}
							height={LINE_H}
							className="st-hit"
							onMouseEnter={() => setHovered(i)}
							onMouseLeave={() => setHovered(null)}
						/>
					))}
				</svg>
			</div>

			{hoveredDay && (
				<div
					className={`st-tooltip ${tooltipAlignRight ? "align-right" : ""}`}
					style={{ left: `${tooltipLeft}%` }}
					role="status"
				>
					<div className="st-tooltip-title">{formatDayLong(hoveredDay.date)}</div>
					<div className="st-tooltip-row">
						<span className="st-key st-key--time" />
						<strong>{formatDuration(hoveredDay.time_seconds)}</strong>
						<span>de travail</span>
					</div>
					<div className="st-tooltip-row">
						<span className="st-key st-key--score" />
						<strong>{formatPercent(hoveredDay.avg_score_pct)}</strong>
						<span>
							{hoveredDay.qcm_attempts > 0
								? `sur ${hoveredDay.qcm_attempts} QCM`
								: "aucun QCM"}
						</span>
					</div>
					<div className="st-tooltip-row st-tooltip-muted">
						{hoveredDay.activities} action{hoveredDay.activities > 1 ? "s" : ""}
					</div>
				</div>
			)}
		</div>
	);
};

export const ActivityTable: React.FC<ActivityChartProps> = ({ days }) => (
	<table className="st-table">
		<thead>
			<tr>
				<th>Jour</th>
				<th>Temps</th>
				<th>Actions</th>
				<th>QCM</th>
				<th>Moyenne</th>
			</tr>
		</thead>
		<tbody>
			{[...days].reverse().map((d) => (
				<tr key={d.date}>
					<td>{formatDayLabel(d.date)}</td>
					<td>{formatDuration(d.time_seconds)}</td>
					<td>{d.activities}</td>
					<td>{d.qcm_attempts}</td>
					<td>{formatPercent(d.avg_score_pct)}</td>
				</tr>
			))}
		</tbody>
	</table>
);

export default ActivityChart;
