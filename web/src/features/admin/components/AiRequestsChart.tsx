import React, { useMemo, useState } from "react";
import type { DayCount } from "@features/admin/store/moderation.model";
import { fmt } from "@features/admin/components/DashboardParts";

interface AiRequestsChartProps {
	/** Toutes les requêtes IA par jour */
	daily: DayCount[];
	/** Requêtes facturées (appel au modèle), mêmes dates que `daily` */
	dailyGenerated: DayCount[];
	/** Libellé de la part non facturée (cache, éventuellement bloquées) */
	restLabel: string;
}

const formatDay = (iso: string) => {
	const [, month, day] = iso.split("-");
	return `${day}/${month}`;
};

/** Plafond « rond » de l'axe : 1, 2, 5 × 10ⁿ */
const niceCeil = (value: number) => {
	if (value <= 0) return 1;
	const magnitude = 10 ** Math.floor(Math.log10(value));
	const step = [1, 2, 5, 10].find((m) => m * magnitude >= value) ?? 10;
	return step * magnitude;
};

/**
 * Barres empilées par jour : la part facturée en pleine couleur, le reste en
 * teinte claire au-dessus. L'écart entre les deux est ce que le cache fait
 * économiser ; la lecture utile est la « marche d'escalier » dans le temps.
 */
const AiRequestsChart: React.FC<AiRequestsChartProps> = ({ daily, dailyGenerated, restLabel }) => {
	const [hovered, setHovered] = useState<number | null>(null);

	const days = useMemo(() => {
		const generatedByDate = new Map(dailyGenerated.map((d) => [d.date, d.count]));
		return daily.map((d) => {
			const generated = Math.min(generatedByDate.get(d.date) ?? 0, d.count);
			return { date: d.date, total: d.count, generated, rest: d.count - generated };
		});
	}, [daily, dailyGenerated]);

	const axisMax = niceCeil(Math.max(0, ...days.map((d) => d.total)));
	const ticks = [axisMax, axisMax / 2, 0];
	// Repères de dates : début, milieu, fin (jamais une étiquette par barre)
	const labelIndexes = new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]);
	const active = hovered !== null ? days[hovered] : null;

	return (
		<div className="ad-chart">
			<div className="ad-chart-plot">
				<div className="ad-chart-grid" aria-hidden="true">
					{ticks.map((tick) => (
						<div key={tick} className="ad-chart-gridline">
							<span className="ad-chart-tick">{fmt(tick)}</span>
						</div>
					))}
				</div>

				<div className="ad-chart-cols" onMouseLeave={() => setHovered(null)}>
					{days.map((day, index) => {
						const generatedPct = (day.generated / axisMax) * 100;
						const restPct = (day.rest / axisMax) * 100;
						return (
							<div
								key={day.date}
								className={`ad-chart-slot ${hovered === index ? "is-hovered" : ""}`}
								onMouseEnter={() => setHovered(index)}
							>
								<div className="ad-chart-col">
									{day.rest > 0 && <span className="ad-chart-seg ad-chart-seg--rest" style={{ height: `${restPct}%` }} />}
									{day.generated > 0 && (
										<span className="ad-chart-seg ad-chart-seg--generated" style={{ height: `${generatedPct}%` }} />
									)}
								</div>
								{labelIndexes.has(index) && <span className="ad-chart-xlabel">{formatDay(day.date)}</span>}
							</div>
						);
					})}
				</div>

				{active && hovered !== null && (
					<div
						className="ad-chart-tooltip"
						style={{ left: `${((hovered + 0.5) / days.length) * 100}%` }}
						role="status"
					>
						<strong>{formatDay(active.date)}</strong>
						<span><i className="ad-chart-key ad-chart-key--generated" /> Générées : {fmt(active.generated)}</span>
						<span><i className="ad-chart-key ad-chart-key--rest" /> {restLabel} : {fmt(active.rest)}</span>
						<span className="ad-muted">Total : {fmt(active.total)}</span>
					</div>
				)}
			</div>

			<details className="ad-chart-table">
				<summary>Voir les données</summary>
				<div className="ad-table-wrap ad-table-wrap--flat">
					<table className="ad-table">
						<thead>
							<tr>
								<th>Jour</th>
								<th>Générées (facturées)</th>
								<th>{restLabel}</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{days.map((day) => (
								<tr key={day.date}>
									<td>{formatDay(day.date)}</td>
									<td>{fmt(day.generated)}</td>
									<td>{fmt(day.rest)}</td>
									<td>{fmt(day.total)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
		</div>
	);
};

export default AiRequestsChart;
