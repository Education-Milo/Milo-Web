import React from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";

interface ProfileCardProps {
	icon: Emoji3DName;
	title: string;
	subtitle?: string;
	/** Élément aligné à droite de l'en-tête (pastille, bouton…) */
	aside?: React.ReactNode;
	/** Classes de placement dans le bento (pf-span-2, pf-span-4…) */
	className?: string;
	children: React.ReactNode;
}

/** Cellule du bento : même en-tête et même relief pour toute la page. */
const ProfileCard: React.FC<ProfileCardProps> = ({ icon, title, subtitle, aside, className = "", children }) => (
	<section className={`pf-card ${className}`.trim()}>
		<header className="pf-card-head">
			<span className="pf-card-icon" aria-hidden="true">
				<Emoji3D name={icon} />
			</span>
			<div className="pf-card-titles">
				<h3 className="pf-card-title">{title}</h3>
				{subtitle && <p className="pf-card-sub">{subtitle}</p>}
			</div>
			{aside && <div className="pf-card-aside">{aside}</div>}
		</header>
		<div className="pf-card-body">{children}</div>
	</section>
);

export default ProfileCard;
