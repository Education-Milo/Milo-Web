import React from "react";

export const fmt = (n: number) => n.toLocaleString("fr-FR");

const formatSeconds = (ms: number) => `${(ms / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s`;

/**
 * Temps de réponse lisible à partir de p50 / p95. Identiques quand trop peu
 * de requêtes sont mesurées : un seul temps suffit alors.
 */
export const formatLatency = (latency: { p50: number; p95: number } | null) => {
	if (!latency) return "temps de réponse non mesuré";
	const typical = formatSeconds(latency.p50);
	const slowest = formatSeconds(latency.p95);
	return typical === slowest
		? `réponse en ${typical}`
		: `réponse en ${typical} en général, ${slowest} au plus lent`;
};

/** Chiffre clé : libellé, valeur, précision. `tone` réservé à un état anormal. */
export const Tile: React.FC<{
	icon: React.ReactNode;
	label: string;
	value: string;
	hint?: string;
	/** "critical" : seule tuile rouge de la page, pour qu'elle se remarque */
	tone?: "critical";
}> = ({ icon, label, value, hint, tone }) => (
	<div className={`ad-tile ${tone ? `ad-tile--${tone}` : ""}`}>
		<div className="ad-tile-icon">{icon}</div>
		<div className="ad-tile-body">
			<span className="ad-tile-label">{label}</span>
			<span className="ad-tile-value">{value}</span>
			{hint && <span className="ad-tile-hint">{hint}</span>}
		</div>
	</div>
);

/** Barres horizontales, une seule teinte, valeur écrite au bout de chaque barre. */
export const BarList: React.FC<{
	rows: { key?: string; label: string; value: number; note?: string }[];
	unit?: string;
}> = ({ rows, unit = "" }) => {
	const max = Math.max(1, ...rows.map((r) => r.value));
	return (
		<ul className="ad-barlist">
			{rows.map((row) => (
				<li key={row.key ?? row.label} className="ad-barlist-row" title={`${row.label} : ${fmt(row.value)}${unit}`}>
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
