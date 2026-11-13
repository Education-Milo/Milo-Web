import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import "@shared/styles/MiloConfirm.css";

/** Milo qui lève la main avec un panneau « attention » */
export const MILO_ATTENTION_SPRITE = "/popups/milo-attention.webp";

interface MiloConfirmProps {
	isOpen: boolean;
	title: string;
	message: React.ReactNode;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	/** Illustration de Milo (par défaut : le panneau « attention ») */
	sprite?: string;
}

/**
 * Confirmation avant une action qu'on ne veut pas faire par erreur.
 * Même mise en scène que les rappels bien-être : Milo sur son soleil à
 * gauche, la question et les deux choix à droite. L'action sûre (annuler)
 * a le focus par défaut ; Échap ou un clic à côté annulent.
 */
const MiloConfirm: React.FC<MiloConfirmProps> = ({
	isOpen,
	title,
	message,
	confirmLabel,
	cancelLabel = "Annuler",
	onConfirm,
	onCancel,
	sprite = MILO_ATTENTION_SPRITE,
}) => {
	const titleId = useId();
	const bodyId = useId();
	const cancelRef = useRef<HTMLButtonElement>(null);
	const reduceMotion = useReducedMotion();
	const [spriteFailed, setSpriteFailed] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		const previous = document.activeElement as HTMLElement | null;
		cancelRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [isOpen, onCancel]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="mc-backdrop"
					onClick={onCancel}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="mc-card"
						role="alertdialog"
						aria-modal="true"
						aria-labelledby={titleId}
						aria-describedby={bodyId}
						onClick={(e) => e.stopPropagation()}
						initial={reduceMotion ? false : { y: 24, opacity: 0, scale: 0.96 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: 16, opacity: 0, scale: 0.97 }}
						transition={{ type: "spring", stiffness: 280, damping: 24 }}
					>
						<button type="button" className="mc-close" onClick={onCancel} aria-label="Fermer">
							<X size={20} aria-hidden="true" />
						</button>

						<div className="mc-scene" aria-hidden="true">
							<span className="mc-scene__sun" />
							{spriteFailed ? (
								<img src="/landing/emoji/fox.webp" alt="" className="mc-scene__fallback" draggable={false} />
							) : (
								<img
									src={sprite}
									alt=""
									className="mc-scene__milo"
									draggable={false}
									onError={() => setSpriteFailed(true)}
								/>
							)}
						</div>

						<div className="mc-content">
							<div className="mc-titles">
								<h2 id={titleId} className="mc-title">{title}</h2>
								<div id={bodyId} className="mc-body">{message}</div>
							</div>
							<div className="mc-actions">
								<button ref={cancelRef} type="button" className="mc-btn mc-btn--ghost" onClick={onCancel}>
									{cancelLabel}
								</button>
								<button type="button" className="mc-btn mc-btn--primary" onClick={onConfirm}>
									{confirmLabel}
								</button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default MiloConfirm;
