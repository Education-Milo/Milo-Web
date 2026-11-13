import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Footprints, GraduationCap, RotateCcw, Sparkles } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { CLASS_SLIDES, TOUR_STEPS } from "@features/onboarding/data/onboarding.data";
import { useOnboardingStore } from "@features/onboarding/store/onboarding.store";
import { useUserStore } from "@shared/store/user/user.store";
import { showToast } from "@shared/store/toast/toast.store";
import { ROUTES } from "@shared/constants/routes";

/** Simule l'onboarding d'un nouvel élève, sans rien enregistrer. */
const OnboardingTester: React.FC = () => {
	const navigate = useNavigate();
	const userId = useUserStore((s) => s.user?.id);
	const { startClassroom, startTour, isPending, isDone, resetFor, markDoneFor } = useOnboardingStore();
	// Re-rendu après les actions sur le stockage local
	const [, refresh] = useState(0);

	const runFull = () => {
		startClassroom({ isTest: true, userId: userId ?? null });
		navigate(ROUTES.ONBOARDING);
	};

	const runTour = (step = 0) => {
		startTour({ isTest: true, step, userId: userId ?? null });
		navigate(TOUR_STEPS[step].route);
	};

	return (
		<div className="ad-wellbeing">
			<section className="ad-card">
				<div className="ad-wellbeing-head">
					<h2 className="ad-subtitle"><Sparkles size={16} /> Simuler l'onboarding</h2>
					<p className="ad-muted">
						Ce que voit un élève juste après son inscription : Milo l'accueille en classe ({CLASS_SLIDES.length} écrans au
						tableau), puis lui fait visiter l'école en {TOUR_STEPS.length} étapes. En mode test, rien n'est enregistré.
					</p>
				</div>

				<div className="ad-wellbeing-grid">
					<button type="button" className="ad-wellbeing-trigger" onClick={runFull}>
						<span className="ad-wellbeing-trigger-label"><GraduationCap size={16} /> Onboarding complet</span>
						<span className="ad-wellbeing-trigger-help">Classe de Milo puis visite guidée</span>
					</button>
					<button type="button" className="ad-wellbeing-trigger" onClick={() => runTour(0)}>
						<span className="ad-wellbeing-trigger-label"><Footprints size={16} /> Visite guidée seule</span>
						<span className="ad-wellbeing-trigger-help">Saute la classe, commence à l'étape 1</span>
					</button>
				</div>
			</section>

			<section className="ad-card">
				<div className="ad-wellbeing-head">
					<h2 className="ad-subtitle">Aller directement à une étape</h2>
					<p className="ad-muted">Pratique pour vérifier un texte ou la mise en lumière d'une entrée de la sidebar.</p>
				</div>
				<div className="ad-wellbeing-grid">
					{TOUR_STEPS.map((s, i) => (
						<button key={s.id} type="button" className="ad-wellbeing-trigger" onClick={() => runTour(i)}>
							<span className="ad-wellbeing-trigger-label">
								<Emoji3D name={s.icon} style={{ width: 20, height: 20 }} /> {i + 1}. {s.title}
							</span>
							<span className="ad-wellbeing-trigger-help">{s.route}</span>
						</button>
					))}
				</div>
			</section>

			<section className="ad-card">
				<div className="ad-wellbeing-head">
					<h2 className="ad-subtitle">Mon onboarding (cet appareil)</h2>
					<p className="ad-muted">
						Pour revivre le parcours réel d'un nouveau compte : il se lancera à ta prochaine arrivée sur l'accueil et sera
						enregistré comme vu à la fin.
					</p>
				</div>
				<dl className="ad-facts">
					<div>
						<dt>Statut</dt>
						<dd>{isDone(userId) ? "Déjà vu" : "Jamais vu"}</dd>
					</div>
					<div>
						<dt>À la prochaine connexion</dt>
						<dd>{isPending() && !isDone(userId) ? "Se lancera" : "Rien"}</dd>
					</div>
				</dl>
				<div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
					<button
						type="button"
						className="ad-btn ad-btn--ghost"
						onClick={() => {
							resetFor(userId);
							refresh((n) => n + 1);
							showToast("L'onboarding se lancera à ta prochaine arrivée sur l'accueil.", "success");
						}}
					>
						<RotateCcw size={16} /> Rejouer comme un nouveau compte
					</button>
					<button
						type="button"
						className="ad-btn ad-btn--ghost"
						onClick={() => {
							markDoneFor(userId);
							refresh((n) => n + 1);
							showToast("Onboarding marqué comme vu.", "success");
						}}
					>
						<CheckCircle2 size={16} /> Marquer comme vu
					</button>
				</div>
			</section>
		</div>
	);
};

export default OnboardingTester;
