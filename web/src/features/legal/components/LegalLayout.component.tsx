import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, FileText } from "lucide-react";
import SubPage from "@features/landing/components/SubPage/SubPage.component";
import PageHero from "@features/landing/components/SubPage/PageHero.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import { LEGAL_DOCS, getLegalDoc } from "@features/legal/data/legal.docs";
import type { LegalSlug } from "@features/legal/data/legal.docs";
import "@features/legal/styles/Legal.css";

export interface LegalSection {
	/** Ancre de la section (sommaire, liens profonds /cgu#compte) */
	id: string;
	title: string;
	content: React.ReactNode;
}

interface LegalLayoutProps {
	slug: LegalSlug;
	floats: [Emoji3DName, Emoji3DName];
	title: React.ReactNode;
	lead: string;
	/** L'essentiel en quelques phrases simples, pour les élèves et les parents */
	summary: React.ReactNode[];
	sections: LegalSection[];
}

/// Gabarit des pages légales : même en-tête que la FAQ et le Contact,
/// un encadré « En bref », un sommaire qui suit la lecture, puis les
/// sections numérotées et les liens vers les autres documents.
const LegalLayout: React.FC<LegalLayoutProps> = ({ slug, floats, title, lead, summary, sections }) => {
	const doc = getLegalDoc(slug);
	const { hash } = useLocation();
	const [activeId, setActiveId] = useState(sections[0]?.id);

	useEffect(() => {
		document.title = `${doc.title} | Milo`;
	}, [doc.title]);

	// Sommaire : la section au tiers haut de l'écran est mise en avant
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => entries.forEach((entry) => entry.isIntersecting && setActiveId(entry.target.id)),
			{ rootMargin: "-25% 0px -65% 0px" },
		);
		sections.forEach(({ id }) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, [sections]);

	// Arrivée sur une ancre (ex. /confidentialite#droits)
	useEffect(() => {
		if (!hash) return;
		const id = decodeURIComponent(hash.slice(1));
		const timer = window.setTimeout(() => {
			if (!scrollToSection(id)) document.getElementById(id)?.scrollIntoView();
		}, 300);
		return () => window.clearTimeout(timer);
	}, [hash]);

	const goTo = (e: React.MouseEvent, id: string) => {
		if (scrollToSection(id)) e.preventDefault();
		history.replaceState(null, "", `#${id}`);
	};

	const toc = (
		<ol className="lg-toc-list">
			{sections.map((section, i) => (
				<li key={section.id}>
					<a
						href={`#${section.id}`}
						className={activeId === section.id ? "is-active" : ""}
						aria-current={activeId === section.id ? "location" : undefined}
						onClick={(e) => goTo(e, section.id)}
					>
						<span className="lg-toc-num">{i + 1}</span>
						{section.title}
					</a>
				</li>
			))}
		</ol>
	);

	const hero = (
		<PageHero icon={doc.icon} floats={floats} eyebrow="Informations légales" title={title} lead={lead}>
			<p className="lg-meta">
				<span>
					<CalendarDays size={16} aria-hidden="true" />
					Mise à jour le {doc.updatedAt}
				</span>
				<span>
					<FileText size={16} aria-hidden="true" />
					Version {doc.version}
				</span>
			</p>
		</PageHero>
	);

	return (
		<SubPage hero={hero} className="lg">
			<div className="lg-summary">
				<Emoji3D name="light_bulb" className="lg-summary-icon" />
				<div>
					<h2 className="lg-summary-title">En bref</h2>
					<ul>
						{summary.map((item, i) => (
							<li key={i}>
								<Check size={18} strokeWidth={3} aria-hidden="true" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="lg-body">
				<aside className="lg-toc" aria-label="Sommaire">
					<p className="lg-toc-title">Sommaire</p>
					{toc}
				</aside>

				{/* Mobile : sommaire repliable au-dessus du texte */}
				<details className="lg-toc-mobile">
					<summary>Sommaire</summary>
					{toc}
				</details>

				<article className="lg-article">
					{sections.map((section, i) => (
						<section key={section.id} id={section.id} className="lg-section" aria-labelledby={`${section.id}-title`}>
							<h2 id={`${section.id}-title`} className="lg-section-title">
								<span className="lg-section-num" aria-hidden="true">
									{i + 1}
								</span>
								{section.title}
							</h2>
							<div className="lg-prose">{section.content}</div>
						</section>
					))}
				</article>
			</div>

			<section className="lg-others" aria-labelledby="lg-others-title">
				<h2 className="lg-others-title" id="lg-others-title">
					Les autres documents
				</h2>
				<div className="lg-others-grid">
					{LEGAL_DOCS.filter((other) => other.slug !== slug).map((other) => (
						<Link key={other.slug} to={other.path} className="lg-doc-card">
							<Emoji3D name={other.icon} className="lg-doc-card-icon" />
							<span className="lg-doc-card-title">{other.title}</span>
							<span className="lg-doc-card-text">{other.description}</span>
						</Link>
					))}
				</div>
			</section>

			<div className="lg-help">
				<p>
					<strong>Une question sur ce document ?</strong> L'équipe Milo te répond.
				</p>
				<Link to="/contact" className="lp-btn lp-btn--primary lp-btn--sm">
					Nous contacter <ArrowRight size={18} aria-hidden="true" />
				</Link>
			</div>
		</SubPage>
	);
};

export default LegalLayout;
