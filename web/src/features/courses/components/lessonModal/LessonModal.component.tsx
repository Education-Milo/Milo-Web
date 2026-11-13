import React, { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";
import type { LessonWithStatus } from "@features/courses/store/course.model";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import "./LessonModal.component.css";

interface LessonModalProps {
	lesson: LessonWithStatus | null;
	onClose: () => void;
}

interface Choice {
	id: "qcm" | "cours";
	title: string;
	desc: string;
	cta: string;
	image: string;
	badge: Emoji3DName;
	tips: { icon: Emoji3DName; text: string }[];
}

const CHOICES: Choice[] = [
	{
		id: "qcm",
		title: "QCM",
		desc: "Teste ce que tu sais déjà, question après question.",
		cta: "Lancer le QCM",
		image: "/lesson/milo-qcm.webp",
		badge: "bullseye",
		tips: [
			{ icon: "light_bulb", text: "La correction tout de suite" },
			{ icon: "high_voltage", text: "De l'XP à chaque bonne réponse" },
		],
	},
	{
		id: "cours",
		title: "Cours avec Milo",
		desc: "Milo t'explique la leçon au tableau, à ton rythme.",
		cta: "Entrer en classe",
		image: "/lesson/milo-cours.webp",
		badge: "graduation_cap",
		tips: [
			{ icon: "speech_balloon", text: "Pose-lui toutes tes questions" },
			{ icon: "card_index_dividers", text: "Garde l'essentiel dans tes notes" },
		],
	},
];

/**
 * Choix du mode de travail d'une leçon (QCM ou cours avec Milo).
 * Même mise en scène que les rappels bien-être : carte blanche à tranche
 * sable, scènes illustrées (soleil feu, aplat feu), icônes 3D, pilules
 * en relief.
 */
const LessonModal: React.FC<LessonModalProps> = ({ lesson, onClose }) => {
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const titleId = useId();
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!lesson) return;
		const previous = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [lesson, onClose]);

	const start = (id: Choice["id"]) => {
		if (!lesson) return;
		onClose();
		navigate((id === "qcm" ? ROUTES.QCM : ROUTES.COURSE_MILO).replace(":lessonId", String(lesson.id)));
	};

	return (
		<AnimatePresence>
			{lesson && (
				<motion.div
					className="lm-backdrop"
					onClick={onClose}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="lm-card"
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						onClick={(e) => e.stopPropagation()}
						initial={reduceMotion ? false : { y: 26, opacity: 0, scale: 0.96 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: 16, opacity: 0, scale: 0.97 }}
						transition={{ type: "spring", stiffness: 260, damping: 24 }}
					>
						<button ref={closeRef} type="button" className="lm-close" onClick={onClose} aria-label="Fermer">
							<X size={20} aria-hidden="true" />
						</button>

						<header className="lm-head">
							<h2 id={titleId} className="lm-title">{lesson.title}</h2>
							<p className="lm-sub">
								Comment veux-tu travailler cette leçon ?
							</p>
						</header>

						<div className="lm-choices">
							{CHOICES.map((choice) => (
								<button
									key={choice.id}
									type="button"
									className={`lm-choice lm-choice--${choice.id}`}
									onClick={() => start(choice.id)}
								>
									<span className="lm-scene" aria-hidden="true">
										<span className="lm-scene__dots" />
										<span className="lm-scene__sun" />
										<img src={choice.image} alt="" className="lm-scene__milo" draggable={false} />
										<Emoji3D name={choice.badge} className="lm-scene__badge" />
									</span>

									<span className="lm-choice__body">
										<span className="lm-choice__titles">
											<span className="lm-choice__title">{choice.title}</span>
											<span className="lm-choice__desc">{choice.desc}</span>
										</span>
										<span className="lm-tips">
											{choice.tips.map((tip) => (
												<span key={tip.text} className="lm-tip">
													<span className="lm-tip__icon"><Emoji3D name={tip.icon} /></span>
													{tip.text}
												</span>
											))}
										</span>
										<span className="lm-cta">
											{choice.cta}
											<ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />
										</span>
									</span>
								</button>
							))}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default LessonModal;
