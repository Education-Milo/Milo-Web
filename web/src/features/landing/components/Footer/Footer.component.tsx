import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Instagram, Linkedin } from "lucide-react";
import { LEGAL_DOCS } from "@features/legal/data/legal.docs";
import "@features/landing/styles/landing.css";
import "@features/landing/components/Footer/Footer.css";

const SOCIALS = [
	{ href: "https://www.instagram.com/milo_educ/", label: "Instagram", Icon: Instagram },
	{ href: "https://www.linkedin.com/company/107749290/", label: "LinkedIn", Icon: Linkedin },
	{ href: "https://linktr.ee/milo_education", label: "Linktree", Icon: ExternalLink },
];

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
		title: "Légal",
		links: LEGAL_DOCS.map((doc) => ({ to: doc.path, label: doc.shortTitle })),
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
						Milo transforme les révisions en jeu pour les collégiens, et les parents suivent leurs progrès.
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
				<span>Donner à chaque élève le pouvoir de réussir.</span>
			</div>
		</div>
	</footer>
);

export default Footer;
