import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

/// Panneau qui glisse depuis la droite de l'accueil : missions du jour (la
/// pancarte) ou actualités (la boîte aux lettres). Se ferme avec Échap, la
/// croix ou un clic à côté ; le focus revient ensuite où il était.

interface HomeSheetProps {
	open: boolean;
	onClose: () => void;
	title: string;
	icon: React.ReactNode;
	/** Contenu à droite du titre (compteur…) */
	aside?: React.ReactNode;
	children: React.ReactNode;
}

const HomeSheet: React.FC<HomeSheetProps> = ({ open, onClose, title, icon, aside, children }) => {
	const titleId = useId();
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [open, onClose]);

	if (!open) return null;
	return (
		<div className="hp-sheet-layer">
			<div className="hp-sheet-backdrop" onClick={onClose} aria-hidden="true" />
			<section className="hp-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
				<header className="hp-sheet-header">
					<div className="hp-card-title-wrap">
						<div className="hp-card-icon">{icon}</div>
						<h2 id={titleId} className="hp-card-title">
							{title}
						</h2>
					</div>
					<div className="hp-sheet-header-end">
						{aside}
						<button ref={closeRef} type="button" className="hp-sheet-close" onClick={onClose} aria-label="Fermer">
							<X size={20} strokeWidth={2.6} />
						</button>
					</div>
				</header>
				<div className="hp-sheet-body">{children}</div>
			</section>
		</div>
	);
};

export default HomeSheet;
