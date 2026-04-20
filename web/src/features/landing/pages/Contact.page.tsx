import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
	Send,
	MessageSquare,
	User,
	Mail,
	HelpCircle,
	Sparkles,
	Star,
	Heart,
} from "lucide-react";
import "../styles/Contact.css";
import Footer from "@features/landing/components/Footer.component";
import Navbar from "@features/landing/components/Navbar/Navbar.component";

const ContactPage: React.FC = () => {
	const [focused, setFocused] = useState<string | null>(null);

	return (
		<div className="contact-root">
			<div className="contact-mesh"></div>

			<Navbar />

			<main className="contact-main">
				<motion.div
					className="faq-suggestion-banner"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<div className="faq-badge">ASTUCE</div>
					<p>
						Une question pressante ? N'hésitez pas à jeter un œil à notre{" "}
						<strong>
							<Link to="/faq">FAQ</Link>
						</strong>
						, la réponse s'y trouve peut-être déjà !
					</p>
				</motion.div>

				<motion.div
					className="deco-star"
					animate={{ rotate: 360 }}
					transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
				>
					<Star fill="#F4922A" color="#F4922A" size={40} />
				</motion.div>
				<motion.div
					className="deco-heart"
					animate={{ y: [0, -20, 0] }}
					transition={{ duration: 4, repeat: Infinity }}
				>
					<Heart fill="#EF4F1A" color="#EF4F1A" size={30} />
				</motion.div>

				<motion.div
					className="contact-glass-card"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", stiffness: 100, damping: 15 }}
				>
					<div className="contact-intro">
						<div className="badge-talk">
							<Sparkles size={14} /> On discute ?
						</div>
						<h1>
							Une question pour <span>Milo ?</span>
						</h1>
						<p>
							On adore recevoir du courrier. Que ce soit pour un bug, une idée
							de génie ou tout autre demande n'hésite pas à nous contacter !
						</p>
					</div>

					<form className="pimped-form" onSubmit={(e) => e.preventDefault()}>
						<div className="form-row">
							<div
								className={`pimped-group ${focused === "name" ? "focused" : ""}`}
							>
								<label>
									<User size={14} /> Ton nom
								</label>
								<input
									type="text"
									placeholder="Nom et prénom"
									onFocus={() => setFocused("name")}
									onBlur={() => setFocused(null)}
								/>
							</div>
							<div
								className={`pimped-group ${focused === "email" ? "focused" : ""}`}
							>
								<label>
									<Mail size={14} /> Ton email
								</label>
								<input
									type="email"
									placeholder="ton-email@gmail.com"
									onFocus={() => setFocused("email")}
									onBlur={() => setFocused(null)}
								/>
							</div>
						</div>

						<div
							className={`pimped-group ${focused === "subject" ? "focused" : ""}`}
						>
							<label>
								<HelpCircle size={14} /> De quoi s'agit-il ?
							</label>
							<select
								onFocus={() => setFocused("subject")}
								onBlur={() => setFocused(null)}
							>
								<option value="info">Informations générales</option>
								<option value="support">Besoin d'aide (Support)</option>
								<option value="press">Partenariats</option>
								<option value="betatest">Programme Beta-Testeur</option>
							</select>
						</div>

						<div
							className={`pimped-group ${focused === "message" ? "focused" : ""}`}
						>
							<label>
								<MessageSquare size={14} /> Ton message
							</label>
							<textarea
								rows={4}
								placeholder="Raconte-nous tout..."
								onFocus={() => setFocused("message")}
								onBlur={() => setFocused(null)}
							></textarea>
						</div>

						<motion.button
							className="btn-pimped-send"
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.97 }}
						>
							<span>Envoyer à l'équipe</span>
							<div className="icon-send-circle">
								<Send size={18} />
							</div>
						</motion.button>
					</form>
				</motion.div>
			</main>

			<Footer />
		</div>
	);
};

export default ContactPage;
