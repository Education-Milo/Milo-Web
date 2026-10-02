import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Instagram, Linkedin } from "lucide-react";
import "@features/landing/styles/landing.css";
import "@features/landing/components/Footer/Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="vitrine-footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,160L80,154.7C160,149,320,139,480,110.7C640,82,800,40,960,60.3C1120,81,1280,150,1360,170.3L1440,190L1440,300L1360,300C1280,300,1120,300,960,300C800,300,640,300,480,300C320,300,160,300,80,300L0,300Z"></path>
        </svg>
      </div>
      
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <img src="/milo-logo.webp" alt="Milo Logo" className="footer-logo" />
            <p>L'IA qui transforme les révisions en une aventure épique pour les enfants et une sérénité pour les parents.</p>
            <div className="footer-socials">
            <a 
                href="https://www.instagram.com/milo_educ/" 
                target="_blank" 
                rel="noopener noreferrer"
                >
                <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/company/107749290/" target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
            </a>
              <a href="https://linktr.ee/milo_education" target="_blank" rel="noopener noreferrer" className="linktree-pill">
                    <ExternalLink size={20} />
              </a>
            </div>
          </div>

const COLUMNS = [
	{
		title: "Exploration",
		links: [
			{ to: "/#concept", label: "Concept" },
			{ to: "/#enfants", label: "Enfants" },
			{ to: "/#parents", label: "Parents" },
		],
	},
	{
		title: "Sécurité",
		links: [
			{ to: "/confidentialite", label: "Confidentialité" },
			{ to: "/charte", label: "Charte IA" },
			{ to: "/mentions", label: "Légal" },
		],
	},
	{
		title: "Support",
		links: [
			{ to: "/contact", label: "Contact" },
			{ to: "/faq", label: "FAQ" },
		],
	},
];

const Footer: React.FC = () => (
	<footer className="lp lp-footer">
		<div className="lp-wrap">
			<div className="lp-footer__grid">
				<div className="lp-footer__brand">
					<img className="lp-footer__logo" src="/landing/logo-milo-3d.webp" alt="Milo" loading="lazy" />
					<p>
						L'IA qui transforme les révisions en une aventure épique pour les enfants et en sérénité pour
						les parents.
					</p>
					<div className="lp-footer__socials">
						{SOCIALS.map(({ href, label, Icon }) => (
							<a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
								<Icon size={20} />
							</a>
						))}
					</div>
				</div>

				<nav className="lp-footer__cols" aria-label="Pied de page">
					{COLUMNS.map((col) => (
						<div key={col.title}>
							<h4>{col.title}</h4>
							{col.links.map((link) => (
								<Link key={link.label} to={link.to}>
									{link.label}
								</Link>
							))}
						</div>
					))}
				</nav>
			</div>

			<div className="lp-footer__bottom">
				<span>© {new Date().getFullYear()} — Milo Education</span>
				<span>
					<span className="lp-footer__dot" aria-hidden="true" />
					Donner à chaque élève le pouvoir de réussir.
				</span>
			</div>
		</div>
	</footer>
);

export default Footer;
