/// Plugin Vite de référencement (build uniquement).
///
/// Milo est une application monopage : sans JavaScript, le HTML servi est une
/// <div> vide. Google exécute le JS (avec du retard), mais la plupart des robots
/// d'IA (GPTBot, ClaudeBot, PerplexityBot…) et les aperçus de liens des réseaux
/// sociaux ne le font pas. Ce plugin génère donc, à la fin du build :
///
///  - une page HTML par route publique (dist/faq.html…), avec son titre, sa
///    description, sa canonique, ses balises Open Graph / Twitter, ses données
///    structurées JSON-LD et le texte de la page dans #root (remplacé par
///    l'application React dès qu'elle démarre) ;
///  - dist/app.html : la coquille de l'application, servie (via vercel.json)
///    pour toutes les autres routes ;
///  - sitemap.xml, llms.txt et llms-full.txt, toujours à jour avec le contenu.
///
/// ⚠️ Imports RELATIFS uniquement (le fichier est chargé par vite.config.ts).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import {
	BANDS,
	CONTACT_EMAIL,
	FAQ_CATEGORIES,
	FAQ_ENTRIES,
	FAQ_PREVIEW,
	MISSIONS,
	PARENT_FEATURES,
	PLANS,
} from "../../src/features/landing/data/landing.data";
import { LEGAL_DOCS } from "../../src/features/legal/data/legal.docs";
import {
	DEFAULT_OG_IMAGE,
	SEO_ROUTES,
	SITE_NAME,
	SITE_URL,
	SOCIAL_PROFILES,
	applicationLd,
	breadcrumbLd,
	canonicalFor,
	faqLd,
	organizationLd,
	webPageLd,
	websiteLd,
	type SeoRoute,
} from "../../src/shared/seo/seo.config";

const SEO_START = "<!-- seo:start -->";
const SEO_END = "<!-- seo:end -->";

const esc = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- <head> ---------- */

const headFor = (route: SeoRoute, jsonLd: object[]) => {
	const url = canonicalFor(route.path);
	const ogTitle = route.ogTitle ?? route.title;
	const image = route.image ?? DEFAULT_OG_IMAGE;
	const robots = route.index === false ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1";
	const graph = JSON.stringify({ "@context": "https://schema.org", "@graph": jsonLd }).replace(/</g, "\\u003c");
	return `${SEO_START}
    <title>${esc(route.title)}</title>
    <meta name="description" content="${esc(route.description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="fr-FR" href="${url}" />
    <link rel="alternate" hreflang="x-default" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(ogTitle)}" />
    <meta property="og:description" content="${esc(route.description)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Logo Milo : le mot Milo en lettres orange, coiffé d'une toque de diplômé" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(ogTitle)}" />
    <meta name="twitter:description" content="${esc(route.description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="Logo Milo" />
    <script type="application/ld+json">${graph}</script>
    ${SEO_END}`;
};

const jsonLdFor = (route: SeoRoute): object[] => {
	const base: object[] = [organizationLd(), websiteLd(), webPageLd(route)];
	if (route.path === "/") return [...base, applicationLd(PLANS), faqLd(FAQ_PREVIEW)];
	if (route.path === "/faq") return [...base, faqLd(FAQ_ENTRIES), breadcrumbLd(route)];
	return [...base, breadcrumbLd(route)];
};

/* ---------- Contenu statique de #root ---------- */

const list = (items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

const NAV = `<nav aria-label="Navigation principale">${list([
	`<a href="/">Accueil</a>`,
	`<a href="/#enfants">Pour les élèves</a>`,
	`<a href="/#parents">Pour les parents</a>`,
	`<a href="/#tarifs">Tarifs</a>`,
	`<a href="/faq">FAQ</a>`,
	`<a href="/contact">Contact</a>`,
	`<a href="/login">Connexion</a>`,
	`<a href="/register">Créer un compte</a>`,
])}</nav>`;

const FOOTER = `<footer>${list([
	...LEGAL_DOCS.map((doc) => `<a href="${doc.path}">${esc(doc.shortTitle)}</a>`),
	...SOCIAL_PROFILES.map((url) => `<a href="${url}" rel="me noopener">${url.includes("instagram") ? "Instagram" : "LinkedIn"}</a>`),
	`<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`,
])}<p>Milo est un projet étudiant Epitech (EIP).</p></footer>`;

const faqHtml = (entries: { question: string; answer: string }[]) =>
	entries.map((entry) => `<h3>${esc(entry.question)}</h3><p>${esc(entry.answer)}</p>`).join("");

const bodyFor = (route: SeoRoute): string => {
	switch (route.path) {
		case "/":
			return `
<header><h1>Milo, le compagnon qui fait aimer réviser</h1>
<p><strong>Apprendre est un jeu d'enfant.</strong> Milo est une plateforme de révision ludique pour les collégiens, de la 6e à la 3e : un renard en 3D, tuteur bienveillant, explique les cours au tableau, propose des QCM et des exercices sur mesure, des missions du jour et des duels entre amis. Le contenu suit le programme officiel de l'Éducation nationale.</p>
<p><a href="/register">Rejoindre l'aventure : créer un compte gratuitement</a></p></header>
<section id="concept"><h2>Toutes les façons de réviser avec Milo</h2>${list(BANDS.flat().map((band) => esc(band.label)))}</section>
<section id="enfants"><h2>Pour les élèves</h2>${MISSIONS.map(
				(mission) =>
					`<article><h3>${esc(`${mission.title} ${mission.highlight}`)}</h3><p>${esc(mission.description)}</p>${list(
						mission.tags.map((tag) => esc(tag.label)),
					)}</article>`,
			).join("")}</section>
<section id="parents"><h2>Pour les parents</h2>${PARENT_FEATURES.map(
				(feature) => `<article><h3>${esc(feature.title)}</h3><p>${esc(feature.description)}</p></article>`,
			).join("")}</section>
<section id="faq"><h2>Questions fréquentes</h2>${faqHtml(FAQ_PREVIEW)}<p><a href="/faq">Toutes les questions sur Milo</a></p></section>
<section id="tarifs"><h2>Tarifs</h2>${PLANS.map(
				(plan) =>
					`<article><h3>${esc(plan.name)} : ${plan.price} € par mois</h3>${list(plan.features.map(esc))}</article>`,
			).join("")}</section>`;
		case "/faq":
			return `<h1>Questions fréquentes sur Milo</h1>
<p>Tout ce qu'il faut savoir sur Milo, pour accompagner votre enfant sereinement.</p>
${FAQ_CATEGORIES.map(
	(category) =>
		`<section><h2>${esc(category.name)}</h2>${faqHtml(FAQ_ENTRIES.filter((entry) => entry.category === category.name))}</section>`,
).join("")}
<p>Une autre question ? <a href="/contact">Contacte l'équipe Milo</a>.</p>`;
		case "/contact":
			return `<h1>Une question pour Milo ?</h1>
<p>On adore recevoir du courrier. Que ce soit pour un bug, une idée de génie, un partenariat ou toute autre demande, écris-nous via le formulaire de contact ou directement à <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
<p>La réponse se trouve peut-être déjà dans la <a href="/faq">FAQ</a>.</p>`;
		case "/register":
			return `<h1>Créer un compte Milo</h1>
<p>Choisis ton profil : <strong>élève</strong> (de la 6e à la 3e) pour réviser en t'amusant, défier tes amis en duel et faire grandir ton Milo, ou <strong>parent</strong> pour suivre les progrès de vos enfants.</p>
${list([`<a href="/register/eleve">Je suis élève</a>`, `<a href="/register/parent">Je suis parent</a>`])}
<p>Déjà un compte ? <a href="/login">Se connecter</a></p>`;
		case "/login":
			return `<h1>Connexion à Milo</h1><p>Retrouve tes cours, tes missions du jour et tes duels.</p><p>Pas encore de compte ? <a href="/register">Créer un compte</a></p>`;
		default: {
			const doc = LEGAL_DOCS.find((d) => d.path === route.path);
			if (!doc) return `<h1>${esc(route.title)}</h1><p>${esc(route.description)}</p>`;
			return `<h1>${esc(doc.title)}</h1><p>${esc(doc.description)}</p><p>Version ${esc(doc.version)}, mise à jour le ${esc(doc.updatedAt)}.</p>`;
		}
	}
};

/// Styles minimaux du contenu statique : lisible sans JS, et pendant la
/// fraction de seconde avant le démarrage de l'application
const STATIC_STYLE = `<style>.seo-static{max-width:760px;margin:0 auto;padding:32px 16px;font:16px/1.6 system-ui,sans-serif;color:#2b1d14;background:#fffaf3}.seo-static h1{color:#ff541d;line-height:1.2}.seo-static a{color:#c2410c}.seo-static nav ul,.seo-static footer ul{display:flex;flex-wrap:wrap;gap:8px 16px;list-style:none;padding:0}</style>`;

const pageFor = (template: string, route: SeoRoute) => {
	const start = template.indexOf(SEO_START);
	const end = template.indexOf(SEO_END);
	if (start < 0 || end < 0) throw new Error("[seo] marqueurs <!-- seo:start/end --> absents de index.html");
	const head = template.slice(0, start) + headFor(route, jsonLdFor(route)) + template.slice(end + SEO_END.length);
	return head
		.replace("</head>", `  ${STATIC_STYLE}\n  </head>`)
		.replace(
			'<div id="root"></div>',
			`<div id="root"><div class="seo-static">${NAV}<main id="contenu">${bodyFor(route)}</main>${FOOTER}</div></div>`,
		);
};

/* ---------- sitemap.xml, llms.txt ---------- */

const sitemapXml = (today: string) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${SEO_ROUTES.filter((route) => route.index !== false)
	.map(
		(route) => `  <url>
    <loc>${canonicalFor(route.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>${
			route.path === "/" ? `\n    <image:image><image:loc>${DEFAULT_OG_IMAGE}</image:loc></image:image>` : ""
		}
  </url>`,
	)
	.join("\n")}
</urlset>
`;

const LLMS_INTRO = `# Milo

> Milo est une plateforme web de révision ludique pour les collégiens français, de la 6e à la 3e. Un renard en 3D, tuteur bienveillant propulsé par l'IA, explique les cours, pose des questions plutôt que de donner les réponses, et transforme les révisions en jeu (missions du jour, coins, cosmétiques, duels en direct entre amis, ligues). Les parents suivent les progrès depuis un tableau de bord. Contenu conforme au programme officiel de l'Éducation nationale. Projet étudiant Epitech (EIP), en français.

- Site : ${SITE_URL}
- Public : collégiens (11-15 ans) et leurs parents, en France
- Contact : ${CONTACT_EMAIL}
- Réseaux : ${SOCIAL_PROFILES.join(", ")}
`;

const llmsTxt = () => `${LLMS_INTRO}
## Pages principales

${SEO_ROUTES.filter((route) => !LEGAL_DOCS.some((doc) => doc.path === route.path))
	.map((route) => `- [${route.title}](${canonicalFor(route.path)}) : ${route.description}`)
	.join("\n")}

## Fonctionnalités

${MISSIONS.map((mission) => `- **${mission.title} ${mission.highlight}** : ${mission.description}`).join("\n")}
${PARENT_FEATURES.map((feature) => `- **${feature.title} (parents)** : ${feature.description}`).join("\n")}

## Tarifs

${PLANS.map((plan) => `- ${plan.name} : ${plan.price} €/mois (${plan.features.join(", ")})`).join("\n")}

## Optional

- [Texte complet pour les IA](${SITE_URL}/llms-full.txt)
${LEGAL_DOCS.map((doc) => `- [${doc.title}](${SITE_URL}${doc.path}) : ${doc.description}`).join("\n")}
`;

const llmsFullTxt = () => `${LLMS_INTRO}
## Ce que fait Milo

${BANDS.flat()
	.map((band) => `- ${band.label}`)
	.join("\n")}

${MISSIONS.map((mission) => `### ${mission.title} ${mission.highlight}\n\n${mission.description}`).join("\n\n")}

## Pour les parents

${PARENT_FEATURES.map((feature) => `### ${feature.title}\n\n${feature.description}`).join("\n\n")}

## Tarifs

${PLANS.map((plan) => `### ${plan.name} : ${plan.price} € par mois\n\n${plan.features.map((f) => `- ${f}`).join("\n")}`).join("\n\n")}

## Questions fréquentes

${FAQ_CATEGORIES.map(
	(category) =>
		`### ${category.name}\n\n${FAQ_ENTRIES.filter((entry) => entry.category === category.name)
			.map((entry) => `**${entry.question}**\n${entry.answer}`)
			.join("\n\n")}`,
).join("\n\n")}
`;

/* ---------- Plugin ---------- */

interface SeoPluginOptions {
	googleVerification?: string;
	bingVerification?: string;
}

export const seoPlugin = (options: SeoPluginOptions = {}): Plugin => {
	let outDir = "dist";
	return {
		name: "milo-seo",
		configResolved(config) {
			outDir = resolve(config.root, config.build.outDir);
		},
		transformIndexHtml(html) {
			// Vérification de propriété Search Console / Bing Webmaster Tools
			const tags = [
				options.googleVerification &&
					`<meta name="google-site-verification" content="${esc(options.googleVerification)}" />`,
				options.bingVerification && `<meta name="msvalidate.01" content="${esc(options.bingVerification)}" />`,
			].filter(Boolean);
			return tags.length ? html.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`) : html;
		},
		closeBundle() {
			if (this.meta.watchMode) return;
			const indexPath = resolve(outDir, "index.html");
			let template: string;
			try {
				template = readFileSync(indexPath, "utf8");
			} catch {
				return; // build sans index.html (ex. SSR) : rien à faire
			}

			// Coquille de l'application pour les routes non pré-générées (privées)
			const shell = template.replace(
				/<meta name="robots"[^>]*>/,
				'<meta name="robots" content="noindex, nofollow" />',
			);
			writeFileSync(resolve(outDir, "app.html"), shell);

			for (const route of SEO_ROUTES) {
				const file = route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`;
				const target = resolve(outDir, file);
				mkdirSync(dirname(target), { recursive: true });
				writeFileSync(target, pageFor(template, route));
			}

			writeFileSync(resolve(outDir, "sitemap.xml"), sitemapXml(new Date().toISOString().slice(0, 10)));
			writeFileSync(resolve(outDir, "llms.txt"), llmsTxt());
			writeFileSync(resolve(outDir, "llms-full.txt"), llmsFullTxt());
			console.log(`\n[seo] ${SEO_ROUTES.length} pages pré-générées + app.html, sitemap.xml, llms.txt, llms-full.txt`);
		},
	};
};
