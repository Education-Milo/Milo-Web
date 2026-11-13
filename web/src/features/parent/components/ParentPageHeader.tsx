import React from "react";

interface ParentPageHeaderProps {
	eyebrow: string;
	title: string;
	lead?: React.ReactNode;
	actions?: React.ReactNode;
}

/** En-tête des pages parent : seul titre en Luckiest Guy de l'écran (règle h1 de brand.css). */
const ParentPageHeader: React.FC<ParentPageHeaderProps> = ({ eyebrow, title, lead, actions }) => (
	<header className="pa-header">
		<div className="pa-header-text">
			<p className="pa-eyebrow">{eyebrow}</p>
			<h1 className="pa-title">{title}</h1>
			{lead && <p className="pa-lead">{lead}</p>}
		</div>
		{actions && <div className="pa-header-actions">{actions}</div>}
	</header>
);

export default ParentPageHeader;
