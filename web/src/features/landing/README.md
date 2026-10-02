# Feature `landing`

Pages publiques : la Vitrine (`/`), la FAQ (`/faq`) et le Contact (`/contact`).
La Vitrine suit la charte graphique Milo (`brand/`) : orange dominant, crème en
secondaire, vert Forêt en accent ponctuel uniquement, titres en Luckiest Guy,
texte en Fredoka, visuels en 3D.

## Structure

```txt
landing/
	pages/                 # Vitrine, FAQ, Contact (entrées de route)
	components/            # une section = un dossier (composant + CSS)
		Navbar/              # navbar à vague, partagée par les 3 pages
		Footer/              # footer partagé par les 3 pages
		Hero/                # hero + scène 3D (Milo, jouets) en React Three Fiber
		Manifesto/           # positionnement, épinglé au scroll
		Bands/               # bandes défilantes pilotées par la vitesse de scroll
		Missions/            # missions enfants, carrousel épinglé (desktop)
		ParentsStack/        # fonctionnalités parents en cartes empilées
		FaqPreview/          # aperçu de la FAQ
		Pricing/             # formules d'abonnement
		FinalCta/            # appel à l'action final
	ui/                    # petites briques réutilisables (Emoji3D, Eyebrow)
	data/landing.data.ts   # tout le contenu éditorial (textes, prix, icônes)
	hooks/useSmoothScroll  # Lenis synchronisé avec GSAP ScrollTrigger
	lib/                   # GSAP (plugins), scroll fluide, état partagé du hero
	styles/                # tokens et briques communes (landing.css), mise en page
```

## Technologies

- **GSAP** + **ScrollTrigger** + **SplitText** via `@gsap/react` (`useGSAP`) :
  animations au scroll, sections épinglées, titres révélés lettre par lettre.
  Toujours importer depuis `lib/gsap.ts` (plugins enregistrés une seule fois).
- **Lenis** : défilement fluide, piloté par le ticker GSAP.
- **React Three Fiber** + **Drei** : Milo (`MiloV11.glb`, utilitaires de
  `features/my-milo/utils/miloModel.ts`) et les jouets 3D du hero.
- **Framer Motion** : menu mobile de la navbar.
- **Charte globale** : couleurs de marque, polices (Google Fonts dans
  `index.html`) et focus viennent de `shared/styles/brand.css` ; les tokens
  `--lp-*` s'y réfèrent et n'ajoutent que les nuances propres à la landing.

## Conventions

- Toutes les classes CSS sont préfixées `lp-` (le CSS du projet est global).
- Les tokens (`--lp-*`) sont posés sur la classe `.lp`, présente sur la page,
  la navbar et le footer : ces deux derniers restent autonomes sur `/faq` et
  `/contact`.
- Les sections épinglées (Hero, Manifesto, Missions) doivent rester dans cet
  ordre dans la page : leurs ScrollTrigger sont créés dans l'ordre du DOM.
- Les épinglages ne s'activent qu'au-dessus de 961 × 700 px
  (`MEDIA_DESKTOP_PIN`) ; en dessous, les sections défilent normalement.
- `prefers-reduced-motion` est respecté : pas de Lenis ni d'animation au scroll.

## Crédits

Les icônes de `public/landing/emoji/` proviennent de
[Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (Microsoft,
licence MIT), version 3D, converties en WebP.
