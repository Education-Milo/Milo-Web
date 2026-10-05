import { useCallback, useEffect, useState } from "react";
import { BETA_FEATURES } from "@features/feedback/data/betaJourney.data";
import type { BetaDraft, BetaProfile, FeatureFeedback, GeneralFeedback } from "@features/feedback/types";

const STORAGE_KEY = "milo.beta-feedback.draft.v1";

const emptyFeature = (): FeatureFeedback => ({ tested: true, rating: 0, issues: [], comment: "" });

export const createEmptyDraft = (): BetaDraft => ({
	profile: {
		firstName: "",
		lastName: "",
		email: "",
		role: "",
		classe: "",
		profession: "",
		childClasse: "",
		device: "",
	},
	features: Object.fromEntries(BETA_FEATURES.map((f) => [f.id, emptyFeature()])),
	general: { rating: 0, recommend: "", liked: "", disliked: "", ideas: "", other: "" },
	step: 0,
});

function loadDraft(): BetaDraft {
	const empty = createEmptyDraft();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return empty;
		const saved = JSON.parse(raw) as Partial<BetaDraft>;
		// Fusion champ par champ : une feature ajoutée depuis reste valide
		return {
			profile: { ...empty.profile, ...saved.profile },
			features: Object.fromEntries(
				BETA_FEATURES.map((f) => [f.id, { ...emptyFeature(), ...saved.features?.[f.id] }]),
			),
			general: { ...empty.general, ...saved.general },
			step: typeof saved.step === "number" ? saved.step : 0,
		};
	} catch {
		return empty;
	}
}

/// Brouillon du parcours bêta, gardé dans le navigateur : le testeur peut
/// fermer l'onglet entre deux features et reprendre où il en était.
export function useBetaDraft() {
	const [draft, setDraft] = useState<BetaDraft>(loadDraft);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
		} catch {
			// Stockage indisponible (navigation privée) : le parcours marche quand même
		}
	}, [draft]);

	const updateProfile = useCallback((patch: Partial<BetaProfile>) => {
		setDraft((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
	}, []);

	const updateFeature = useCallback((id: string, patch: Partial<FeatureFeedback>) => {
		setDraft((d) => ({ ...d, features: { ...d.features, [id]: { ...d.features[id], ...patch } } }));
	}, []);

	const updateGeneral = useCallback((patch: Partial<GeneralFeedback>) => {
		setDraft((d) => ({ ...d, general: { ...d.general, ...patch } }));
	}, []);

	const setStep = useCallback((step: number) => {
		setDraft((d) => ({ ...d, step }));
	}, []);

	const reset = useCallback(() => {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// rien à nettoyer
		}
		setDraft(createEmptyDraft());
	}, []);

	return { draft, updateProfile, updateFeature, updateGeneral, setStep, reset };
}
