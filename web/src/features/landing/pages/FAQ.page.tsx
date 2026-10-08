import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import SubPage from "@features/landing/components/SubPage/SubPage.component";
import PageHero from "@features/landing/components/SubPage/PageHero.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import FaqItem from "@features/landing/ui/FaqItem.component";
import { FAQ_CATEGORIES, FAQ_ENTRIES } from "@features/landing/data/landing.data";
import type { FaqCategory } from "@features/landing/data/landing.data";
import { gsap, prefersReducedMotion, useGSAP } from "@features/landing/lib/gsap";
import { revealTitle, revealUp } from "@features/landing/lib/animations";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import "@features/landing/styles/FAQ.css";

/// Minuscules sans accents : « securite » trouve « Sécurité »
const normalize = (text: string) =>
	text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase();

/// Ancre d'une catégorie : « Sécurité » → #faq-securite (liens profonds)
const sectionId = (category: FaqCategory) => `faq-${normalize(category)}`;

/// Marge sous la navbar quand on saute à une catégorie
const CATEGORY_SCROLL_OFFSET = -110;

const FAQPage: React.FC = () => {
	const body = useRef<HTMLDivElement>(null);
	const { hash } = useLocation();
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<FaqCategory>(FAQ_CATEGORIES[0].name);

	// Questions qui correspondent à la recherche (question ou réponse)
	const matches = useMemo(() => {
		const needle = normalize(search.trim());
		if (!needle) return FAQ_ENTRIES;
		return FAQ_ENTRIES.filter((entry) => normalize(`${entry.question} ${entry.answer}`).includes(needle));
	}, [search]);

	const groups = FAQ_CATEGORIES.map((cat) => ({
		...cat,
		entries: matches.filter((entry) => entry.category === cat.name),
	})).filter((group) => group.entries.length > 0);

	// Catégories affichées, pour relancer le suivi de lecture quand la recherche en masque
	const visibleKey = groups.map((group) => group.name).join("|");

	// La catégorie surlignée doit rester visible (une recherche peut la masquer)
	const current = groups.some((group) => group.name === activeCategory) ? activeCategory : groups[0]?.name;

	// Suivi de lecture : la catégorie au tiers haut de l'écran s'allume à gauche
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((entry) => {
					if (entry.isIntersecting) setActiveCategory((entry.target as HTMLElement).dataset.category as FaqCategory);
				}),
			{ rootMargin: "-25% 0px -65% 0px" },
		);
		visibleKey.split("|").forEach((name) => {
			const el = name && document.getElementById(sectionId(name as FaqCategory));
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, [visibleKey]);

	// Arrivée sur une ancre (ex. /faq#faq-securite)
	useEffect(() => {
		if (!hash) return;
		const id = decodeURIComponent(hash.slice(1));
		const timer = window.setTimeout(() => scrollToSection(id, CATEGORY_SCROLL_OFFSET), 300);
		return () => window.clearTimeout(timer);
	}, [hash]);

	const goTo = (e: React.MouseEvent, category: FaqCategory) => {
		const id = sectionId(category);
		if (scrollToSection(id, CATEGORY_SCROLL_OFFSET)) e.preventDefault();
		setActiveCategory(category);
		history.replaceState(null, "", `#${id}`);
	};

	useGSAP(
		() => {
			if (prefersReducedMotion()) return;
			const q = gsap.utils.selector(body);
			// Sous 960 px, les catégories sont une rangée défilante qui rogne ce
			// qui dépasse : on fait monter la rangée entière, pas chaque pastille
			const mm = gsap.matchMedia();
			mm.add("(min-width: 961px)", () => revealUp(q(".lp-faq-cat"), q(".lp-faq-cats")[0]));
			mm.add("(max-width: 960px)", () => revealUp(q(".lp-faq-cats")));
			revealTitle(q(".lp-help-cta__title")[0]);
			gsap.from(q(".lp-help-cta"), {
				y: 60,
				scale: 0.96,
				opacity: 0,
				duration: 0.9,
				ease: "power3.out",
				scrollTrigger: { trigger: q(".lp-help-cta")[0], start: "top 88%", once: true },
			});
			gsap.from(q(".lp-help-cta__milo"), {
				yPercent: 40,
				rotate: -10,
				duration: 1,
				ease: "back.out(1.6)",
				scrollTrigger: { trigger: q(".lp-help-cta")[0], start: "top 80%", once: true },
			});
		},
		{ scope: body },
	);

	const hero = (
		<PageHero
			icon="speech_balloon"
			floats={["light_bulb", "sparkles"]}
			eyebrow="Aide & support"
			title={
				<>
					Une question&nbsp;? On a les <span className="lp-hl">réponses</span>
				</>
			}
			lead="Tout ce qu'il faut savoir sur Milo, pour accompagner votre enfant sereinement."
		>
			<div className="lp-faq-search">
				<Search size={22} aria-hidden="true" />
				<input
					type="search"
					placeholder="Rechercher un sujet (ex : abonnement, matières…)"
					aria-label="Rechercher dans la FAQ"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				{search && (
					<button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche">
						<X size={18} />
					</button>
				)}
			</div>
		</PageHero>
	);

	return (
		<SubPage hero={hero}>
			<div ref={body}>
				<div className="lp-faq-page">
					<nav className="lp-faq-page__aside" aria-labelledby="lp-faq-cats-label">
						<p className="lp-faq-page__aside-title" id="lp-faq-cats-label">
							Catégories
						</p>
						<div className="lp-faq-cats">
							{FAQ_CATEGORIES.map((cat) => {
								const count = groups.find((group) => group.name === cat.name)?.entries.length ?? 0;
								const isActive = cat.name === current;
								return (
									<a
										key={cat.name}
										href={`#${sectionId(cat.name)}`}
										className={`lp-faq-cat${isActive ? " is-active" : ""}${count === 0 ? " is-empty" : ""}`}
										aria-current={isActive ? "location" : undefined}
										aria-disabled={count === 0 || undefined}
										tabIndex={count === 0 ? -1 : undefined}
										onClick={(e) => (count === 0 ? e.preventDefault() : goTo(e, cat.name))}
									>
										<Emoji3D name={cat.icon} className="lp-faq-cat__icon" />
										<span className="lp-faq-cat__label">{cat.name}</span>
										<span className="lp-faq-cat__count">{count}</span>
									</a>
								);
							})}
						</div>
					</nav>

					<div className="lp-faq-page__results">
						{groups.map((group) => (
							<section
								key={group.name}
								id={sectionId(group.name)}
								data-category={group.name}
								className="lp-faq-group"
								aria-labelledby={`${sectionId(group.name)}-title`}
							>
								<h2 className="lp-faq-group__title" id={`${sectionId(group.name)}-title`}>
									<Emoji3D name={group.icon} />
									{group.name}
								</h2>
								<div className="lp-faq-group__list">
									{group.entries.map((entry, i) => (
										<FaqItem
											key={entry.question}
											question={entry.question}
											answer={entry.answer}
											icon={group.icon}
											className="lp-faq-page__item"
											style={{ "--i": i } as React.CSSProperties}
										/>
									))}
								</div>
							</section>
						))}

						{groups.length === 0 && (
							<div className="lp-faq-empty" role="status">
								<Emoji3D name="fox" className="lp-faq-empty__icon" />
								<p className="lp-faq-empty__title">Milo n'a rien trouvé…</p>
								<p>Essayez un autre mot, ou posez-nous directement votre question.</p>
								<button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => setSearch("")}>
									Effacer la recherche
								</button>
							</div>
						)}
					</div>
				</div>

				<section className="lp-help-cta" aria-labelledby="lp-help-cta-title">
					<div className="lp-help-cta__copy">
						<h2 className="lp-display lp-help-cta__title" id="lp-help-cta-title">
							Toujours bloqué&nbsp;?
						</h2>
						<p>Notre équipe est là pour vous aider. Écrivez-nous, on vous répond avec plaisir.</p>
						<Link to="/contact" className="lp-btn lp-btn--cream">
							Nous contacter <ArrowRight size={22} />
						</Link>
					</div>
					<img className="lp-help-cta__milo" src="/landing/milo-reading.webp" alt="" loading="lazy" />
				</section>
			</div>
		</SubPage>
	);
};

export default FAQPage;
