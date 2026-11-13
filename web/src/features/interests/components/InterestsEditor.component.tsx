import React, { useId } from "react";
import { Plus, X } from "lucide-react";
import { AI_LIMITS } from "@shared/lib/aiRequests";
import { useInterests } from "@features/interests/hooks/useInterests";
import "@features/interests/styles/InterestsEditor.css";

/**
 * Liste modifiable des centres d'intérêt : étiquettes supprimables, champ
 * d'ajout et suggestions. Pas de compteur : ce n'est pas une notification.
 */
const InterestsEditor: React.FC = () => {
	const { interests, suggestions, newInterest, setNewInterest, handleAdd, handleDelete } = useInterests();
	const inputId = useId();

	return (
		<div className="ie">
			{interests.length > 0 ? (
				<ul className="ie-tags" aria-label="Tes centres d'intérêt">
					{interests.map((interest) => (
						<li key={interest.id} className="ie-tag">
							{interest.name}
							<button
								type="button"
								className="ie-tag-remove"
								onClick={() => handleDelete(interest.id)}
								aria-label={`Retirer ${interest.name}`}
								title={`Retirer ${interest.name}`}
							>
								<X size={14} aria-hidden="true" />
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="ie-empty">
					Aucun centre d'intérêt pour le moment. Ajoute-en pour des exercices qui te ressemblent.
				</p>
			)}

			<form
				className="ie-add"
				onSubmit={(e) => {
					e.preventDefault();
					handleAdd();
				}}
			>
				<label htmlFor={inputId} className="ie-label">
					Ajouter un centre d'intérêt
				</label>
				<div className="ie-add-row">
					<input
						id={inputId}
						type="text"
						className="ie-input"
						placeholder="Ex. : basket, dessin, espace…"
						value={newInterest}
						maxLength={AI_LIMITS.INTEREST_NAME}
						onChange={(e) => setNewInterest(e.target.value)}
					/>
					<button type="submit" className="ie-add-btn" disabled={!newInterest.trim()}>
						<Plus size={18} aria-hidden="true" />
						Ajouter
					</button>
				</div>
			</form>

			{suggestions.length > 0 && (
				<div className="ie-suggestions">
					<p className="ie-label">Idées</p>
					<div className="ie-suggestions-list">
						{suggestions.map((name) => (
							<button key={name} type="button" className="ie-suggestion" onClick={() => handleAdd(name)}>
								<Plus size={14} aria-hidden="true" />
								{name}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default InterestsEditor;
