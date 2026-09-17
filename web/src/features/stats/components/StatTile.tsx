import React from "react";

interface StatTileProps {
	label: string;
	value: string | number;
	hint?: string;
	icon: React.ReactNode;
	style?: React.CSSProperties;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, hint, icon, style }) => (
	<div className="st-tile" style={style}>
		<div className="st-tile-icon">{icon}</div>
		<div className="st-tile-body">
			<span className="st-tile-label">{label}</span>
			<span className="st-tile-value">{value}</span>
			{hint && <span className="st-tile-hint">{hint}</span>}
		</div>
	</div>
);

export default StatTile;
