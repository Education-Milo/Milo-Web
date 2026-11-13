import React from "react";
import type { LucideIcon } from "lucide-react";

interface ParentEmptyStateProps {
	icon: LucideIcon;
	title: string;
	children?: React.ReactNode;
	action?: React.ReactNode;
	/** Variante compacte, à l'intérieur d'une carte */
	compact?: boolean;
}

const ParentEmptyState: React.FC<ParentEmptyStateProps> = ({ icon: Icon, title, children, action, compact }) => (
	<div className={`pa-empty${compact ? " pa-empty--compact" : ""}`}>
		<span className="pa-empty-icon" aria-hidden="true">
			<Icon size={compact ? 20 : 26} strokeWidth={2} />
		</span>
		<p className="pa-empty-title">{title}</p>
		{children && <p className="pa-empty-text">{children}</p>}
		{action && <div className="pa-empty-action">{action}</div>}
	</div>
);

export default ParentEmptyState;
