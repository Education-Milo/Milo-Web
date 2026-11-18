import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
	DEFAULT_OG_IMAGE,
	SEO_ROUTES,
	canonicalFor,
	findSeoRoute,
	isPrivatePath,
} from "@shared/seo/seo.config";

const setMeta = (attr: "name" | "property", key: string, content: string) => {
	let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
	if (!tag) {
		tag = document.createElement("meta");
		tag.setAttribute(attr, key);
		document.head.appendChild(tag);
	}
	tag.content = content;
};

const setLink = (rel: string, href: string) => {
	let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
	if (!link) {
		link = document.createElement("link");
		link.rel = rel;
		document.head.appendChild(link);
	}
	link.href = href;
};

const HOME = SEO_ROUTES[0];

/**
 * Métadonnées de la page courante (description, canonique, Open Graph,
 * Twitter, robots), mises à jour à chaque navigation. Le titre de l'onglet
 * reste géré par RouteAnnouncer. Les pages publiques arrivent déjà avec les
 * bonnes balises (HTML pré-généré au build) : ce composant garde <head>
 * cohérent pendant la navigation dans l'application.
 */
const SeoHead: React.FC = () => {
	const { pathname } = useLocation();

	useEffect(() => {
		const route = findSeoRoute(pathname);
		const meta = route ?? HOME;
		const url = canonicalFor(route ? pathname : "/");
		const indexable = Boolean(route) && route?.index !== false && !isPrivatePath(pathname);

		setMeta("name", "description", meta.description);
		setMeta("name", "robots", indexable ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow");
		setLink("canonical", url);

		setMeta("property", "og:url", url);
		setMeta("property", "og:title", meta.ogTitle ?? meta.title);
		setMeta("property", "og:description", meta.description);
		setMeta("property", "og:image", meta.image ?? DEFAULT_OG_IMAGE);
		setMeta("name", "twitter:title", meta.ogTitle ?? meta.title);
		setMeta("name", "twitter:description", meta.description);
		setMeta("name", "twitter:image", meta.image ?? DEFAULT_OG_IMAGE);
	}, [pathname]);

	return null;
};

export default SeoHead;
