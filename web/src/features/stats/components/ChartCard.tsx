import React, { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";

interface ChartCardProps {
	title: string;
	icon: React.ReactNode;
	subtitle?: string;
	/** Vue tableau équivalente au graphique (toujours disponible). */
	table: React.ReactNode;
	children: React.ReactNode;
	isFetching?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

const ChartCard: React.FC<ChartCardProps> = ({
	title,
	icon,
	subtitle,
	table,
	children,
	isFetching = false,
	className = "",
	style,
}) => {
	const [showTable, setShowTable] = useState(false);

	return (
		<section className={`st-card ${className}`} style={style}>
			<header className="st-card-header">
				<div className="st-card-title-wrap">
					<div className="st-card-icon">{icon}</div>
					<div>
						<h2 className="st-card-title">{title}</h2>
						{subtitle && <p className="st-card-subtitle">{subtitle}</p>}
					</div>
				</div>
				<button
					type="button"
					className="st-view-toggle"
					onClick={() => setShowTable((v) => !v)}
					aria-pressed={showTable}
					title={showTable ? "Voir le graphique" : "Voir en tableau"}
				>
					{showTable ? <BarChart3 size={15} /> : <Table2 size={15} />}
					<span>{showTable ? "Graphique" : "Tableau"}</span>
				</button>
			</header>
			<div className={`st-card-body ${isFetching ? "is-fetching" : ""}`}>
				{showTable ? <div className="st-table-wrap">{table}</div> : children}
			</div>
		</section>
	);
};

export default ChartCard;
