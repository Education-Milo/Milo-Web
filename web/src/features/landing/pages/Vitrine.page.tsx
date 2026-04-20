import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Footer from "@features/landing/components/Footer.component";
import Navbar from "@features/landing/components/Navbar/Navbar.component";
import {
	ArrowRight,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import "../styles/Vitrine.css";

const kidsFeatures = [
	{
		id: 1,
		title: "Apprends à <span>ta façon</span>",
		desc: "Importe tes propres cours pour que Milo s'adapte à la méthode de ton professeur. Profite d'exercices personnalisés selon tes centres d'intérêt et ta manière d'apprendre !",
		items: [
			"📚 Import de cours",
			"🧠 Exercices sur mesure",
			"🗂️ Flashcards intelligentes",
		],
		img: "/screen1.png",
	},
	{
		id: 2,
		title: "Défie tes <span>Amis</span>",
		desc: "Rien de tel qu'un peu de compétition pour progresser ! Participe à des duels en temps réel, réponds aux quiz quotidiens et grimpe tout en haut de la ligue.",
		items: [
			"⚔️ Duels en direct",
			"🏆 Ligues Bronze à Diamant",
			"🎯 Quizz quotidiens",
		],
		img: "/screen2.png",
	},
	{
		id: 3,
		title: "Ton Milo, <span>ton Style</span>",
		desc: "Gagne des pièces en réussissant tes quêtes et tes leçons. Utilise-les dans la boutique pour acheter des cosmétiques et personnaliser ton compagnon renard !",
		items: [
			"🦊 Mascotte unique",
			"💰 Système de Coins",
			"👕 Cosmétiques exclusifs",
		],
		img: "/screen3.png",
	},
];

const VitrinePage: React.FC = () => {
	const [currentIndex, setCurrentIndex] = useState(0);

	const nextFeature = () => {
		setCurrentIndex((prev) => (prev + 1) % kidsFeatures.length);
	};

	const prevFeature = () => {
		setCurrentIndex(
			(prev) => (prev - 1 + kidsFeatures.length) % kidsFeatures.length,
		);
	};

	return (
		<div className="vitrine-root">
			<div className="mesh-gradient">
				<div className="blob blob-1"></div>
				<div className="blob blob-2"></div>
			</div>

			<Navbar />

			<div className="hero-spacer"></div>

			{/* SECTION HERO */}
			<main className="hero-wrapper">
				<div className="hero-text-side">
					<motion.h1
						className="hero-title"
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.8 }}
					>
						Apprendre est un <span> jeu d'enfant.</span>
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

			{/* SECTION POUR LES ENFANTS DYNAMIQUE */}
			<section id="enfants" className="section-kids-v5">
				<div className="kids-container-v5">
					{/* LA CONSOLE DE JEU (Image Side) */}
					<motion.div
						className="kids-visual-frame"
						initial={{ opacity: 0, x: -100 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
					>
						<div className="game-console-border">
							<div className="screen-inner">
								<AnimatePresence mode="wait">
									<motion.img
										key={currentIndex}
										src={kidsFeatures[currentIndex].img}
										initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
										animate={{ opacity: 1, scale: 1, rotate: 0 }}
										exit={{ opacity: 0, scale: 1.2, rotate: 5 }}
										transition={{ type: "spring", damping: 12 }}
										alt="Milo Game App"
									/>
								</AnimatePresence>
							</div>
						</div>
						<div className="console-buttons">
							<button onClick={prevFeature} className="joy-btn">
								<ChevronLeft size={30} />
							</button>
							<div className="joy-stick"></div>
							<button onClick={nextFeature} className="joy-btn">
								<ChevronRight size={30} />
							</button>
						</div>
					</motion.div>

					{/* LE TEXTE D'AVENTURE (Content Side) */}
					<div className="kids-info-side">
						<AnimatePresence mode="wait">
							<motion.div
								key={currentIndex}
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -30 }}
								transition={{ duration: 0.5 }}
							>
								<div className="adventure-badge">MISSION ACTIVE</div>
								<h2
									className="kids-h2"
									dangerouslySetInnerHTML={{
										__html: kidsFeatures[currentIndex].title,
									}}
								/>
								<p className="kids-p-desc">{kidsFeatures[currentIndex].desc}</p>
								<div className="kids-tag-cloud">
									{kidsFeatures[currentIndex].items.map((item, idx) => (
										<motion.span
											key={idx}
											className="adventure-tag"
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ delay: 0.1 * idx }}
										>
											{item}
										</motion.span>
									))}
								</div>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</section>

			{/* SECTION POUR LES PARENTS */}
			<section id="parents" className="section-parents">
				<div className="parents-header">
					<motion.h2
						className="section-title center"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						L'allié des <span>Parents</span>
					</motion.h2>
					<p className="section-desc center">
						Suivez, accompagnez et sécurisez la progression de votre enfant en
						toute sérénité.
					</p>
				</div>

				{/* PARTIE 1 : FONCTIONNALITÉS PARENTS */}
				<div className="parents-grid">
					{[
						{
							title: "Suivi des Progrès",
							desc: "Gardez un œil sur le classement de votre enfant dans sa ligue et visualisez ses points forts en un clin d'œil.",
							icon: "📊",
							color: "#FFEDD5",
						},
						{
							title: "Planning Intelligent",
							desc: "Une IA analyse son emploi du temps scolaire pour lui proposer des sessions de révision parfaitement calibrées.",
							icon: "📅",
							color: "#E0F2FE",
						},
						{
							title: "Contrôle Parental",
							desc: "Gérez jusqu'à 4 profils enfants et supervisez leur activité 24h/24 en toute sécurité sur votre tableau de bord.",
							icon: "🛡️",
							color: "#F0FDF4",
						},
					].map((feat, idx) => (
						<motion.div
							key={idx}
							className="parent-card-dynamic"
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							whileHover={{ y: -15, scale: 1.02 }}
							transition={{ type: "spring", stiffness: 300 }}
						>
							<div
								className="card-bg-blob"
								style={{ backgroundColor: feat.color }}
							></div>
							<div className="card-icon-v4">{feat.icon}</div>
							<div className="card-content-v4">
								<h3>{feat.title}</h3>
								<p>{feat.desc}</p>
							</div>
							<div className="card-shine"></div>
						</motion.div>
					))}
				</div>

				{/* PARTIE 2 : FAQ IA SÉCURISÉE - VERSION PIMPÉE */}
				<div className="faq-section-v4">
					<div className="faq-header-v4">
						<div className="faq-badge-mini">CONFIANCE</div>
						<h3 className="faq-title-v4">
							Questions & <span>Réponses</span>
						</h3>
						<p>
							Tout ce que vous devez savoir pour accompagner votre enfant
							sereinement.
						</p>
					</div>

					<div className="faq-grid-v4">
						{[
							{
								q: "Est-ce que Milo fait les devoirs à sa place ?",
								a: "Non, Milo est un tuteur qui guide par le questionnement. Il ne donnera jamais la réponse directe, mais aidera l'enfant à cheminer vers la solution.",
								icon: "🎓",
							},
							{
								q: "Le contenu est-il sécurisé ?",
								a: "Absolument. Notre IA est bridée pour un usage strictement scolaire. Aucun échange entre utilisateurs n'est possible sur la plateforme.",
								icon: "🛡️",
							},
							{
								q: "Comment sont protégées les données ?",
								a: "Conformité RGPD totale. Nous ne vendons aucune donnée et l'anonymat de l'enfant est notre priorité absolue.",
								icon: "🔒",
							},
							{
								q: "Pourquoi Milo et pas une IA classique ?",
								a: "Milo est conçu pour la pédagogie enfantine : ton adapté, analyse des faiblesses et ludification des leçons pour un engagement maximal.",
								icon: "🚀",
							},
						].map((item, idx) => {
							const [isOpen, setIsOpen] = React.useState(false);
							return (
								<motion.div
									key={idx}
									className={`faq-card-v4 ${isOpen ? "active" : ""}`}
									onClick={() => setIsOpen(!isOpen)}
									layout
								>
									<div className="faq-card-top">
										<div className="faq-icon-circle">{item.icon}</div>
										<h4>{item.q}</h4>
										<motion.div
											className="faq-chevron"
											animate={{ rotate: isOpen ? 180 : 0 }}
										>
											<ChevronDown size={20} />
										</motion.div>
									</div>
									<AnimatePresence>
										{isOpen && (
											<motion.div
												className="faq-card-body"
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
											>
												<p>{item.a}</p>
											</motion.div>
										)}
									</AnimatePresence>
								</motion.div>
							);
						})}
					</div>

					<div className="faq-more-container">
						<Link to="/faq" style={{ textDecoration: "none" }}>
							<motion.button
								className="btn-faq-explorer-v4"
								whileHover={{ scale: 1.05, y: -5 }}
								whileTap={{ scale: 0.95 }}
							>
								<span>
									Retrouvez toutes vos questions dans notre section FAQ
								</span>
								<ArrowRight size={20} />
							</motion.button>
						</Link>
					</div>
				</div>

				{/* PARTIE 3 : ABONNEMENTS */}
				<div className="pricing-section">
					<div className="pricing-grid">
						{/* PACK ESSENTIEL */}
						<motion.div
							className="price-card basic-pimped"
							whileHover={{ y: -20 }}
						>
							<div className="badge-price-v3">Essentiel</div>
							<div className="price-v3">
								19€<span>/mois</span>
							</div>
							<ul className="price-features-v3">
								<li>✨ Accès à tous les cours</li>
								<li>🎯 Quiz / Flashcards illimités</li>
								<li>🧠 Discussions avec Milo en illimité</li>
								<li>⚔️ Accès aux Duels</li>
								<li>👤 1 profil enfant et parent</li>
							</ul>
							<button className="btn-price-v3 basic btn-glint">
								<span>C'est parti !</span>
							</button>
						</motion.div>

						{/* PACK FAMILLE */}
						<motion.div
							className="price-card family-pimped featured"
							whileHover={{ y: -20 }}
						>
							<div className="parent-choice-tag">🏆 CHOIX DES PARENTS</div>
							<div className="badge-price-v3 blue">Famille</div>
							<div className="price-v3 blue">
								35€<span>/mois</span>
							</div>
							<ul className="price-features-v3">
								<li>🌈 Tout le plan Essentiel</li>
								<li>👨‍👩‍👧‍👦 Jusqu'à 4 enfants</li>
								<li>📊 Dashboard Parent avancé</li>
								<li>👔 Cosmétiques exclusives pour Milo</li>
							</ul>
							<button className="btn-price-v3 family btn-glint">
								<span>Adopter Milo pour toute la famille !</span>
							</button>
						</motion.div>
					</div>
				</div>
			</section>
			<Footer />
		</div>
	);
};

export default VitrinePage;
