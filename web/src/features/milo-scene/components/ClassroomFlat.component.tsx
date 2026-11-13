import React, { useEffect, useRef } from "react";

interface ClassroomFlatProps {
	board: React.ReactNode;
	sheet: React.ReactNode;
	notes: React.ReactNode;
	isEditing: boolean;
	isNotesOpen: boolean;
	onNotesClick: () => void;
}

/**
 * Salle de classe sans 3D, affichée quand WebGL est indisponible (postes
 * scolaires verrouillés, cartes graphiques bloquées). Mêmes contenus que la
 * scène : le tableau à la craie, la feuille pour écrire à Milo et le post-it
 * des notes, posés à plat en HTML.
 */
const ClassroomFlat: React.FC<ClassroomFlatProps> = ({
	board,
	sheet,
	notes,
	isEditing,
	isNotesOpen,
	onNotesClick,
}) => {
	const postitRef = useRef<HTMLDivElement>(null);
	const wasOpen = useRef(false);

	// Le bouton qui ouvre le post-it disparaît à l'ouverture : le focus passe
	// dans le post-it, puis revient sur ce bouton à la fermeture (WCAG 2.4.3)
	useEffect(() => {
		const postit = postitRef.current;
		if (!postit) return;
		if (isNotesOpen) {
			wasOpen.current = true;
			postit.querySelector<HTMLElement>("button, input, textarea")?.focus({ preventScroll: true });
		} else if (wasOpen.current) {
			wasOpen.current = false;
			const active = document.activeElement;
			if (!active || active === document.body || postit.contains(active)) {
				postit.querySelector<HTMLElement>(".cls-flat-cover")?.focus({ preventScroll: true });
			}
		}
	}, [isNotesOpen]);

	return (
		<div className={`cls-flat${isEditing ? " is-editing" : ""}${isNotesOpen ? " is-notes-open" : ""}`}>
			<div className="cls-chalkboard is-flat cls-flat-board">{board}</div>

			<div className="cls-flat-desk">
				<div className={`cls-paper cls-flat-paper${isEditing ? " is-held" : ""}`}>{sheet}</div>
				<div ref={postitRef} className={`cls-postit cls-flat-postit${isNotesOpen ? " is-held" : ""}`}>
					{notes}
					{/* Post-it au repos : la zone entière l'ouvre, au clic comme au clavier */}
					{!isNotesOpen && (
						<button type="button" className="cls-flat-cover" onClick={onNotesClick}>
							<span className="cls-sr-only">Ouvrir mes notes</span>
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ClassroomFlat;
