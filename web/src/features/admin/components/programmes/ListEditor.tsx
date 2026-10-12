import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface ListEditorProps {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
	maxLength: number;
	placeholder?: string;
	disabled?: boolean;
}

/** Liste de phrases (objectifs, critères) : un item par ligne, ajout et retrait. */
const ListEditor: React.FC<ListEditorProps> = ({ label, items, onChange, maxLength, placeholder, disabled }) => {
	const [draft, setDraft] = useState("");

	const add = () => {
		const value = draft.trim();
		if (!value) return;
		onChange([...items, value]);
		setDraft("");
	};

	return (
		<div className="ad-field ad-field--grow">
			<span>{label}</span>
			{items.length === 0 && <p className="ad-muted ad-list-empty">Aucun élément pour l'instant.</p>}
			{items.length > 0 && (
				<ol className="ad-list-editor">
					{items.map((item, index) => (
						<li key={index}>
							<input
								type="text"
								value={item}
								maxLength={maxLength}
								disabled={disabled}
								aria-label={`${label} ${index + 1}`}
								onChange={(e) => onChange(items.map((it, i) => (i === index ? e.target.value : it)))}
							/>
							<button
								type="button"
								className="ad-icon-btn"
								aria-label={`Retirer l'élément ${index + 1}`}
								onClick={() => onChange(items.filter((_, i) => i !== index))}
								disabled={disabled}
							>
								<X size={14} />
							</button>
						</li>
					))}
				</ol>
			)}
			<div className="ad-list-add">
				<input
					type="text"
					value={draft}
					maxLength={maxLength}
					placeholder={placeholder}
					disabled={disabled}
					aria-label={`Ajouter : ${label}`}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							add();
						}
					}}
				/>
				<button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={add} disabled={disabled || !draft.trim()}>
					<Plus size={14} /> Ajouter
				</button>
			</div>
		</div>
	);
};

export default ListEditor;
