import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const SITE = "Milo";

/**
 * Titre de chaque route (WCAG 2.4.2). Les routes absentes gardent le titre
 * posé par la page elle-même (pages légales) ou le titre par défaut.
 * Premier motif trouvé gagne : du plus précis au plus général.
 */
const TITLES: [match: string | RegExp, title: string][] = [
	["/", "Milo, le compagnon qui fait aimer réviser"],
	["/login", "Connexion"],
	[/^\/register(\/|$)/, "Créer un compte"],
	["/forgot-password", "Mot de passe oublié"],
	["/profiles/manage", "Gérer les profils"],
	["/profiles", "Qui est-ce ?"],
	["/faq", "Questions fréquentes"],
	["/contact", "Contact"],
	["/home", "Accueil"],
	["/milo", "Discuter avec Milo"],
	[/^\/courses\/[^/]+/, "Parcours de cours"],
	["/courses", "Cours"],
	[/^\/course-milo\/[^/]+\/question-ouverte/, "Question ouverte avec Milo"],
	[/^\/course-milo\//, "Cours avec Milo"],
	[/^\/qcm(\/|$)/, "QCM"],
	["/exercise-result", "Résultats"],
	["/exercice-genere", "Exercice"],
	["/ocr", "Importer un document"],
	["/missions", "Missions"],
	["/duels", "Duels"],
	["/boutique", "Boutique"],
	["/personnalisation", "Personnalisation"],
	["/friends", "Amis"],
	["/profile", "Mon profil"],
	["/parent/dashboard", "Tableau de bord parent"],
	["/parent/children", "Comptes liés"],
	["/parent/bilans", "Bilans hebdomadaires"],
	["/parent/subscription", "Abonnement"],
	[/^\/admin/, "Administration"],
	["/unauthorized", "Accès refusé"],
	["/feedback/parcours-beta", "Retours bêta"],
];

/** Pages qui posent leur propre titre (LegalLayout) */
const SELF_TITLED = /^\/(mentions|confidentialite|cookies|cgu|cgv|charte)$/;

const titleFor = (pathname: string): string | null => {
	if (SELF_TITLED.test(pathname)) return null;
	const entry = TITLES.find(([match]) =>
		typeof match === "string" ? match === pathname : match.test(pathname),
	);
	if (!entry) return SITE;
	return pathname === "/" ? entry[1] : `${entry[1]} – ${SITE}`;
};

/** Élément réellement affiché (React masque l'ancienne page pendant un chargement) */
const isShown = (el: Element) => el.getClientRects().length > 0;

/** Contenu principal : le premier <main> affiché */
const findMain = () =>
	Array.from(document.querySelectorAll<HTMLElement>("main")).find(isShown) ?? null;

/** Titre de la page : le premier h1 affiché, dans le <main> de préférence */
const findHeading = (main: HTMLElement | null) => {
	const visible = (root: ParentNode) =>
		Array.from(root.querySelectorAll<HTMLElement>("h1")).find(isShown) ?? null;
	return (main && visible(main)) ?? visible(document);
};

/**
 * Accessibilité des changements de page dans l'application monopage :
 * - titre du document mis à jour à chaque route (WCAG 2.4.2) ;
 * - focus déplacé sur le h1 (ou le <main>) de la nouvelle page, pour que
 *   clavier et lecteur d'écran repartent du contenu (WCAG 2.4.3) ;
 * - titre annoncé dans une région live polie (WCAG 4.1.3) ;
 * - lien d'évitement « Aller au contenu » (RGAA 12.7).
 */
const RouteAnnouncer: React.FC = () => {
	const { pathname } = useLocation();
	const [announcement, setAnnouncement] = useState("");
	// Chemin déjà traité : ignore le premier affichage et le double effet du StrictMode
	const lastPath = useRef<string | null>(null);

	useEffect(() => {
		const title = titleFor(pathname);
		if (title) document.title = title;

		// URL canonique de la page courante (sans paramètres de requête)
		let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
		if (!canonical) {
			canonical = document.createElement("link");
			canonical.rel = "canonical";
			document.head.appendChild(canonical);
		}
		canonical.href = `https://milo-education.fr${pathname === "/" ? "/" : pathname}`;

		// Au premier chargement le lecteur d'écran lit déjà la page
		const previous = lastPath.current;
		lastPath.current = pathname;
		if (previous === null || previous === pathname) return;

		// Les pages chargées à la demande (et celles qui attendent l'API)
		// s'affichent après coup : on attend leur titre jusqu'à 6 s
		let timer = 0;
		let tries = 0;
		let checks = 0;
		// Focus au moment du changement de page : s'il a bougé depuis, c'est
		// la nouvelle page qui l'a placé (modale, champ) et on le lui laisse
		const startActive = document.activeElement;
		const focusHeading = () => {
			const main = findMain();
			const heading = findHeading(main);
			if (!heading && tries < 120) {
				tries += 1;
				timer = window.setTimeout(focusHeading, 50);
				return;
			}
			// Pas de h1 au bout de 6 s : le <main> sert de repli
			const target = heading ?? main;
			if (!target) return;
			const active = document.activeElement;
			const pageMovedFocus =
				active && active !== document.body && active !== startActive && isShown(active) && main?.contains(active);
			if (pageMovedFocus) return;
			if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
			target.setAttribute("data-route-focus", "");
			target.focus({ preventScroll: true });
			setAnnouncement(document.title);
			// Certaines pages remplacent leur titre juste après l'affichage
			// (animation d'entrée) : si le focus est retombé sur <body>, on
			// recommence sur le nouvel élément
			if (checks < 3) {
				checks += 1;
				timer = window.setTimeout(() => {
					if (!document.activeElement || document.activeElement === document.body) focusHeading();
				}, 300);
			}
		};
		timer = window.setTimeout(focusHeading, 0);
		return () => window.clearTimeout(timer);
	}, [pathname]);

	const skipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
		const main = findMain();
		if (!main) return;
		e.preventDefault();
		if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
		main.setAttribute("data-route-focus", "");
		main.focus();
		main.scrollIntoView({ block: "start" });
	};

	return (
		<>
			<a className="skip-link" href="#contenu" onClick={skipToContent}>
				Aller au contenu
			</a>
			<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
				{announcement}
			</div>
		</>
	);
};

export default RouteAnnouncer;
