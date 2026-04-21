import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown, MessageCircle, HelpCircle } from "lucide-react";
import Navbar from "@features/landing/components/Navbar/Navbar.component";
import Footer from "@features/landing/components/Footer/Footer.component";
import "../styles/FAQ.css";

const FAQ_DATA = [
	{
		id: 1,
		cat: "Général",
		q: "C'est quoi exactement Milo ?",
		a: "Milo est une plateforme ludo-éducative interactive qui transforme les révisions scolaires en une aventure pour les enfants de la 6ème à la 3ème.",
	},
	{
		id: 4,
		cat: "Général",
		q: "Quelles matières sont disponibles ?",
		a: "Toutes les matières présentes dans le programme de l'éducation nationnale sont disponibles. ",
	},
	{
		id: 6,
		cat: "Général",
		q: "Milo est-il conforme au programme de l'Éducation Nationale ?",
		a: "Oui, tous nos contenus sont conçus pour suivre scrupuleusement le programme officiel français par niveau scolaire. Les changements dans le programme se font automatiquement !",
	},
	{
		id: 7,
		cat: "Général",
		q: "Est-ce que Milo peut aider pour les devoirs du soir ?",
		a: "Absolument ! Milo agit comme un tuteur, un professeur particulier: il peut expliquer un énoncé d'exercice ou une leçon que l'enfant n'a pas comprise à l'école. Il l'aidera à résoudre ses exercices, lui réexpliquera les notions qu'il n'a pas compris et lui donnera des exercices basés sur ses centres d'intérêts ainsi que sur sa manière d'apprendre.",
	},
	{
		id: 8,
		cat: "Général",
		q: "Faut-il une connexion internet pour utiliser Milo ?",
		a: "Oui, une connexion est nécessaire pour que l'IA puisse interagir en temps réel et pour synchroniser la progression de l'enfant.",
	},
	{
		id: 9,
		cat: "Général",
		q: "Milo est-il disponible sur smartphone ?",
		a: "Oui, l'application est optimisée pour tablettes (recommandé pour le confort) et pour smartphones iOS et Android.",
	},
	{
		id: 10,
		cat: "Général",
		q: "Qu'est-ce qui différencie Milo d'un simple cahier de vacances ?",
		a: "L'interactivité ! Milo répond aux questions de l'enfant oralement ou par écrit et adapte la difficulté en fonction de ses réussites. Les exercices sont disponibles en illimités pour l'enfant et le contexte est beaucoup plus amusant.",
	},

	// === SECTION : PÉDAGOGIE & DYS (Le cœur du projet) ===
	{
		id: 11,
		cat: "Pédagogie",
		q: "Comment Milo aide-t-il les enfants dyslexiques ?",
		a: "Milo intègre des polices spécifiques (OpenDyslexic), des espacements adaptés et une lecture audio systématique de tous les textes.",
	},
	{
		id: 12,
		cat: "Pédagogie",
		q: "Mon enfant a des troubles de la dyscalculie, Milo est-il adapté ?",
		a: "Oui, nous utilisons des méthodes de visualisation concrètes et des décompositions d'étapes simplifiées pour les concepts mathématiques.",
	},
	{
		id: 13,
		cat: "Pédagogie",
		q: "Comment fonctionne l'importation de cours ?",
		a: "C'est magique ! Prenez en photo la leçon du cahier, et Milo l'analyse pour créer des quiz et des fiches de révisions personnalisées sur ce contenu précis.",
	},
	{
		id: 14,
		cat: "Pédagogie",
		q: "Milo donne-t-il les réponses trop facilement ?",
		a: "Non. Sa pédagogie est basée sur l'étayage : il donne des indices et pose des questions intermédiaires pour faire cheminer l'enfant vers la solution. L'enfant n'aura jamais la réponse à son exercice, il aura simplement de l'aide dans le cheminement pour réussir l'exercice donné par le professeur. Si un exercice est généré par Milo, l'enfant aura la possibilité de vérifier si son résultat est bon, mais cela est uniquement disponible pour ceux crées par Milo pour s'entrainer.",
	},
	{
		id: 15,
		cat: "Pédagogie",
		q: "Peut-on utiliser Milo pour apprendre les langues étrangères ?",
		a: "Oui, Milo propose des modules d'apprentissage pour les langues disponibles dans le programme scolaire du collège. (Anglais, Italien, Espagnol, Allemand)",
	},
	{
		id: 16,
		cat: "Pédagogie",
		q: "Comment l'IA de Milo sait-elle si l'enfant s'ennuie ?",
		a: "L'algorithme analyse le temps de réponse et le taux de réussite. Si c'est trop facile, Milo corse le défi ; si c'est trop dur, il simplifie les explications.",
	},

	// === SECTION : JEU & MOTIVATION (Gamification) ===
	{
		id: 17,
		cat: "Jeu",
		q: "C'est quoi le système de personnalisation de Milo ?",
		a: "En réussissant ses exercices, l'enfant gagne des pièces pour acheter des chapeaux, des vêtements ou des décors pour son compagnon Milo. Le but est d'avoir une satisfaction à la réussite d'un exercice, récompenser l'enfant et pousser la gamification à son paroxysme ",
	},
	{
		id: 18,
		cat: "Jeu",
		q: "Comment fonctionnent les Duels ?",
		a: "L'enfant peut défier ses amis (ou d'autres élèves de son niveau) sur des quiz rapides de 10 questions. C'est 100% sécurisé et sans chat libre.",
	},
	{
		id: 19,
		cat: "Jeu",
		q: "Quelles sont les récompenses journalières ?",
		a: "Chaque jour, une 'Mission de Milo' est proposée. La compléter permet de gagner des pièces bonus, des cosmétiques... Nous souhaitons derrière ce système que l'enfant soit heureux de venir travailler avec Milo et ne voit pas ça comme une corvée.",
	},
	{
		id: 20,
		cat: "Jeu",
		q: "Y a-t-il un classement entre les élèves ?",
		a: "Il existe des ligues (Bronze, Argent, Or...). L'enfant progresse dans sa ligue à son rythme, ce qui favorise une compétition saine et motivante.",
	},
	{
		id: 21,
		cat: "Jeu",
		q: "À quoi servent les points et les victoires ?",
		a: "Tes points te permettent de grimper dans le classement des ligues (Bronze, Argent, Or...) et de débloquer des récompenses uniques pour personnaliser ton Milo et ton profil !",
	},
	{
		id: 22,
		cat: "Jeu",
		q: "Mon enfant est très compétitif, comment éviter les frustrations ?",
		a: "Milo ajuste automatiquement les adversaires en Duel pour que les matchs soient équilibrés. De plus, les récompenses sont aussi basées sur la participation et l'effort, pas seulement sur la victoire.",
	},

	// === SECTION : COMPTE & ABONNEMENT (Côté Parents) ===
	{
		id: 2,
		cat: "Compte",
		q: "Puis-je utiliser Milo sur plusieurs tablettes ?",
		a: "Oui ! Votre abonnement permet de connecter votre compte sur tous vos appareils (iOS, Android, Web).",
	},
	{
		id: 5,
		cat: "Compte",
		q: "Comment résilier mon abonnement ?",
		a: "La résiliation se fait en un clic depuis votre tableau de bord parent, sans engagement.",
	},
	{
		id: 23,
		cat: "Compte",
		q: "Puis-je avoir plusieurs profils enfants sur un seul compte ?",
		a: "Le plan 'Famille' permet de créer jusqu'à 4 profils distincts, chacun avec sa propre progression et son niveau scolaire. Si vous souscrivez au plan Individuel, un seul enfant pourra bénéficier de Milo. Attention, faire travailler plusieurs enfants sur un seul Milo est contre-productif, même des frères et soeurs n'ont pas la même méthode d'apprentissage, Milo ne pourra pas élaborer un planning de révision ainsi que comprendre l'enfant. La spécificité de Milo est d'avoir un accompagnant qui comprend l'enfant à qui il est affecté.",
	},
	{
		id: 24,
		cat: "Compte",
		q: "Quelles sont les méthodes de paiement acceptées ?",
		a: "Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal et les paiements via Apple Pay / Google Pay.",
	},
	{
		id: 25,
		cat: "Compte",
		q: "Existe-t-il une période d'essai gratuite ?",
		a: "Oui, nous offrons 7 jours d'essai complet pour tester toutes les fonctionnalités de Milo avec votre enfant.",
	},
	{
		id: 26,
		cat: "Compte",
		q: "Le tableau de bord parent est-il détaillé ?",
		a: "Très ! Vous recevez un rapport hebdomadaire par mail et pouvez voir en temps réel les forces et faiblesses de votre enfant par matière.",
	},
	{
		id: 27,
		cat: "Compte",
		q: "Puis-je mettre l'abonnement en pause pendant les vacances ?",
		a: "Non, Milo travaille également pendant les vacances. Ces périodes sont très néfastes pour les enfants qui négligent les révisions quotidiennes, en quelques QCM qui prennent 5 min par jour, l'enfant maintient un rythme de travail régulier qui lui permet de ne rien oublier.",
	},

	// === SECTION : SÉCURITÉ & CONFIDENTIALITÉ (Confiance) ===
	{
		id: 3,
		cat: "Sécurité",
		q: "Mes données sont-elles sécurisées ?",
		a: "Absolument. Milo est 100% conforme RGPD et nous ne diffusons aucune publicité, jamais. Nous faisons très attention aux données et encore plus quand cela concerne nos enfants ou des données sensibles.",
	},
	{
		id: 28,
		cat: "Sécurité",
		q: "L'IA peut-elle dire des choses inappropriées ?",
		a: "Non. Notre IA est bridée par des filtres de sécurité stricts ('guardrails') qui l'empêchent de sortir du cadre strictement scolaire et bienveillant. Plusieurs tests ont été réalisé pour affirmer cette information.",
	},
	{
		id: 29,
		cat: "Sécurité",
		q: "Vendez-vous les données à des tiers ?",
		a: "Jamais. Les données de progression ne servent qu'à l'amélioration de l'apprentissage de votre enfant.",
	},
	{
		id: 30,
		cat: "Sécurité",
		q: "Est-ce que l'enfant peut naviguer sur internet via Milo ?",
		a: "Non, Milo est un environnement fermé (clôturé). Aucun lien externe n'est accessible pour l'enfant.",
	},
	{
		id: 31,
		cat: "Sécurité",
		q: "Comment l'identité des autres enfants est-elle protégée ?",
		a: "Dans les modes duels, seuls les prénoms (seulement) et les avatars sont visibles. Aucune information personnelle autre que le prénom n'est partagée.",
	},
	{
		id: 32,
		cat: "Sécurité",
		q: "Où sont stockées nos données ?",
		a: "Toutes nos données sont hébergées sur des serveurs sécurisés situés en France.",
	},
];

const FAQPage: React.FC = () => {
	const [search, setSearch] = useState("");
	const [activeCat, setActiveCat] = useState("Tous");
	const [openId, setOpenId] = useState<number | null>(null);

	const categories = [
		"Tous",
		"Général",
		"Compte",
		"Sécurité",
		"Pédagogie",
		"Jeu",
	];

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

			<Navbar />

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
