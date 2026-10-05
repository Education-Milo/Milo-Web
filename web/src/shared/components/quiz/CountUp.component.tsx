import React, { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface CountUpProps {
	value: number;
	/// Départ du défilement
	from?: number;
	/// Attente avant le départ, en secondes
	delay?: number;
	/// Texte ajouté après le nombre (« % », « XP »…)
	suffix?: string;
}

/// Nombre qui défile jusqu'à sa valeur (mise à jour du texte seulement)
const CountUp: React.FC<CountUpProps> = ({ value, from = 0, delay = 0, suffix = "" }) => {
	const reduceMotion = useReducedMotion();
	const [display, setDisplay] = useState(reduceMotion ? value : from);

	useEffect(() => {
		if (reduceMotion) {
			setDisplay(value);
			return;
		}
		const controls = animate(from, value, {
			duration: Math.min(0.5 + Math.abs(value - from) * 0.06, 1.4),
			delay,
			ease: "easeOut",
			onUpdate: (latest) => setDisplay(Math.round(latest)),
		});
		return () => controls.stop();
	}, [value, from, delay, reduceMotion]);

	return (
		<>
			{display}
			{suffix}
		</>
	);
};

export default CountUp;
