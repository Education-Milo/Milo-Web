import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@features/landing/components/Navbar/Navbar.component";
import Footer from "@features/landing/components/Footer/Footer.component";
import Hero from "@features/landing/components/Hero/Hero.component";
import Manifesto from "@features/landing/components/Manifesto/Manifesto.component";
import Bands from "@features/landing/components/Bands/Bands.component";
import Missions from "@features/landing/components/Missions/Missions.component";
import ParentsStack from "@features/landing/components/ParentsStack/ParentsStack.component";
import FaqPreview from "@features/landing/components/FaqPreview/FaqPreview.component";
import Pricing from "@features/landing/components/Pricing/Pricing.component";
import FinalCta from "@features/landing/components/FinalCta/FinalCta.component";
import { useSmoothScroll } from "@features/landing/hooks/useSmoothScroll";
import { ScrollTrigger, gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import "@features/landing/styles/landing.css";
import "@features/landing/styles/Vitrine.css";

/// Page d'accueil publique.
/// L'ordre des sections compte : les sections épinglées (Hero, Manifesto,
/// Missions) créent leurs ScrollTrigger dans l'ordre de la page.
const VitrinePage: React.FC = () => {
	const root = useRef<HTMLDivElement>(null);
	const { hash } = useLocation();
	useSmoothScroll();

	// Barre de progression de lecture
	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			gsap.to(".lp-scroll-progress", {
				scaleX: 1,
				ease: "none",
				scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
			});
		},
		{ scope: root },
	);

	// Les positions dépendent des polices (titres en Luckiest Guy)
	useEffect(() => {
		let cancelled = false;
		document.fonts.ready.then(() => {
			if (!cancelled) ScrollTrigger.refresh();
		});
		return () => {
			cancelled = true;
		};
	}, []);

	// Arrivée depuis une autre page sur une ancre (ex. /#parents)
	useEffect(() => {
		if (!hash) return;
		const id = decodeURIComponent(hash.slice(1));
		const timer = window.setTimeout(() => scrollToSection(id), 300);
		return () => window.clearTimeout(timer);
	}, [hash]);

	return (
		<div className="lp lp-root" ref={root}>
			<div className="lp-scroll-progress" aria-hidden="true" />
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
					<ChevronDown size={32} color="var(--milo-orange)" />
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
				</div>

				{/* PARTIE 1 : FONCTIONNALITÉS PARENTS */}
				<div className="parents-grid">
					{[
						{
							title: "Suivi des Progrès",
							desc: "Gardez un œil sur le classement de votre enfant dans sa ligue et visualisez ses points forts en un clin d'œil.",
							icon: "📊",
							color: "var(--milo-creme)",
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
							color: "var(--ok-bg)",
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
				</section>
				<FinalCta />
			</main>
			<Footer />
		</div>
	);
};

export default VitrinePage;
