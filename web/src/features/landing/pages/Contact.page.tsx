import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, HelpCircle, Mail, MessageSquare, Send, User } from "lucide-react";
import SubPage from "@features/landing/components/SubPage/SubPage.component";
import PageHero from "@features/landing/components/SubPage/PageHero.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { CONTACT_EMAIL, CONTACT_SUBJECTS } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle } from "@features/landing/lib/animations";
import "@features/landing/styles/Contact.css";

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined;

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMPTY_FORM = { name: "", email: "", subject: CONTACT_SUBJECTS[0].value, message: "" };

const ContactPage: React.FC = () => {
	const body = useRef<HTMLDivElement>(null);
	const [formData, setFormData] = useState(EMPTY_FORM);
	const [status, setStatus] = useState<SubmitStatus>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleChange = (field: keyof typeof formData, value: string) => {
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
			setErrorMessage("L'envoi n'est pas encore configuré. Contacte-nous directement à " + CONTACT_EMAIL);
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
				setFormData(EMPTY_FORM);
			} else {
				setStatus("error");
				setErrorMessage(result.message || "Une erreur est survenue, réessaie plus tard.");
			}
		} catch {
			setStatus("error");
			setErrorMessage("Impossible d'envoyer le message pour le moment. Réessaie plus tard.");
		}
	};

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(body);
			revealTitle(q(".lp-contact-form__title")[0]);
			gsap.from(q(".lp-contact-form"), { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.2 });
			gsap.from(q(".lp-contact-aside > *"), {
				x: 60,
				opacity: 0,
				duration: 0.8,
				stagger: 0.12,
				delay: 0.35,
				ease: "power3.out",
			});
			gsap.from(q(".lp-contact-mail__milo"), {
				yPercent: 45,
				rotate: -10,
				duration: 1,
				delay: 0.7,
				ease: "back.out(1.6)",
			});
		},
		{ scope: body },
	);

	const hero = (
		<PageHero
			icon="fox"
			floats={["speech_balloon", "star"]}
			eyebrow="On discute ?"
			title={
				<>
					Une question pour <span className="lp-hl">Milo</span>&nbsp;?
				</>
			}
			lead="On adore recevoir du courrier. Que ce soit pour un bug, une idée de génie ou tout autre demande, n'hésite pas à nous contacter !"
		/>
	);

	return (
		<SubPage hero={hero}>
			<div className="lp-contact" ref={body}>
				<form className="lp-contact-form" onSubmit={handleSubmit}>
					<h2 className="lp-display lp-contact-form__title">Écris-nous</h2>

					<div className="lp-contact-form__row">
						<label className="lp-field">
							<span className="lp-field__label">
								<User size={16} aria-hidden="true" /> Ton nom
							</span>
							<input
								type="text"
								placeholder="Nom et prénom"
								autoComplete="name"
								value={formData.name}
								onChange={(e) => handleChange("name", e.target.value)}
								required
							/>
						</label>
						<label className="lp-field">
							<span className="lp-field__label">
								<Mail size={16} aria-hidden="true" /> Ton email
							</span>
							<input
								type="email"
								placeholder="ton-email@gmail.com"
								autoComplete="email"
								value={formData.email}
								onChange={(e) => handleChange("email", e.target.value)}
								required
							/>
						</label>
					</div>

					<fieldset className="lp-field lp-subjects">
						<legend className="lp-field__label">
							<HelpCircle size={16} aria-hidden="true" /> De quoi s'agit-il ?
						</legend>
						<div className="lp-subjects__grid">
							{CONTACT_SUBJECTS.map((subject) => (
								<label
									key={subject.value}
									className={`lp-subject${formData.subject === subject.value ? " is-active" : ""}`}
								>
									<input
										type="radio"
										name="subject"
										value={subject.value}
										checked={formData.subject === subject.value}
										onChange={() => handleChange("subject", subject.value)}
									/>
									<Emoji3D name={subject.icon} className="lp-subject__icon" />
									<span>{subject.label}</span>
								</label>
							))}
						</div>
					</fieldset>

					<label className="lp-field">
						<span className="lp-field__label">
							<MessageSquare size={16} aria-hidden="true" /> Ton message
						</span>
						<textarea
							rows={5}
							placeholder="Raconte-nous tout..."
							value={formData.message}
							onChange={(e) => handleChange("message", e.target.value)}
							required
							data-lenis-prevent
						/>
					</label>

					{status === "success" && (
						<div className="lp-contact-status lp-contact-status--success" role="status">
							<CheckCircle2 size={20} aria-hidden="true" />
							<span>Merci ! Ton message a bien été envoyé, on te répond vite.</span>
						</div>
					)}

					{status === "error" && (
						<div className="lp-contact-status lp-contact-status--error" role="alert">
							<AlertCircle size={20} aria-hidden="true" />
							<span>{errorMessage}</span>
						</div>
					)}

					<button type="submit" className="lp-btn lp-btn--primary lp-contact-form__submit" disabled={status === "submitting"}>
						{status === "submitting" ? "Envoi en cours..." : "Envoyer à l'équipe"}
						<Send size={20} aria-hidden="true" />
					</button>
				</form>

				<aside className="lp-contact-aside">
					<div className="lp-contact-tip">
						<Emoji3D name="light_bulb" className="lp-contact-tip__icon" />
						<span className="lp-contact-tip__badge">Astuce</span>
						<p>Une question pressante ? La réponse se trouve peut-être déjà dans notre FAQ.</p>
						<Link to="/faq" className="lp-btn lp-btn--ghost lp-btn--sm">
							Voir la FAQ <ArrowRight size={18} />
						</Link>
					</div>

					<div className="lp-contact-mail">
						<div className="lp-contact-mail__copy">
							<p className="lp-display lp-contact-mail__title">Plutôt par mail&nbsp;?</p>
							<p>Écris-nous directement, on lit tout.</p>
							<a href={`mailto:${CONTACT_EMAIL}`} className="lp-contact-mail__link">
								{CONTACT_EMAIL}
							</a>
						</div>
						<img className="lp-contact-mail__milo" src="/landing/milo-reading.webp" alt="" loading="lazy" />
					</div>
				</aside>
			</div>
		</SubPage>
	);
};

export default ContactPage;
