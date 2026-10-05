import type { BetaRole } from "@features/feedback/data/betaJourney.data";

export interface BetaProfile {
	firstName: string;
	lastName: string;
	email: string;
	role: BetaRole | "";
	/// Classe de l'élève (6e…3e, Autre)
	classe: string;
	/// Profession du parent
	profession: string;
	/// Classe de l'enfant, côté parent (facultatif)
	childClasse: string;
	device: string;
}

export interface FeatureFeedback {
	/// false : le testeur n'a pas pu ou pas voulu tester cette feature
	tested: boolean;
	/// 0 = pas encore noté, puis 1 à 5
	rating: number;
	issues: string[];
	comment: string;
}

export type Recommend = "" | "oui" | "peut-etre" | "non";

export interface GeneralFeedback {
	rating: number;
	recommend: Recommend;
	liked: string;
	disliked: string;
	ideas: string;
	other: string;
}

export interface BetaDraft {
	profile: BetaProfile;
	features: Record<string, FeatureFeedback>;
	general: GeneralFeedback;
	step: number;
}
