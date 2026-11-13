import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";
import { profileInitials, profileRoleLabel, profileTone } from "@features/account/utils/profile.format";
import { useParentStore } from "@features/parent/store/parent.store";
import type { LinkedChild } from "@features/parent/store/parent.model";

export const childFullName = (child: LinkedChild) => `${child.first_name} ${child.last_name}`.trim();

interface ChildAvatarProps {
	child: LinkedChild;
	size?: "sm" | "md" | "lg";
}

/** Vignette d'un enfant : ses initiales sur une teinte stable de la charte. */
export const ChildAvatar: React.FC<ChildAvatarProps> = ({ child, size = "md" }) => (
	<span className={`pa-avatar pa-avatar--${size}`} data-tone={profileTone(child.id)} aria-hidden="true">
		{profileInitials(child)}
	</span>
);

interface ChildSwitcherProps {
	children: LinkedChild[];
	activeChild: LinkedChild | null;
}

/**
 * Bandeau des enfants suivis : choisir un enfant met à jour toutes les
 * sections de la page (et des autres pages parent).
 */
const ChildSwitcher: React.FC<ChildSwitcherProps> = ({ children, activeChild }) => {
	const selectChild = useParentStore((state) => state.selectChild);

	return (
		<section className="pa-switcher" aria-labelledby="pa-switcher-title">
			<h2 id="pa-switcher-title" className="pa-switcher-title">
				Enfant suivi
			</h2>
			<ul className="pa-switcher-list">
				{children.map((child) => {
					const isActive = child.id === activeChild?.id;
					return (
						<li key={child.id}>
							<button
								type="button"
								className="pa-child-chip"
								aria-pressed={isActive}
								onClick={() => selectChild(child.id)}
							>
								<ChildAvatar child={child} size="sm" />
								<span className="pa-child-chip-text">
									<span className="pa-child-chip-name">{childFullName(child)}</span>
									<span className="pa-child-chip-meta">{profileRoleLabel(child)}</span>
								</span>
							</button>
						</li>
					);
				})}
			</ul>
			<Link to={ROUTES.PARENT.CHILDREN} className="pa-btn pa-btn--ghost pa-btn--sm">
				<Plus size={16} aria-hidden="true" />
				Lier un compte
			</Link>
		</section>
	);
};

export default ChildSwitcher;
