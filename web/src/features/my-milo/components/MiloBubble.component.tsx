import React, { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/// Bulle de Milo : le texte s'écrit lettre par lettre, comme sur la landing.
/// Un nouveau texte relance la frappe. Purement décorative pour les lecteurs
/// d'écran, qui reçoivent la phrase complète d'un coup.
const TYPE_SPEED_MS = 26;

const MiloBubble: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
	const calm = useReducedMotion() ?? false;
	const [shown, setShown] = useState(calm ? text.length : 0);

	useEffect(() => {
		if (calm) {
			setShown(text.length);
			return;
		}
		setShown(0);
		const timer = setInterval(() => {
			setShown((n) => {
				if (n >= text.length) {
					clearInterval(timer);
					return n;
				}
				return n + 1;
			});
		}, TYPE_SPEED_MS);
		return () => clearInterval(timer);
	}, [text, calm]);

	return (
		<p className={`mm-bubble ${className}`.trim()} aria-live="polite">
			<span className="mm-sr">{text}</span>
			{/* Le texte complet, invisible, fixe la taille de la bulle : elle ne
			    grandit pas pendant la frappe */}
			<span className="mm-bubble__ghost" aria-hidden="true">{text}</span>
			<span className="mm-bubble__typed" aria-hidden="true">
				{text.slice(0, shown)}
				<i className={`mm-bubble__caret${shown >= text.length ? " is-done" : ""}`} />
			</span>
		</p>
	);
};

export default MiloBubble;
