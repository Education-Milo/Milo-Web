import React from "react";

interface FillProps {
	/** Valeur venant de LEGAL_INFO ; null tant qu'elle n'est pas renseignée */
	value: string | null;
	/** Ce qui manque, affiché dans l'étiquette (« raison sociale »…) */
	label: string;
}

/// Affiche une information juridique, ou une étiquette « À compléter »
/// bien visible tant qu'elle manque dans legal.info.ts.
const Fill: React.FC<FillProps> = ({ value, label }) =>
	value ? <>{value}</> : <mark className="lg-fill">À compléter : {label}</mark>;

export default Fill;
