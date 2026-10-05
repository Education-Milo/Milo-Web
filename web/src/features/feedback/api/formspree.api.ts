import { BETA_FEATURES, RATING_LABELS, ROLES } from "@features/feedback/data/betaJourney.data";
import type { BetaDraft } from "@features/feedback/types";

/// Endpoint Formspree du formulaire « Parcours bêta ». L'identifiant d'un
/// formulaire Formspree est public (il finit dans le HTML de toute façon).
const FORMSPREE_ENDPOINT =
	(import.meta.env.VITE_FORMSPREE_BETA_ENDPOINT as string | undefined) || "https://formspree.io/f/mgaoeeaa";

const RECOMMEND_LABELS = { oui: "Oui", "peut-etre": "Peut-être", non: "Non", "": "—" } as const;

const formatRating = (rating: number) => (rating ? `${rating}/5 (${RATING_LABELS[rating]})` : "—");

/// Aplatit le brouillon en champs lisibles : Formspree les affiche tels quels
/// dans l'email et dans l'export CSV, une ligne par champ.
export function buildPayload(draft: BetaDraft): Record<string, string> {
	const { profile, features, general } = draft;
	const isParent = profile.role === "parent";
	const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim();

	const payload: Record<string, string> = {
		_subject: `[Bêta Milo] ${fullName} — ${general.rating ? `${general.rating}/5` : "sans note"}`,
		"Prénom": profile.firstName.trim(),
		"Nom": profile.lastName.trim(),
		"Profil": ROLES.find((r) => r.value === profile.role)?.label ?? "—",
		[isParent ? "Profession" : "Classe"]: isParent ? profile.profession.trim() : profile.classe,
		"Appareil": profile.device || "—",
	};
	if (isParent && profile.childClasse) payload["Classe de l'enfant"] = profile.childClasse;
	// `email` est reconnu par Formspree comme adresse de réponse
	if (profile.email.trim()) payload.email = profile.email.trim();

	BETA_FEATURES.forEach((feature, i) => {
		const fb = features[feature.id];
		if (!fb || (feature.onlyFor && feature.onlyFor !== profile.role)) return;
		const prefix = `${String(i + 1).padStart(2, "0")} · ${feature.title}`;
		if (!fb.tested) {
			payload[`${prefix} — note`] = "Non testé";
			return;
		}
		payload[`${prefix} — note`] = formatRating(fb.rating);
		payload[`${prefix} — problèmes`] = fb.issues.length ? fb.issues.join(" ; ") : "—";
		payload[`${prefix} — commentaire`] = fb.comment.trim() || "—";
	});

	payload["Général — note globale"] = formatRating(general.rating);
	payload["Général — recommanderait Milo"] = RECOMMEND_LABELS[general.recommend];
	payload["Général — ce qui a plu"] = general.liked.trim() || "—";
	payload["Général — ce qui a gêné"] = general.disliked.trim() || "—";
	payload["Général — idées"] = general.ideas.trim() || "—";
	payload["Général — autre retour"] = general.other.trim() || "—";

	return payload;
}

/// Envoie le retour à Formspree. Lève une erreur au message affichable.
export async function submitBetaFeedback(draft: BetaDraft): Promise<void> {
	let response: Response;
	try {
		response = await fetch(FORMSPREE_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify(buildPayload(draft)),
		});
	} catch {
		throw new Error("Impossible de joindre le serveur. Vérifie ta connexion puis réessaie : tes réponses sont gardées.");
	}

	if (response.ok) return;

	const result = (await response.json().catch(() => null)) as { errors?: { message: string }[] } | null;
	const detail = result?.errors?.map((e) => e.message).join(", ");
	throw new Error(
		detail
			? `L'envoi a échoué (${detail}). Tes réponses sont gardées, réessaie dans un instant.`
			: "L'envoi a échoué. Tes réponses sont gardées, réessaie dans un instant.",
	);
}
