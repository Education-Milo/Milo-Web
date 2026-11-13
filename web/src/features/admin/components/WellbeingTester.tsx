import React from "react";
import { Coffee, HeartPulse, Moon, RotateCcw, Sun } from "lucide-react";
import { WELLBEING_RULES, useWellbeingStore } from "@features/wellbeing/store/wellbeing.store";
import type { NudgeKind } from "@features/wellbeing/data/wellbeing.messages";
import { showToast } from "@shared/store/toast/toast.store";

const formatMinutes = (seconds: number) => {
	const min = Math.floor(seconds / 60);
	return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
};

const TRIGGERS: { kind: NudgeKind; label: string; icon: React.ReactNode; help: string }[] = [
	{
		kind: "break",
		label: "Pause après une longue session",
		icon: <Coffee size={16} />,
		help: `Automatique après ${WELLBEING_RULES.breakAfterMin} min d'affilée`,
	},
	{
		kind: "daily",
		label: "Trop de temps aujourd'hui",
		icon: <Sun size={16} />,
		help: `Automatique au-delà de ${WELLBEING_RULES.dailyLimitMin} min dans la journée`,
	},
	{
		kind: "bedtime",
		label: "Il faut aller dormir",
		icon: <Moon size={16} />,
		help: `Automatique entre ${WELLBEING_RULES.bedtimeHour} h ${WELLBEING_RULES.bedtimeMinute} et 6 h`,
	},
];

/** Déclenche à la main les rappels bien-être pour les vérifier. */
const WellbeingTester: React.FC = () => {
	const tracking = useWellbeingStore((state) => state.tracking);
	const trigger = useWellbeingStore((state) => state.trigger);
	const reset = useWellbeingStore((state) => state.reset);

	return (
		<div className="ad-wellbeing">
			<section className="ad-card">
				<div className="ad-wellbeing-head">
					<h2 className="ad-subtitle"><HeartPulse size={16} /> Rappels bien-être</h2>
					<p className="ad-muted">
						Milo invite l'élève à faire une pause, à décrocher ou à aller dormir. Les rappels de test
						s'affichent sur ton écran uniquement et ne déconnectent pas.
					</p>
				</div>

				<div className="ad-wellbeing-grid">
					{TRIGGERS.map((t) => (
						<button key={t.kind} type="button" className="ad-wellbeing-trigger" onClick={() => trigger(t.kind, true)}>
							<span className="ad-wellbeing-trigger-label">{t.icon} {t.label}</span>
							<span className="ad-wellbeing-trigger-help">{t.help}</span>
						</button>
					))}
				</div>
			</section>

			<section className="ad-card">
				<div className="ad-wellbeing-head">
					<h2 className="ad-subtitle">Mon temps d'écran (cet appareil)</h2>
					<p className="ad-muted">Compté uniquement quand l'onglet Milo est au premier plan.</p>
				</div>
				<dl className="ad-facts">
					<div>
						<dt>Aujourd'hui</dt>
						<dd>{formatMinutes(tracking.dailySeconds)}</dd>
					</div>
					<div>
						<dt>Session en cours</dt>
						<dd>{formatMinutes(tracking.sessionSeconds)}</dd>
					</div>
					<div>
						<dt>Prochain rappel possible</dt>
						<dd>
							{tracking.quietUntil > Date.now()
								? new Date(tracking.quietUntil).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
								: "Dès qu'un seuil est atteint"}
						</dd>
					</div>
				</dl>
				<button
					type="button"
					className="ad-btn ad-btn--ghost ad-wellbeing-reset"
					onClick={() => {
						reset();
						showToast("Compteurs de temps d'écran remis à zéro.", "success");
					}}
				>
					<RotateCcw size={16} /> Remettre les compteurs à zéro
				</button>
			</section>
		</div>
	);
};

export default WellbeingTester;
