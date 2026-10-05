import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import SubPage from "@features/landing/components/SubPage/SubPage.component";
import PageHero from "@features/landing/components/SubPage/PageHero.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import { BETA_FEATURES } from "@features/feedback/data/betaJourney.data";
import { useBetaDraft } from "@features/feedback/hooks/useBetaDraft";
import { submitBetaFeedback } from "@features/feedback/api/formspree.api";
import ProfileStep from "@features/feedback/components/ProfileStep.component";
import { validateProfile } from "@features/feedback/utils/validateProfile";
import FeatureStep from "@features/feedback/components/FeatureStep.component";
import GeneralStep from "@features/feedback/components/GeneralStep.component";
import type { BetaProfile } from "@features/feedback/types";
// Champs (.lp-field), lignes et messages de statut partagés avec la page Contact
import "@features/landing/styles/Contact.css";
import "@features/feedback/styles/BetaJourney.css";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const ANCHOR_ID = "parcours";

/// Parcours guidé des bêta-testeurs : profil, puis une étape par feature
/// (note sur 5, problèmes rencontrés, commentaire), puis un avis général.
/// Accessible sans compte ; le brouillon est gardé dans le navigateur.
const BetaJourneyPage: React.FC = () => {
	const { draft, updateProfile, updateFeature, updateGeneral, setStep, reset } = useBetaDraft();
	const [touched, setTouched] = useState<Set<keyof BetaProfile>>(new Set());
	const [showAllErrors, setShowAllErrors] = useState(false);
	const [status, setStatus] = useState<SubmitStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const isFirstRender = useRef(true);

	const features = useMemo(
		() => BETA_FEATURES.filter((f) => !f.onlyFor || f.onlyFor === draft.profile.role),
		[draft.profile.role],
	);
	const lastStep = features.length + 1;
	const step = Math.min(draft.step, lastStep);

	const profileErrors = validateProfile(draft.profile);
	const profileValid = Object.keys(profileErrors).length === 0;
	const visibleErrors = Object.fromEntries(
		Object.entries(profileErrors).filter(([field]) => showAllErrors || touched.has(field as keyof BetaProfile)),
	);

	// On remonte en haut du parcours à chaque changement d'étape
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		scrollToSection(ANCHOR_ID);
	}, [step, status]);

	const goTo = (target: number) => {
		if (target > 0 && !profileValid) {
			setShowAllErrors(true);
			if (step !== 0) {
				setStep(0);
				return;
			}
			// Déjà sur le profil : on amène le premier champ en erreur sous les yeux
			requestAnimationFrame(() => {
				const field = document.querySelector(".fb-error")?.closest(".lp-field");
				field?.scrollIntoView({ behavior: "smooth", block: "center" });
				field?.querySelector<HTMLInputElement>("input:not([type=radio])")?.focus({ preventScroll: true });
			});
			return;
		}
		setStep(Math.max(0, Math.min(target, lastStep)));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (step < lastStep) {
			goTo(step + 1);
			return;
		}
		if (!profileValid) {
			goTo(0);
			return;
		}
		setStatus("submitting");
		setErrorMessage(null);
		try {
			await submitBetaFeedback(draft);
			setStatus("success");
		} catch (err) {
			setStatus("error");
			setErrorMessage((err as Error).message);
		}
	};

	const restart = () => {
		reset();
		setTouched(new Set());
		setShowAllErrors(false);
		setStatus("idle");
	};

	const isStepDone = (i: number) => {
		if (i === 0) return profileValid;
		if (i === lastStep) return draft.general.rating > 0;
		const fb = draft.features[features[i - 1].id];
		return !fb.tested || fb.rating > 0;
	};

	const stepLabels = [
		{ label: "Profil", icon: "student" as const },
		...features.map((f) => ({ label: f.title, icon: f.icon })),
		{ label: "Avis général", icon: "trophy" as const },
	];

	const hero = (
		<PageHero
			icon="fox"
			floats={["sparkles", "rocket"]}
			eyebrow="Bêta testeurs"
			title={
				<>
					Ton avis fait <span className="lp-hl">Milo</span>
				</>
			}
			lead="Teste chaque partie de Milo, note-la sur 5 et dis-nous ce qui coince. Compte environ 20 minutes ; tes réponses sont gardées si tu fais une pause."
		/>
	);

	if (status === "success") {
		return (
			<SubPage hero={hero}>
				<div className="fb" id={ANCHOR_ID}>
					<div className="fb-card fb-done" role="status">
						<Emoji3D name="party_popper" className="fb-done__icon" loading="eager" />
						<h2 className="lp-display fb-done__title">Merci {draft.profile.firstName.trim()}&nbsp;!</h2>
						<p>Ton retour est bien arrivé chez l'équipe Milo. On le lit en entier et on s'en sert pour prioriser les corrections.</p>
						<div className="fb-done__actions">
							<Link to="/" className="lp-btn lp-btn--primary lp-btn--sm">
								Retour au site <ArrowRight size={18} aria-hidden="true" />
							</Link>
							<button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={restart}>
								Envoyer un autre retour
							</button>
						</div>
					</div>
				</div>
			</SubPage>
		);
	}

	const currentFeature = step > 0 && step < lastStep ? features[step - 1] : null;
	const progress = Math.round((step / lastStep) * 100);

	return (
		<SubPage hero={hero}>
			<div className="fb" id={ANCHOR_ID}>
				<div className="fb-progress">
					<div className="fb-progress__meta">
						<span>
							Étape {step + 1} sur {lastStep + 1}
						</span>
						<span>{stepLabels[step].label}</span>
					</div>
					<div className="fb-progress__bar" aria-hidden="true">
						<span style={{ width: `${Math.max(progress, 4)}%` }} />
					</div>
					<nav className="fb-steps" aria-label="Étapes du parcours" data-lenis-prevent>
						{stepLabels.map((s, i) => (
							<button
								key={s.label}
								type="button"
								className={`fb-steps__item${i === step ? " is-current" : ""}${isStepDone(i) ? " is-done" : ""}`}
								onClick={() => goTo(i)}
								aria-current={i === step ? "step" : undefined}
								title={s.label}
							>
								<Emoji3D name={s.icon} className="fb-steps__icon" />
								{isStepDone(i) && i !== step && (
									<span className="fb-steps__check" aria-hidden="true">
										<Check size={12} strokeWidth={3} />
									</span>
								)}
								<span className="fb-steps__label">{s.label}</span>
							</button>
						))}
					</nav>
				</div>

				<form className="fb-card" onSubmit={handleSubmit} noValidate>
					{step === 0 && (
						<ProfileStep
							profile={draft.profile}
							errors={visibleErrors}
							onChange={updateProfile}
							onBlur={(field) => setTouched((t) => new Set(t).add(field))}
						/>
					)}

					{currentFeature && (
						<FeatureStep
							key={currentFeature.id}
							feature={currentFeature}
							index={step}
							total={features.length}
							value={draft.features[currentFeature.id]}
							onChange={(patch) => updateFeature(currentFeature.id, patch)}
						/>
					)}

					{step === lastStep && (
						<GeneralStep
							value={draft.general}
							onChange={updateGeneral}
							features={features}
							featureValues={draft.features}
							onEditFeature={(i) => goTo(i + 1)}
						/>
					)}

					{status === "error" && step === lastStep && (
						<div className="lp-contact-status lp-contact-status--error" role="alert">
							<AlertCircle size={20} aria-hidden="true" />
							<span>{errorMessage}</span>
						</div>
					)}

					<div className="fb-nav">
						{step > 0 ? (
							<button type="button" className="lp-btn lp-btn--ghost lp-btn--sm fb-nav__back" onClick={() => goTo(step - 1)}>
								<ArrowLeft size={18} aria-hidden="true" /> Précédent
							</button>
						) : (
							<span />
						)}
						{step < lastStep ? (
							<button type="submit" className="lp-btn lp-btn--primary lp-btn--sm">
								{step === 0 ? "Commencer le parcours" : "Feature suivante"} <ArrowRight size={18} aria-hidden="true" />
							</button>
						) : (
							<button type="submit" className="lp-btn lp-btn--primary lp-btn--sm" disabled={status === "submitting"}>
								{status === "submitting" ? "Envoi en cours…" : "Envoyer mon retour"} <Send size={18} aria-hidden="true" />
							</button>
						)}
					</div>
				</form>
			</div>
		</SubPage>
	);
};

export default BetaJourneyPage;
