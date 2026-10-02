import React from "react";

/// Petite étiquette au-dessus des titres de section (point vert = accent)
const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
	<span className={`lp-eyebrow ${className}`.trim()}>
		<span className="lp-eyebrow__dot" aria-hidden="true" />
		{children}
	</span>
);

export default Eyebrow;
