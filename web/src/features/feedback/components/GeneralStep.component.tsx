import React from "react";
import { Heart, Lightbulb, MessageSquare, Pencil, ThumbsDown } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import StarRating from "@features/feedback/components/StarRating.component";
import type { BetaFeature } from "@features/feedback/data/betaJourney.data";
import type { FeatureFeedback, GeneralFeedback, Recommend } from "@features/feedback/types";

const RECOMMEND_OPTIONS: { value: Exclude<Recommend, "">; label: string }[] = [
	{ value: "oui", label: "Oui, carrément" },
	{ value: "peut-etre", label: "Peut-être" },
	{ value: "non", label: "Non" },
];

const TEXT_FIELDS: { key: "liked" | "disliked" | "ideas" | "other"; label: string; icon: React.ReactNode; placeholder: string }[] = [
	{ key: "liked", label: "Ce que tu as préféré", icon: <Heart size={16} aria-hidden="true" />, placeholder: "La feature qui t'a donné envie de revenir…" },
	{ key: "disliked", label: "Ce qui t'a le plus gêné", icon: <ThumbsDown size={16} aria-hidden="true" />, placeholder: "Le truc à corriger en premier…" },
	{ key: "ideas", label: "Tes idées pour Milo", icon: <Lightbulb size={16} aria-hidden="true" />, placeholder: "Une feature, une matière, un mode de jeu…" },
	{ key: "other", label: "Autre retour", icon: <MessageSquare size={16} aria-hidden="true" />, placeholder: "Tout ce que tu n'as pas pu dire ailleurs" },
];

interface GeneralStepProps {
	value: GeneralFeedback;
	onChange: (patch: Partial<GeneralFeedback>) => void;
	features: BetaFeature[];
	featureValues: Record<string, FeatureFeedback>;
	/// Revenir à l'étape d'une feature depuis le récapitulatif
	onEditFeature: (featureIndex: number) => void;
}

const GeneralStep: React.FC<GeneralStepProps> = ({ value, onChange, features, featureValues, onEditFeature }) => (
	<div className="fb-step">
		<header className="fb-step__head">
			<Emoji3D name="trophy" className="fb-step__icon" />
			<div>
				<p className="fb-step__eyebrow">Dernière étape</p>
				<h2 className="lp-display fb-step__title">Ton avis général</h2>
				<p className="fb-step__goal">Prends un peu de recul sur tout ce que tu as testé.</p>
			</div>
		</header>

		<StarRating label="Ta note globale pour Milo" value={value.rating} onChange={(rating) => onChange({ rating })} />

		<fieldset className="lp-field">
			<legend className="lp-field__label">Tu conseillerais Milo à un ami ou à un autre parent&nbsp;?</legend>
			<div className="fb-chips">
				{RECOMMEND_OPTIONS.map((option) => (
					<label key={option.value} className={`fb-chip${value.recommend === option.value ? " is-active" : ""}`}>
						<input
							type="radio"
							name="recommend"
							value={option.value}
							checked={value.recommend === option.value}
							onChange={() => onChange({ recommend: option.value })}
						/>
						{option.label}
					</label>
				))}
			</div>
		</fieldset>

		<div className="fb-texts">
			{TEXT_FIELDS.map((field) => (
				<label key={field.key} className="lp-field">
					<span className="lp-field__label">
						{field.icon} {field.label}
					</span>
					<textarea
						rows={3}
						placeholder={field.placeholder}
						value={value[field.key]}
						onChange={(e) => onChange({ [field.key]: e.target.value })}
						data-lenis-prevent
					/>
				</label>
			))}
		</div>

		<section className="fb-recap" aria-labelledby="fb-recap-title">
			<h3 className="fb-recap__title" id="fb-recap-title">
				Récapitulatif de tes notes
			</h3>
			<ul className="fb-recap__list">
				{features.map((feature, i) => {
					const fb = featureValues[feature.id];
					return (
						<li key={feature.id}>
							<Emoji3D name={feature.icon} className="fb-recap__icon" />
							<span className="fb-recap__name">{feature.title}</span>
							<span className={`fb-recap__score${!fb.tested || !fb.rating ? " is-muted" : ""}`}>
								{!fb.tested ? "Non testé" : fb.rating ? `${"★".repeat(fb.rating)}${"☆".repeat(5 - fb.rating)}` : "Pas noté"}
							</span>
							<button type="button" className="fb-recap__edit" onClick={() => onEditFeature(i)} aria-label={`Modifier ${feature.title}`}>
								<Pencil size={16} aria-hidden="true" />
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	</div>
);

export default GeneralStep;
