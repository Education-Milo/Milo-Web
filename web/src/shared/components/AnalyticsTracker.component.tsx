import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, normalizePath, trackEvent, trackPageview } from "@shared/lib/analytics";

/** Liens internes considérés comme des appels à l'action */
const CTA_TARGETS: Record<string, string> = {
	"/register": "signup",
	"/login": "login",
	"/contact": "contact",
	"/faq": "faq",
};

const OWN_HOSTS = new Set(["milo-education.fr", "www.milo-education.fr", window.location.hostname]);

/** Section de la page où se trouve l'élément (navbar, hero, tarifs…) */
const sectionOf = (el: Element): string => {
	const tagged = el.closest<HTMLElement>("[data-track-section]");
	if (tagged) return tagged.dataset.trackSection!;
	const landmark = el.closest("nav, header, footer, aside");
	if (landmark) return landmark.tagName.toLowerCase();
	const section = el.closest<HTMLElement>("section[id], [id]:not(#root)");
	return section?.id || "page";
};

const labelOf = (el: HTMLElement): string =>
	(el.dataset.trackLabel || el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);

/**
 * Mesure d'audience globale, sans toucher aux composants :
 *  - une page vue par changement de route ;
 *  - clics sur les appels à l'action (liens vers /register, /login…), les
 *    liens sortants et l'email de contact, repérés par délégation ;
 *  - profondeur de défilement sur la page d'accueil.
 * Un élément peut forcer son suivi avec data-track="nom" (et data-track-label).
 */
const AnalyticsTracker: React.FC = () => {
	const { pathname } = useLocation();

	useEffect(() => {
		initAnalytics();

		const onClick = (e: MouseEvent) => {
			const target = e.target as Element | null;
			const el = target?.closest<HTMLElement>("a[href], [data-track]");
			if (!el) return;

			const explicit = el.dataset.track;
			if (explicit) {
				trackEvent("cta_click", { target: explicit, label: labelOf(el), section: sectionOf(el) });
				return;
			}
			const href = el.getAttribute("href") ?? "";
			if (href.startsWith("mailto:")) {
				trackEvent("email_click", { section: sectionOf(el) });
				return;
			}
			let url: URL;
			try {
				url = new URL(href, window.location.origin);
			} catch {
				return;
			}
			if (!OWN_HOSTS.has(url.hostname)) {
				trackEvent("outbound_click", { host: url.hostname.replace(/^www\./, ""), section: sectionOf(el) });
				return;
			}
			const cta = CTA_TARGETS[url.pathname] ?? (url.pathname.startsWith("/register/") ? "signup" : undefined);
			if (cta) trackEvent("cta_click", { target: cta, label: labelOf(el), section: sectionOf(el) });
		};

		document.addEventListener("click", onClick, { capture: true });
		return () => document.removeEventListener("click", onClick, { capture: true });
	}, []);

	useEffect(() => {
		trackPageview(pathname);
		if (normalizePath(pathname) !== "/") return;

		// Profondeur de défilement de la vitrine : 25, 50, 75, 100 %
		const reached = new Set<number>();
		let frame = 0;
		const measure = () => {
			frame = 0;
			const doc = document.documentElement;
			const scrollable = doc.scrollHeight - window.innerHeight;
			if (scrollable <= 0) return;
			const percent = (window.scrollY / scrollable) * 100;
			[25, 50, 75, 100].forEach((step) => {
				if (percent >= step - 2 && !reached.has(step)) {
					reached.add(step);
					trackEvent("scroll_depth", { percent: step });
				}
			});
		};
		const onScroll = () => {
			if (!frame) frame = window.requestAnimationFrame(measure);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, [pathname]);

	return null;
};

export default AnalyticsTracker;
