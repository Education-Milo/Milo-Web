# Référencement et mesure d'audience

Ce qui est en place dans le code, et les quelques réglages à faire **une fois** dans les outils en ligne.

## 1. Ce que fait le code

### Être trouvé (moteurs de recherche, IA, réseaux sociaux)

| Élément | Où | Rôle |
|---|---|---|
| Métadonnées par page | `src/shared/seo/seo.config.ts` | Titre, description, canonique, Open Graph, Twitter de chaque page publique. **Source unique** : modifier ce fichier suffit. |
| Pages pré-générées | `tools/seo/prerender.ts` (plugin Vite) | Au build, une page HTML par route publique (`/`, `/faq`, `/contact`, `/register`, `/login`, pages légales) avec le vrai texte dans le HTML. Les robots d'IA (GPTBot, ClaudeBot, PerplexityBot…) et les aperçus de liens (WhatsApp, LinkedIn, Instagram, Discord…) n'exécutent pas le JavaScript : sans ça, ils voient une page vide. |
| Données structurées | JSON-LD dans chaque page | `Organization`, `WebSite`, `WebApplication` (offres, public, niveaux 6e à 3e), `FAQPage`, `BreadcrumbList`. Google et les IA comprennent ce qu'est Milo. |
| `sitemap.xml` | généré au build | Toujours à jour, avec la date du build. |
| `llms.txt` / `llms-full.txt` | générés au build | Résumé et texte complet du site, au format lu par les assistants IA. Construits à partir de `landing.data.ts` (FAQ, tarifs, fonctionnalités). |
| `robots.txt` | `public/robots.txt` | Pages publiques ouvertes à tous, assistants IA explicitement bienvenus ; espace élève/parent/admin fermé. |
| `noindex` | `SeoHead` + `app.html` | Toutes les pages privées sont marquées `noindex`. |
| IndexNow | `npm run seo:indexnow` | Signale les pages à Bing (et donc ChatGPT Search, Copilot, DuckDuckGo), Yandex… en quelques heures. |

Le contenu de la vitrine (FAQ, fonctionnalités, tarifs) vient de `src/features/landing/data/landing.data.ts` : le modifier met à jour le site, les pages pré-générées et `llms.txt` au prochain build.

### Mesurer (visiteurs, inscriptions, contacts, conversion)

Tout passe par `src/shared/lib/analytics.ts` (`trackEvent`). Deux outils **sans cookie** (pas de bandeau de consentement, important pour un public de mineurs) :

- **Vercel Web Analytics + Speed Insights** : visiteurs uniques, pages vues, sources (Google, Instagram…), pays, appareils, vitesse réelle du site (Core Web Vitals).
- **Umami** : événements, objectifs, entonnoirs de conversion, campagnes UTM.

Rien n'est envoyé en local ni sur les préversions : seul `milo-education.fr` est compté. En dev, chaque événement s'affiche dans la console (`[analytics]`).

**Événements suivis**

| Événement | Quand | Propriétés |
|---|---|---|
| `cta_click` | Clic sur un lien vers `/register`, `/login`, `/contact`, `/faq` (automatique, partout) | `target`, `label`, `section` (navbar, hero, tarifs…) |
| `signup_role_selected` | Profil choisi à l'inscription | `role` |
| `signup_submitted` | Formulaire d'inscription envoyé | `role` |
| **`signup_completed`** | **Compte créé : la conversion principale** | `role`, `classe`, `source`, `medium`, `campaign`, `landing` |
| `signup_failed` | Inscription refusée | `role`, `status` |
| `login` | Connexion réussie | `two_factor` |
| **`contact_submitted`** | **Message de contact envoyé** | `subject`, `source`… |
| `beta_feedback_submitted` | Retour du parcours bêta envoyé | `role`, `rating` |
| `faq_open` | Question de FAQ dépliée | `question` |
| `outbound_click` / `email_click` | Lien externe (Instagram, LinkedIn…) / adresse email | `host`, `section` |
| `scroll_depth` | Défilement de la vitrine à 25/50/75/100 % | `percent` |

Pour suivre un autre bouton sans écrire de code : `data-track="nom"` (et éventuellement `data-track-label`) sur l'élément.

La **source** de chaque visite (UTM, sinon site d'origine, sinon « direct ») est retenue le temps de l'onglet et jointe aux inscriptions et contacts : on sait quel post Instagram ou quelle campagne amène des comptes.

## 2. À faire une fois (≈ 30 min)

1. **Vercel** → projet → onglets *Analytics* et *Speed Insights* → *Enable*. (Événements personnalisés côté Vercel : plan Pro ; les pages vues sont gratuites. Umami couvre les événements gratuitement.)
2. **Umami** : ✅ site créé, identifiant déjà branché dans `src/shared/lib/analytics.ts`. **Ne pas coller** la balise `<script>` proposée par Umami dans `index.html` : le code la charge lui-même (chemins normalisés, pas de double comptage). Dans Umami :
   - *Goals* : `signup_completed`, `contact_submitted`, `beta_feedback_submitted`.
   - *Funnel* « Inscription » : `/` → événement `cta_click` → `/register` → `signup_role_selected` → `signup_completed`. **Taux de conversion = inscriptions ÷ visiteurs**, étape par étape.
   - *UTM* et *Journeys* : sources et parcours.
3. **Google Search Console** ([lien](https://search.google.com/search-console)) : ajouter la propriété *Domaine* `milo-education.fr` (vérification DNS chez OVH, recommandée) ou *Préfixe d'URL* avec la balise meta → `VITE_GOOGLE_SITE_VERIFICATION`. Puis *Sitemaps* → `sitemap.xml`, et *Inspection d'URL* → *Demander l'indexation* sur `/` et `/faq`.
4. **Bing Webmaster Tools** ([lien](https://www.bing.com/webmasters)) : *Importer depuis Google Search Console* (le plus rapide) ou balise → `VITE_BING_SITE_VERIFICATION`. Bing alimente ChatGPT Search, Copilot et DuckDuckGo : à ne pas négliger.
5. Après chaque mise en production qui change le contenu public : `npm run seo:indexnow`.

## 3. Pour aller plus loin (hors code)

- **Liens UTM partout** : bio Instagram, posts LinkedIn, Linktree, emails, affiches. Ex. `https://milo-education.fr/?utm_source=instagram&utm_medium=social&utm_campaign=bio`.
- **Liens entrants** : page projet Epitech (EIP), annuaires d'outils éducatifs et d'IA, articles de blogs de parents ou d'enseignants, Product Hunt. C'est le premier facteur de classement, pour Google comme pour les IA.
- **Mentions** : les IA recommandent ce qui est cité ailleurs (Reddit, forums de parents, articles). Chaque mention compte.
- **Contenu** : des pages qui répondent aux recherches réelles (« réviser le brevet de maths », « aide aux devoirs 6e gratuite », « application révision collège ») attireraient beaucoup plus de visiteurs qu'une vitrine seule. Le plugin pré-génère toute route ajoutée à `SEO_ROUTES`.
- **Image de partage** : `public/og-image.jpg` (1200×630) est utilisée partout ; une image par page (champ `image`) améliore le taux de clic sur les réseaux.
