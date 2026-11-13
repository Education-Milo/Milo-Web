import React, { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { MonthlyBadge } from "@shared/types/missions";
import { BADGE_STORIES } from "@features/missions/utils/monthlyBadges";

interface BadgeModalProps {
	badge: MonthlyBadge | null;
	onClose: () => void;
	questsLeft: number;
}

const statusSentence = (badge: MonthlyBadge, questsLeft: number) => {
	switch (badge.status) {
		case "earned":
			return `Tu l'as gagné en ${badge.month.toLowerCase()} ${badge.year}. Bravo !`;
		case "missed":
			return "Celui-ci t'a échappé. Il reviendra peut-être l'an prochain.";
		case "in-progress":
			return `Encore ${questsLeft} quête${questsLeft > 1 ? "s" : ""} ce mois-ci pour le décrocher.`;
		default:
			return `Il se débloquera en ${badge.month.toLowerCase()}. Patience…`;
	}
};

/** Fiche d'un badge : il arrive en tournant sur lui-même */
const BadgeModal: React.FC<BadgeModalProps> = ({ badge, onClose, questsLeft }) => {
	const reduceMotion = useReducedMotion();
	const titleId = useId();
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!badge) return;
		const previous = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [badge, onClose]);

	return (
		<AnimatePresence>
			{badge && (
				<motion.div className="mp-modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<motion.div
						className={`mp-modal is-${badge.status}`}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						onClick={(e) => e.stopPropagation()}
						initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.94 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: 20, opacity: 0, scale: 0.96 }}
						transition={{ type: "spring", stiffness: 260, damping: 22 }}
					>
						<button ref={closeRef} type="button" className="mp-modal__close" onClick={onClose} aria-label="Fermer">
							<X size={20} aria-hidden="true" />
						</button>
						<div className="mp-modal__scene" aria-hidden="true">
							<span className="mp-modal__sun" />
							<motion.img
								src={badge.imageUrl ?? ""}
								alt=""
								className="mp-modal__badge"
								draggable={false}
								initial={reduceMotion ? false : { rotateY: -540, scale: 0.4 }}
								animate={{ rotateY: 0, scale: 1 }}
								transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
							/>
						</div>
						<div className="mp-modal__titles">
							<h2 id={titleId} className="mp-modal__title">
								Badge {badge.month.toLowerCase()} {badge.year}
							</h2>
							<p className="mp-modal__story">{BADGE_STORIES[badge.monthIndex]}</p>
							<p className="mp-modal__status">{statusSentence(badge, questsLeft)}</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default BadgeModal;
