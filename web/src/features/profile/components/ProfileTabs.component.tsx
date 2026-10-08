import React, { useEffect, useRef } from "react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";

export interface ProfileTab<T extends string> {
	id: T;
	label: string;
	icon: Emoji3DName;
	/** Pastille d'attention (ex. modifications non enregistrées) */
	hasDot?: boolean;
}

interface ProfileTabsProps<T extends string> {
	tabs: ProfileTab<T>[];
	active: T;
	onChange: (id: T) => void;
}

/// Sous-menus du profil, à l'horizontale sous le hero. Onglets ARIA :
/// flèches gauche/droite, Début et Fin pour passer d'un onglet à l'autre.
const ProfileTabs = <T extends string>({ tabs, active, onChange }: ProfileTabsProps<T>) => {
	const listRef = useRef<HTMLDivElement>(null);
	const refs = useRef<(HTMLButtonElement | null)[]>([]);

	// Sur mobile la rangée défile : on y ramène l'onglet actif, sans faire
	// défiler la page (scrollIntoView bougerait aussi la verticale)
	const activeIndex = tabs.findIndex((tab) => tab.id === active);
	useEffect(() => {
		const list = listRef.current;
		const button = refs.current[activeIndex];
		if (!list || !button || list.scrollWidth <= list.clientWidth) return;
		const left = button.offsetLeft - (list.clientWidth - button.offsetWidth) / 2;
		list.scrollTo({ left, behavior: "smooth" });
	}, [activeIndex]);

	const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
		const last = tabs.length - 1;
		const keyToIndex: Record<string, number> = {
			ArrowRight: index === last ? 0 : index + 1,
			ArrowLeft: index === 0 ? last : index - 1,
			Home: 0,
			End: last,
		};
		const next = keyToIndex[e.key];
		if (next === undefined) return;
		e.preventDefault();
		onChange(tabs[next].id);
		refs.current[next]?.focus();
	};

	return (
		<div className="pf-tabs" role="tablist" aria-label="Sections du profil" ref={listRef}>
			{tabs.map((tab, i) => {
				const isActive = tab.id === active;
				return (
					<button
						key={tab.id}
						ref={(el) => {
							refs.current[i] = el;
						}}
						type="button"
						role="tab"
						id={`pf-tab-${tab.id}`}
						aria-selected={isActive}
						aria-controls={`pf-panel-${tab.id}`}
						tabIndex={isActive ? 0 : -1}
						className={`pf-tab ${isActive ? "is-active" : ""}`}
						onClick={() => onChange(tab.id)}
						onKeyDown={(e) => handleKeyDown(e, i)}
					>
						<span className="pf-tab-icon" aria-hidden="true">
							<Emoji3D name={tab.icon} loading="eager" />
						</span>
						{tab.label}
						{tab.hasDot && (
							<span className="pf-tab-dot" title="Modifications non enregistrées">
								<span className="pf-sr-only">(modifications non enregistrées)</span>
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
};

export default ProfileTabs;
