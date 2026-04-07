import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

const HeroSection: React.FC = () => {
	return (
		<main className="hero-wrapper">
			<div className="hero-text-side">
				<motion.h1
					className="hero-title"
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5, duration: 0.8 }}
				>
					Apprendre est un <span>jeu d'enfant.</span>
				</motion.h1>

				<motion.p
					className="hero-description"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.7, duration: 1 }}
				>
					Les révisions n'ont jamais été aussi amusantes qu'avec Milo. Chaque
					session de révision devient une aventure ludique et interactive.
				</motion.p>

				<motion.div className="hero-actions">
					<button className="btn-main">
						Rejoindre l'aventure <ArrowRight size={22} />
					</button>
					<button className="btn-ghost">Découvrir les fonctionnalités</button>
				</motion.div>
			</div>

			<div className="mascotte-container">
				<img src="/coursMilobg.png" alt="Milo" className="mascotte-img" />
			</div>

			<motion.div
				className="scroll-indicator"
				animate={{ y: [0, 15, 0] }}
				transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
			>
				<ChevronDown size={32} color="#F4922A" />
			</motion.div>
		</main>
	);
};

export default HeroSection;
