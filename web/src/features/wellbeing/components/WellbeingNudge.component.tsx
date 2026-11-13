import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useWellbeingStore } from "@features/wellbeing/store/wellbeing.store";
import { NUDGE_THEMES } from "@features/wellbeing/data/wellbeing.messages";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { useUserStore } from "@shared/store/user/user.store";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { canPlay } from "@shared/constants/roles";
import { ROUTES } from "@shared/constants/routes";
import "@features/wellbeing/styles/Wellbeing.css";

/** Intervalle de comptage du temps actif */
const TICK_SECONDS = 30;

const formatDuration = (seconds: number) => {
	const min = Math.max(1, Math.round(seconds / 60));
	if (min < 60) return `${min} min`;
	const h = Math.floor(min / 60);
	const rest = min % 60;
	return rest ? `${h} h ${String(rest).padStart(2, "0")}` : `${h} h`;
};

/**
 * Compte le temps passé sur Milo (onglet visible uniquement) et affiche des
 * rappels bienveillants : pause après une longue session, décrochage après
 * beaucoup de temps dans la journée, et heure du coucher le soir.
 * Les admins peuvent déclencher chaque rappel depuis /admin/bien-etre.
 */
const WellbeingNudge: React.FC = () => {
	const role = useUserStore((state) => state.user?.role);
	const firstName = useUserStore((state) => state.user?.first_name);
	const nudge = useWellbeingStore((state) => state.nudge);
	const tracking = useWellbeingStore((state) => state.tracking);
	const tick = useWellbeingStore((state) => state.tick);
	const dismiss = useWellbeingStore((state) => state.dismiss);
	const snooze = useWellbeingStore((state) => state.snooze);
	const logout = useAuthStore((state) => state.logout);
	const navigate = useNavigate();
	const primaryRef = useRef<HTMLButtonElement>(null);
	const isPlayer = canPlay(role);

	// Comptage du temps actif : seulement pour les élèves, onglet au premier plan
	useEffect(() => {
		if (!isPlayer) return;
		const id = window.setInterval(() => {
			if (!document.hidden) tick(TICK_SECONDS);
		}, TICK_SECONDS * 1000);
		return () => window.clearInterval(id);
	}, [isPlayer, tick]);

	// Focus sur l'action principale + Échap pour fermer
	useEffect(() => {
		if (!nudge) return;
		const previous = document.activeElement as HTMLElement | null;
		primaryRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") dismiss();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [nudge, dismiss]);

	if (!nudge) return null;

	const theme = NUDGE_THEMES[nudge.kind];
	const isBedtime = nudge.kind === "bedtime";
	const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

	// Chiffre mis en avant sur la scène, selon le rappel
	const stat =
		nudge.kind === "bedtime"
			? { value: now, label: "il est déjà" }
			: nudge.kind === "daily"
				? { value: formatDuration(tracking.dailySeconds), label: "sur Milo aujourd'hui" }
				: { value: formatDuration(tracking.sessionSeconds), label: "d'affilée" };

	const handlePrimary = async () => {
		dismiss();
		if (isBedtime && !nudge.isTest) {
			await logout();
			navigate(ROUTES.LOGIN, { replace: true });
		}
	};

	return (
		<div className="wb-backdrop" onClick={dismiss}>
			<div
				className={`wb-card wb-card--${nudge.kind}`}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="wb-title"
				aria-describedby="wb-body"
				onClick={(e) => e.stopPropagation()}
			>
				<button type="button" className="wb-close" onClick={dismiss} aria-label="Fermer">
					<X size={20} aria-hidden="true" />
				</button>

				{/* ---------- Scène : Milo sur son décor ---------- */}
				<div className="wb-scene" aria-hidden="true">
					<span className="wb-scene__sun" />
					<span className="wb-scene__dots" />
					{isBedtime && (
						<>
							<i className="wb-star wb-star--1" />
							<i className="wb-star wb-star--2" />
							<i className="wb-star wb-star--3" />
						</>
					)}
					<img src={theme.image} alt="" className="wb-scene__milo" draggable={false} />
					<Emoji3D name={theme.badge} className="wb-scene__badge" />
					<div className="wb-stat">
						<span className="wb-stat__label">{stat.label}</span>
						<span className="wb-stat__value">{stat.value}</span>
					</div>
				</div>

				{/* ---------- Texte et actions ---------- */}
				<div className="wb-content">
					<div className="wb-heading">
						{nudge.isTest && <span className="wb-test">Test admin</span>}
						<div className="wb-titles">
							<h2 id="wb-title" className="wb-title">{nudge.title}</h2>
							<p id="wb-body" className="wb-body">
								{firstName ? `${firstName}, ` : ""}
								{firstName ? nudge.body.charAt(0).toLowerCase() + nudge.body.slice(1) : nudge.body}
							</p>
						</div>
					</div>

					<ul className="wb-tips">
						{theme.tips.map((tip) => (
							<li key={tip.text} className="wb-tip">
								<span className="wb-tip__icon"><Emoji3D name={tip.icon} /></span>
								{tip.text}
							</li>
						))}
					</ul>

					<div className="wb-actions">
						<button ref={primaryRef} type="button" className="wb-btn wb-btn--primary" onClick={handlePrimary}>
							{theme.primary}
						</button>
						<button type="button" className="wb-btn wb-btn--ghost" onClick={snooze}>
							{theme.secondary}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WellbeingNudge;
