import React, { useId, useState } from "react";
import { Star } from "lucide-react";
import { RATING_LABELS } from "@features/feedback/data/betaJourney.data";

interface StarRatingProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
}

/// Note sur 5 : de vrais boutons radio (clavier : flèches), habillés en étoiles
const StarRating: React.FC<StarRatingProps> = ({ label, value, onChange }) => {
	const name = useId();
	const [hover, setHover] = useState(0);
	const shown = hover || value;

	return (
		<fieldset className="fb-stars">
			<legend className="lp-field__label">{label}</legend>
			<div className="fb-stars__row" onMouseLeave={() => setHover(0)}>
				{[1, 2, 3, 4, 5].map((n) => (
					<label key={n} className={`fb-star${n <= shown ? " is-on" : ""}`} onMouseEnter={() => setHover(n)}>
						<input
							type="radio"
							name={name}
							value={n}
							checked={value === n}
							onChange={() => onChange(n)}
							aria-label={`${n} sur 5 — ${RATING_LABELS[n]}`}
						/>
						<Star size={34} strokeWidth={2.2} aria-hidden="true" />
					</label>
				))}
				<span className="fb-stars__caption" aria-live="polite">
					{shown ? RATING_LABELS[shown] : "Choisis une note"}
				</span>
			</div>
		</fieldset>
	);
};

export default StarRating;
