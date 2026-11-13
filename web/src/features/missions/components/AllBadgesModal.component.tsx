import React, { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { MonthlyBadge } from "@shared/types/missions";
import MonthBadge from "@features/missions/components/MonthBadge.component";

interface AllBadgesModalProps {
	isOpen: boolean;
	badges: MonthlyBadge[];
	earned: number;
	year: number;
	onClose: () => void;
	/** Ouvre la fiche d'un badge (elle s'affiche par-dessus) */
	onOpenBadge: (badge: MonthlyBadge) => void;
}

/** Toute la collection de l'année en grand, depuis « Voir tous les badges » */
const AllBadgesModal: React.FC<AllBadgesModalProps> = ({ isOpen, badges, earned, year, onClose, onOpenBadge }) => {
	const reduceMotion = useReducedMotion();
	const titleId = useId();
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const previous = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			// La fiche d'un badge, ouverte par-dessus, gère son propre Échap
			if (e.key === "Escape" && !document.querySelector(".mp-modal")) onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div className="mp-all-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<motion.div
						className="mp-all"
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						onClick={(e) => e.stopPropagation()}
						initial={reduceMotion ? false : { y: 24, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 16, opacity: 0 }}
						transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					>
						<header className="mp-all__head">
							<div className="mp-all__titles">
								<h2 id={titleId} className="mp-all__title">Ta collection {year}</h2>
								<p className="mp-all__sub">Un badge à gagner chaque mois. Clique sur un badge pour le voir en grand.</p>
							</div>
							<span className="mp-collection-count">
								{earned}
								<small>/12</small>
							</span>
							<button ref={closeRef} type="button" className="mp-modal__close mp-all__close" onClick={onClose} aria-label="Fermer">
								<X size={20} aria-hidden="true" />
							</button>
						</header>
						<div className="mp-badges">
							{badges.map((badge, i) => (
								<MonthBadge key={badge.id} badge={badge} index={i} onOpen={onOpenBadge} calm />
							))}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AllBadgesModal;
