import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Star, X } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import { useUserStore } from "@shared/store/user/user.store";
import { canPlay } from "@shared/constants/roles";
import { ROUTES } from "@shared/constants/routes";
import { TOUR_STEPS } from "@features/onboarding/data/onboarding.data";
import { useOnboardingStore } from "@features/onboarding/store/onboarding.store";
import { useTargetRect } from "@features/onboarding/hooks/useTargetRect";
import "@shared/styles/Quiz.css";
import "@features/onboarding/styles/Onboarding.css";

const CARD_GAP = 22;
const VIEW_MARGIN = 16;
const SPOT_PAD = 8;

/** Piste d'étoiles : une étoile gagnée par étape visitée. */
const StarTrack: React.FC<{ done: number; total: number; current?: number }> = ({ done, total, current }) => (
	<div className="ob-stars" aria-hidden="true">
		{Array.from({ length: total }, (_, i) => (
			<span key={i} className={`ob-star${i < done ? " is-won" : ""}${i === current ? " is-current" : ""}`}>
				<Star size={18} strokeWidth={2.5} />
			</span>
		))}
	</div>
);

/**
 * Visite guidée de l'école de Milo, en 5 étapes. Montée une seule fois dans
 * l'application connectée : elle ouvre la bonne page, met en lumière l'entrée
 * de la sidebar correspondante et affiche la carte de Milo.
 * Elle envoie aussi un compte tout juste créé en classe (/bienvenue).
 */
const OnboardingTour: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const reduceMotion = useReducedMotion();
	const user = useUserStore((s) => s.user);
	const { phase, step, isTest, next, previous, skip, finish, startClassroom, isPending, isDone } = useOnboardingStore();
	const current = phase === "tour" ? TOUR_STEPS[step] : null;
	const rect = useTargetRect(current ? `[data-tour="${current.target}"]` : null);
	const cardRef = useRef<HTMLDivElement>(null);
	const primaryRef = useRef<HTMLButtonElement>(null);
	const [cardPos, setCardPos] = useState<{ top: number; left: number; arrow: number } | null>(null);

	// Compte tout juste créé : première arrivée sur l'accueil → direction la classe
	useEffect(() => {
		if (phase !== "off" || !canPlay(user?.role)) return;
		if (location.pathname !== ROUTES.HOME) return;
		if (!isPending() || isDone(user?.id)) return;
		startClassroom({ isTest: false, userId: user?.id ?? null });
		navigate(ROUTES.ONBOARDING, { replace: true });
	}, [phase, user?.role, user?.id, location.pathname, isPending, isDone, startClassroom, navigate]);

	// La visite ouvre la page de l'étape en cours
	useEffect(() => {
		if (current && location.pathname !== current.route) navigate(current.route);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [current?.route]);

	// Placement de la carte : à droite de l'entrée ciblée, sinon en bas au centre
	useLayoutEffect(() => {
		const card = cardRef.current;
		if (!card || !rect) {
			setCardPos(null);
			return;
		}
		const { offsetWidth: w, offsetHeight: h } = card;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		let left = rect.left + rect.width + CARD_GAP;
		if (left + w > vw - VIEW_MARGIN) {
			setCardPos(null);
			return;
		}
		left = Math.max(VIEW_MARGIN, left);
		const top = Math.min(Math.max(VIEW_MARGIN, rect.top + rect.height / 2 - h / 2), vh - h - VIEW_MARGIN);
		// La flèche pointe le centre de l'entrée, même quand la carte est calée au bord
		const arrow = Math.min(Math.max(rect.top + rect.height / 2 - top, 28), h - 28);
		setCardPos({ top, left, arrow });
	}, [rect, step]);

	// Focus sur l'action principale à chaque étape, clavier ← → Échap
	useEffect(() => {
		if (phase !== "tour" && phase !== "finale") return;
		primaryRef.current?.focus({ preventScroll: true });
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				skip();
			} else if (phase === "tour" && e.key === "ArrowRight") {
				e.preventDefault();
				next();
			} else if (phase === "tour" && e.key === "ArrowLeft") {
				e.preventDefault();
				previous();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [phase, step, next, previous, skip]);

	const endTo = (path: string) => {
		finish();
		navigate(path);
	};

	if (phase !== "tour" && phase !== "finale") return null;

	/* ---------- Célébration finale ---------- */
	if (phase === "finale") {
		return (
			<div key="finale" className="ob-layer ob-layer--dim">
				<ConfettiBurst fixed count={reduceMotion ? 0 : 90} originX={50} originY={35} />
				<motion.div
					className="ob-finale"
					role="dialog"
					aria-modal="true"
					aria-labelledby="ob-finale-title"
					initial={{ opacity: 0, scale: 0.8, y: 30 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					transition={{ type: "spring", stiffness: 260, damping: 18 }}
				>
					<div className="ob-finale-sun" aria-hidden="true">
						<img src="/landing/emoji/fox.webp" alt="" className="ob-finale-milo" />
						<Emoji3D name="trophy" className="ob-finale-badge" />
					</div>
					<h2 id="ob-finale-title" className="ob-finale-title">Bien joué{user?.first_name ? `, ${user.first_name}` : ""} !</h2>
					<StarTrack done={TOUR_STEPS.length} total={TOUR_STEPS.length} />
					<p className="ob-finale-text">
						Tu connais l'école de Milo. Ta première mission : choisis une leçon et viens me retrouver en classe.
					</p>
					<div className="ob-finale-actions">
						{isTest ? (
							<button ref={primaryRef} type="button" className="ob-btn ob-btn--cream" onClick={() => endTo(ROUTES.ADMIN.ONBOARDING)}>
								Retour au panel admin <ArrowRight size={18} aria-hidden="true" />
							</button>
						) : (
							<button ref={primaryRef} type="button" className="ob-btn ob-btn--cream" onClick={() => endTo(ROUTES.COURSES)}>
								Ma première leçon <ArrowRight size={18} aria-hidden="true" />
							</button>
						)}
						<button type="button" className="ob-link" onClick={() => endTo(ROUTES.HOME)}>
							Aller à l'accueil
						</button>
					</div>
				</motion.div>
			</div>
		);
	}

	/* ---------- Étape de la visite ---------- */
	const s = current!;
	const isLast = step === TOUR_STEPS.length - 1;
	const spot = rect
		? {
				top: rect.top - SPOT_PAD,
				left: rect.left - SPOT_PAD,
				width: rect.width + SPOT_PAD * 2,
				height: rect.height + SPOT_PAD * 2,
			}
		: null;

	return (
		<div key="tour" className="ob-layer">
			{/* Voile qui bloque les clics, troué autour de l'entrée ciblée */}
			<div className={`ob-veil${spot ? "" : " is-full"}`} aria-hidden="true" />
			{/* Div simple + transition CSS : un motion.div ici laissait ses styles animés à la carte finale */}
			{spot && <div className="ob-spot" aria-hidden="true" style={spot} />}

			<AnimatePresence mode="wait">
				<motion.div
					key={s.id}
					ref={cardRef}
					className={`ob-card${cardPos ? " is-anchored" : " is-docked"}`}
					style={cardPos ? { top: cardPos.top, left: cardPos.left } : undefined}
					role="dialog"
					aria-modal="true"
					aria-labelledby="ob-card-title"
					aria-describedby="ob-card-text"
					initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, x: cardPos ? -16 : 0, y: cardPos ? 0 : 24 }}
					animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ type: "spring", stiffness: 340, damping: 24 }}
				>
					{cardPos && <span className="ob-card-arrow" style={{ top: cardPos.arrow }} aria-hidden="true" />}
					<button type="button" className="ob-card-close" onClick={skip} aria-label="Passer la visite">
						<X size={18} aria-hidden="true" />
					</button>

					<div className="ob-card-head">
						<span className="sr-only">Étape {step + 1} sur {TOUR_STEPS.length}</span>
						<StarTrack done={step} total={TOUR_STEPS.length} current={step} />
					</div>

					<div className="ob-card-main">
						<div className="ob-card-icon" aria-hidden="true">
							<Emoji3D name={s.icon} />
						</div>
						<div>
							<h2 id="ob-card-title" className="ob-card-title">{s.title}</h2>
							<p id="ob-card-text" className="ob-card-text">{s.text}</p>
						</div>
					</div>

					<p className="ob-card-tip">
						<Emoji3D name="light_bulb" aria-hidden="true" /> {s.tip}
					</p>

					<div className="ob-card-actions">
						<button type="button" className="ob-btn ob-btn--ghost ob-btn--sm" onClick={previous} disabled={step === 0}>
							<ArrowLeft size={16} aria-hidden="true" /> Retour
						</button>
						<button ref={primaryRef} type="button" className="ob-btn ob-btn--primary ob-btn--sm" onClick={next}>
							{isLast ? "Terminer" : "Suivant"} <ArrowRight size={18} aria-hidden="true" />
						</button>
					</div>

				</motion.div>
			</AnimatePresence>
		</div>
	);
};

export default OnboardingTour;
