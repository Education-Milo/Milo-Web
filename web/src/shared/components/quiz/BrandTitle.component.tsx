import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import "@shared/styles/Quiz.css";

interface BrandTitleProps {
	text: string;
	/// Un ou deux mots du titre, mis en orange avec le relief braise
	highlight?: string;
	as?: "h1" | "h2" | "p";
	/// Délai avant la première lettre, en secondes
	delay?: number;
	/// « creme » : titre clair, pour les aplats feu
	tone?: "encre" | "creme";
	className?: string;
}

/// Titre de la charte : Luckiest Guy, révélé lettre par lettre avec un
/// rebond (back.out), sans masque pour ne pas couper les accents.
const BrandTitle: React.FC<BrandTitleProps> = ({
	text,
	highlight,
	as = "h2",
	delay = 0,
	tone = "encre",
	className = "",
}) => {
	const reduceMotion = useReducedMotion();
	const Tag = motion[as];

	const start = highlight ? text.indexOf(highlight) : -1;
	const segments =
		start >= 0 && highlight
			? [
					{ text: text.slice(0, start), hl: false },
					{ text: highlight, hl: true },
					{ text: text.slice(start + highlight.length), hl: false },
				]
			: [{ text, hl: false }];

	let letterIndex = 0;

	return (
		<Tag
			className={`qz-display qz-display--${tone} ${className}`}
			aria-label={text}
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.022, delayChildren: delay } },
			}}
		>
			{segments.map((segment, s) =>
				segment.text.split(/(\s+)/).filter(Boolean).map((word, w) =>
					/^\s+$/.test(word) ? (
						<span key={`${s}-${w}`} aria-hidden="true">{" "}</span>
					) : (
						<span
							key={`${s}-${w}`}
							className={`qz-display-word ${segment.hl ? "qz-hl" : ""}`}
							aria-hidden="true"
						>
							{[...word].map((char) => (
								<motion.span
									key={letterIndex++}
									className="qz-display-letter"
									variants={{
										hidden: reduceMotion
											? { opacity: 0 }
											: { opacity: 0, y: "0.55em", scale: 0.4, rotate: -10 },
										visible: { opacity: 1, y: 0, scale: 1, rotate: 0 },
									}}
									transition={{ type: "spring", stiffness: 520, damping: 15 }}
								>
									{char}
								</motion.span>
							))}
						</span>
					),
				),
			)}
		</Tag>
	);
};

export default BrandTitle;
