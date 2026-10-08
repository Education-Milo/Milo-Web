import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SECTION_IDS } from "@features/landing/data/landing.data";
import { scrollToSection } from "@features/landing/lib/smoothScroll";
import "@features/landing/styles/landing.css";
import "@features/landing/components/Navbar/Navbar.css";

/// Sections de la Vitrine suivies par le scrollspy
const SPY_SECTIONS = [SECTION_IDS.concept, SECTION_IDS.kids, SECTION_IDS.parents, SECTION_IDS.pricing];

type NavItem = { label: string } & ({ section: string } | { to: string });

const NAV_ITEMS: NavItem[] = [
	{ label: "Concept", section: SECTION_IDS.concept },
	{ label: "Pour les enfants", section: SECTION_IDS.kids },
	{ label: "Pour les parents", section: SECTION_IDS.parents },
	{ label: "Tarifs", section: SECTION_IDS.pricing },
	{ label: "FAQ", to: "/faq" },
	{ label: "Contact", to: "/contact" },
];

const Navbar: React.FC = () => {
	const { pathname } = useLocation();
	const isHome = pathname === "/";
	const [activeSection, setActiveSection] = useState<string>(SECTION_IDS.concept);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);

	// Ferme le menu mobile à chaque changement de page.
	useEffect(() => setIsMenuOpen(false), [pathname]);

	// Empêche le scroll du body quand le menu mobile est ouvert.
	useEffect(() => {
		document.body.style.overflow = isMenuOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isMenuOpen]);

	// Echap ferme le menu mobile
	useEffect(() => {
		if (!isMenuOpen) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMenuOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isMenuOpen]);

	// La vague se compacte dès qu'on quitte le haut de la page
	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 60);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// Scrollspy : la section au milieu de l'écran allume sa pilule
	useEffect(() => {
		if (!isHome) return;
		const observer = new IntersectionObserver(
			(entries) => entries.forEach((entry) => entry.isIntersecting && setActiveSection(entry.target.id)),
			{ rootMargin: "-45% 0px -50% 0px" },
		);
		SPY_SECTIONS.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, [isHome]);

	const isActive = (item: NavItem) =>
		"to" in item ? pathname === item.to : isHome && activeSection === item.section;

	const renderLink = (item: NavItem, onNavigate?: () => void) => {
		const className = `lp-pill${isActive(item) ? " is-active" : ""}`;
		if ("to" in item) {
			return (
				<Link to={item.to} className={className} onClick={onNavigate}>
					{item.label}
				</Link>
			);
		}
		// Sur la Vitrine : défilement fluide ; ailleurs : retour à la Vitrine sur l'ancre
		return (
			<Link
				to={`/#${item.section}`}
				className={className}
				onClick={(e) => {
					onNavigate?.();
					if (isHome && scrollToSection(item.section)) e.preventDefault();
				}}
			>
				{item.label}
			</Link>
		);
	};

	return (
		<header className={`lp lp-nav${isScrolled ? " is-scrolled" : ""}`}>
			<div className="lp-nav__waves" aria-hidden="true">
				<svg viewBox="0 0 1440 320" className="lp-nav__wave lp-nav__wave--orange" preserveAspectRatio="none">
					<path d="M0,64L80,80C160,96,320,128,480,133.3C640,139,800,117,960,101.3C1120,85,1280,75,1360,69.3L1440,64L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z" />
				</svg>
				<svg viewBox="0 0 1440 280" className="lp-nav__wave lp-nav__wave--white" preserveAspectRatio="none">
					<path d="M0,100L60,95.3C120,100,240,140,360,128.7C480,128,600,96,720,90.7C840,85,960,107,1080,117.3C1200,128,1320,128,1380,128L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z" />
				</svg>
			</div>

			<nav className="lp-nav__content" aria-label="Navigation principale">
				<Link
					to="/"
					className="lp-nav__logo"
					onClick={(e) => {
						if (isHome && scrollToSection(SECTION_IDS.concept)) e.preventDefault();
					}}
				>
					<img src="/landing/logo-milo-3d.webp" alt="Milo, accueil" />
				</Link>

				<ul className="lp-nav__pills">
					{NAV_ITEMS.map((item) => (
						<li key={item.label}>{renderLink(item)}</li>
					))}
				</ul>

				<div className="lp-nav__actions">
					<Link to="/login" className="lp-nav__login">
						Connexion
					</Link>
					<Link to="/register" className="lp-btn lp-btn--primary lp-btn--sm">
						Adopter Milo
					</Link>
				</div>

				<button
					type="button"
					className="lp-nav__burger"
					onClick={() => setIsMenuOpen((open) => !open)}
					aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
					aria-expanded={isMenuOpen}
					aria-controls="lp-mobile-menu"
				>
					{isMenuOpen ? <X size={26} /> : <Menu size={26} />}
				</button>
			</nav>

			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						id="lp-mobile-menu"
						className="lp-nav__mobile"
						initial={{ opacity: 0, y: -16, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -12, scale: 0.98 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
					>
						{NAV_ITEMS.map((item) => (
							<React.Fragment key={item.label}>{renderLink(item, () => setIsMenuOpen(false))}</React.Fragment>
						))}
						<div className="lp-nav__mobile-actions">
							<Link to="/login" className="lp-btn lp-btn--ghost">
								Connexion
							</Link>
							<Link to="/register" className="lp-btn lp-btn--primary">
								Adopter Milo
							</Link>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
};

export default Navbar;
