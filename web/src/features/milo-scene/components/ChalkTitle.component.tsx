import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ChalkTitleProps {
	text: string;
	className?: string;
	/// Un mot du titre mis en couleur (comme le « .hl » de la charte)
	highlight?: string;
}

/// Titre du tableau : Luckiest Guy, chaque mot arrive avec un petit rebond
/// (back.out de la charte), comme écrit d'un geste à la craie.
const ChalkTitle: React.FC<ChalkTitleProps> = ({ text, className = "cls-board-title", highlight }) => {
	const reduceMotion = useReducedMotion();
	const words = text.split(/\s+/).filter(Boolean);
	const hl = highlight?.toLowerCase();

	return (
		<motion.h2
			key={text}
			className={className}
			aria-label={text}
			initial="hidden"
			animate="visible"
			variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } } }}
		>
			{words.map((word, i) => (
				<React.Fragment key={`${word}-${i}`}>
					<motion.span
						aria-hidden="true"
						className={`cls-board-title-word${hl && word.toLowerCase().includes(hl) ? " is-hl" : ""}`}
						variants={
							reduceMotion
								? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
								: {
										hidden: { opacity: 0, y: 18, rotate: -4, scale: 0.9 },
										visible: {
											opacity: 1,
											y: 0,
											rotate: 0,
											scale: 1,
											transition: { type: "spring", stiffness: 420, damping: 16 },
										},
									}
						}
					>
						{word}
					</motion.span>
					{i < words.length - 1 && " "}
				</React.Fragment>
			))}
		</motion.h2>
	);
};

export default ChalkTitle;
