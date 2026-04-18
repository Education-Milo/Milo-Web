import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
	ChevronDown,
	MessageCircle,
	HelpCircle,
	ArrowLeft,
} from "lucide-react";
import Footer from "@features/landing/components/Footer.component";
import "@features/landing/styles/FAQ.css";

const FAQ_DATA = [
	{
		id: 1,
		cat: "Général",
		q: "C'est quoi exactement Milo ?",
		a: "Milo est une plateforme ludo-éducative qui transforme les révisions scolaires en une aventure épique pour les enfants de la Sixième à la Troisième.",
	},
	{
		id: 2,
		cat: "Compte",
		q: "Puis-je utiliser Milo sur plusieurs tablettes ?",
		a: "Oui ! Votre abonnement permet de connecter votre compte sur tous vos appareils (iOS, Android, Web).",
	},
	{
		id: 3,
		cat: "Sécurité",
		q: "Mes données sont-elles sécurisées ?",
		a: "Absolument. Milo est 100% conforme RGPD et nous ne diffusons aucune publicité, jamais.",
	},
	{
		id: 4,
		cat: "Général",
		q: "Quelles matières sont disponibles ?",
		a: "Mathématiques, Français, Histoire-Géo, Sciences et même une introduction au code !",
	},
	{
		id: 5,
		cat: "Compte",
		q: "Comment résilier mon abonnement ?",
		a: "La résiliation se fait en un clic depuis votre tableau de bord parent, sans engagement.",
	},
];

const FAQPage: React.FC = () => {
	const [search, setSearch] = useState("");
	const [activeCat, setActiveCat] = useState("Tous");
	const [openId, setOpenId] = useState<number | null>(null);

	const categories = ["Tous", "Général", "Compte", "Sécurité"];

	const filteredFaq = useMemo(() => {
		return FAQ_DATA.filter((item) => {
			const matchSearch = item.q.toLowerCase().includes(search.toLowerCase());
			const matchCat = activeCat === "Tous" || item.cat === activeCat;
			return matchSearch && matchCat;
		});
	}, [search, activeCat]);

	return (
		<div className="faq-root">
			<div className="faq-bg-gradient"></div>

			<nav className="contact-nav">
				<Link to="/" className="back-link-v2">
					<div className="back-icon">
						<ArrowLeft size={18} />
					</div>
					<span>Retour</span>
				</Link>
				<img src="/milo-logo2.png" alt="Milo" className="contact-logo-v2" />
			</nav>

			<main className="faq-main">
				<header className="faq-header">
					<motion.div
						className="faq-badge-v4"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
					>
						<HelpCircle size={14} /> Aide & Support
					</motion.div>
					<h1>
						Une question ? <br />
						<span>On a les réponses.</span>
					</h1>

					<div className="search-container-v4">
						<input
							type="text"
							placeholder="Rechercher un sujet (ex: abonnement, matières...)"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="filter-tabs">
						{categories.map((cat) => (
							<button
								key={cat}
								className={`tab-btn ${activeCat === cat ? "active" : ""}`}
								onClick={() => setActiveCat(cat)}
							>
								{cat}
							</button>
						))}
					</div>
				</header>

				<section className="faq-list">
					<AnimatePresence mode="popLayout">
						{filteredFaq.map((item) => (
							<motion.div
								key={item.id}
								layout
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95 }}
								className={`faq-item-v4 ${openId === item.id ? "open" : ""}`}
								onClick={() => setOpenId(openId === item.id ? null : item.id)}
							>
								<div className="faq-question">
									<span>{item.q}</span>
									<div className="chevron-box">
										<ChevronDown size={18} />
									</div>
								</div>
								<AnimatePresence>
									{openId === item.id && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											className="faq-answer"
										>
											<p>{item.a}</p>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						))}
					</AnimatePresence>
				</section>

				<div className="faq-cta">
					<div className="cta-box">
						<MessageCircle size={30} />
						<div>
							<h3>Toujours bloqué ?</h3>
							<p>Notre équipe est là pour vous aider.</p>
						</div>
						<Link to="/contact" className="btn-cta-contact">
							Nous contacter
						</Link>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default FAQPage;
