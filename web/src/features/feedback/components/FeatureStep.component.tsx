import React from "react";
import { AlertTriangle, ListChecks, MapPin, MessageSquare } from "lucide-react";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import StarRating from "@features/feedback/components/StarRating.component";
import type { BetaFeature } from "@features/feedback/data/betaJourney.data";
import type { FeatureFeedback } from "@features/feedback/types";

interface FeatureStepProps {
	feature: BetaFeature;
	index: number;
	total: number;
	value: FeatureFeedback;
	onChange: (patch: Partial<FeatureFeedback>) => void;
}

const FeatureStep: React.FC<FeatureStepProps> = ({ feature, index, total, value, onChange }) => {
	const toggleIssue = (issue: string) =>
		onChange({
			issues: value.issues.includes(issue) ? value.issues.filter((i) => i !== issue) : [...value.issues, issue],
		});

	return (
		<div className="fb-step">
			<header className="fb-step__head">
				<Emoji3D name={feature.icon} className="fb-step__icon" />
				<div>
					<p className="fb-step__eyebrow">
						Feature {index} sur {total}
					</p>
					<h2 className="lp-display fb-step__title">{feature.title}</h2>
					<p className="fb-step__goal">{feature.goal}</p>
				</div>
			</header>

			<div className="fb-brief">
				<p className="fb-brief__entry">
					<MapPin size={18} aria-hidden="true" />
					<span>
						<strong>Où&nbsp;?</strong> {feature.entry}
					</span>
				</p>
				<div>
					<p className="fb-brief__title">
						<ListChecks size={18} aria-hidden="true" /> À essayer
					</p>
					<ol className="fb-brief__tasks">
						{feature.tasks.map((task) => (
							<li key={task}>{task}</li>
						))}
					</ol>
				</div>
			</div>

			<label className="fb-skip">
				<input type="checkbox" checked={!value.tested} onChange={(e) => onChange({ tested: !e.target.checked })} />
				<span>Je n'ai pas testé cette partie</span>
			</label>

			{value.tested && (
				<>
					<StarRating label="Ta note" value={value.rating} onChange={(rating) => onChange({ rating })} />

					<fieldset className="lp-field">
						<legend className="lp-field__label">
							<AlertTriangle size={16} aria-hidden="true" /> Ce qui a coincé <span className="fb-optional">coche tout ce qui s'applique</span>
						</legend>
						<div className="fb-chips">
							{feature.issues.map((issue) => (
								<label key={issue} className={`fb-chip fb-chip--check${value.issues.includes(issue) ? " is-active" : ""}`}>
									<input type="checkbox" checked={value.issues.includes(issue)} onChange={() => toggleIssue(issue)} />
									{issue}
								</label>
							))}
						</div>
					</fieldset>

					<label className="lp-field">
						<span className="lp-field__label">
							<MessageSquare size={16} aria-hidden="true" /> Ton commentaire <span className="fb-optional">facultatif</span>
						</span>
						<textarea
							rows={4}
							placeholder="Ce que tu as aimé, ce qui t'a bloqué, un bug précis…"
							value={value.comment}
							onChange={(e) => onChange({ comment: e.target.value })}
							data-lenis-prevent
						/>
					</label>
				</>
			)}
		</div>
	);
};

export default FeatureStep;
