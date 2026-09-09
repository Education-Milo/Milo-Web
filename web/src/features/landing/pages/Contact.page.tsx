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
	CheckCircle2,
	AlertCircle,
} from "lucide-react";
import "../styles/Contact.css";
import Footer from "@features/landing/components/Footer/Footer.component";
import Navbar from "@features/landing/components/Navbar/Navbar.component";

const CONTACT_EMAIL = "miloeducationeip@gmail.com";
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as
	| string
	| undefined;

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const ContactPage: React.FC = () => {
	const [focused, setFocused] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "info",
		message: "",
	});
	const [status, setStatus] = useState<SubmitStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleChange = (
		field: keyof typeof formData,
		value: string
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name || !formData.email || !formData.message) {
			setStatus("error");
			setErrorMessage("Merci de remplir tous les champs avant d'envoyer.");
			return;
		}

		if (!WEB3FORMS_ACCESS_KEY) {
			setStatus("error");
			setErrorMessage(
				"L'envoi n'est pas encore configuré. Contacte-nous directement à " +
					CONTACT_EMAIL
			);
			return;
		}

		setStatus("submitting");
		setErrorMessage(null);

		try {
			const response = await fetch("https://api.web3forms.com/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					access_key: WEB3FORMS_ACCESS_KEY,
					to: CONTACT_EMAIL,
					name: formData.name,
					email: formData.email,
					subject: `[Contact Milo] ${formData.subject}`,
					message: formData.message,
				}),
			});

			const result = await response.json();

			if (result.success) {
				setStatus("success");
				setFormData({ name: "", email: "", subject: "info", message: "" });
			} else {
				setStatus("error");
				setErrorMessage(
					result.message || "Une erreur est survenue, réessaie plus tard."
				);
			}
		} catch {
			setStatus("error");
			setErrorMessage(
				"Impossible d'envoyer le message pour le moment. Réessaie plus tard."
			);
		}
	};

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

					<form className="pimped-form" onSubmit={handleSubmit}>
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
									value={formData.name}
									onChange={(e) => handleChange("name", e.target.value)}
									onFocus={() => setFocused("name")}
									onBlur={() => setFocused(null)}
									required
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
									value={formData.email}
									onChange={(e) => handleChange("email", e.target.value)}
									onFocus={() => setFocused("email")}
									onBlur={() => setFocused(null)}
									required
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
								value={formData.subject}
								onChange={(e) => handleChange("subject", e.target.value)}
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
								value={formData.message}
								onChange={(e) => handleChange("message", e.target.value)}
								onFocus={() => setFocused("message")}
								onBlur={() => setFocused(null)}
								required
							></textarea>
						</div>

						{status === "success" && (
							<motion.div
								className="form-status form-status-success"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
							>
								<CheckCircle2 size={18} />
								<span>
									Merci ! Ton message a bien été envoyé, on te répond vite.
								</span>
							</motion.div>
						)}

						{status === "error" && (
							<motion.div
								className="form-status form-status-error"
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
							>
								<AlertCircle size={18} />
								<span>{errorMessage}</span>
							</motion.div>
						)}

						<motion.button
							type="submit"
							className="btn-pimped-send"
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.97 }}
							disabled={status === "submitting"}
						>
							<span>
								{status === "submitting" ? "Envoi en cours..." : "Envoyer à l'équipe"}
							</span>
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
