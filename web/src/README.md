# Architecture Frontend (src)

Ce document décrit l'organisation actuelle de l'application et les conventions de nommage.

## Objectif de la nouvelle architecture

L'objectif est de rendre le projet:

- plus modulaire (chaque domaine métier vit dans son dossier `features`),
- plus réutilisable (les briques transverses vivent dans `shared`),
- plus simple à maintenir (moins d'imports croisés non maîtrisés),
- plus lisible pour onboarder rapidement.

## Structure globale

```txt
src/
	api/                 # client HTTP, routes API, configuration Axios
	features/            # logique métier par domaine (auth, courses, missions...)
	navigation/          # routers / navigateurs applicatifs
	shared/              # éléments transverses réutilisables
		components/
		constants/
		hooks/
		lib/
		store/
		styles/
		types/
	App.tsx
	main.tsx
```

## Rôle de `features/`

`features/` contient tout ce qui appartient à un domaine fonctionnel précis.

Exemples de domaines actuels:

- `auth`
- `courses`
- `duels`
- `exercices`
- `home`
- `landing`
- `milo-scene`
- `missions`
- `parent`
- `profile`

Structure recommandée d'une feature:

```txt
features/<feature-name>/
	pages/               # écrans/entrées de route de la feature
	components/          # composants spécifiques à la feature
	hooks/               # hooks spécifiques à la feature
	store/               # store spécifique si besoin
	styles/              # styles spécifiques à la feature
```

Règle: si un fichier n'est utilisé que par une feature, il doit vivre dans cette feature.

## Rôle de `shared/`

`shared/` regroupe les éléments communs à plusieurs features.

- `shared/components`: composants UI réutilisés (ex: layout, inputs, boutons...)
- `shared/store`: stores globaux (auth, user...)
- `shared/types`: types transverses
- `shared/constants`: constantes globales (routes...)
- `shared/styles`: styles mutualisés (animations, layout, scrollbar...)
- `shared/lib`: helpers/utilitaires

Règle: un élément va dans `shared` uniquement s'il est stable, générique, et utilisé dans plusieurs features.

## Conventions de nommage

### Dossiers

- Features: kebab-case (`milo-scene`, `home`, `parent`)
- Sous-dossiers internes: `pages`, `components`, `hooks`, `store`, `styles`

### Fichiers React

- Pages: `PascalCase.page.tsx` (ex: `Home.page.tsx`, `Dashboard.page.tsx`)
- Composants: `PascalCase.component.tsx` (ex: `ScreenLayout.component.tsx`)
- Hooks: `useXxx.ts` (ex: `useLoginForm.ts`, `useDashboard.ts`)

### Store / Modèles / Types

- Store Zustand: `*.store.ts`
- Modèles store: `*.model.ts`
- Types métiers: `*.types.ts` ou fichiers dédiés dans `shared/types`

### Styles

- Styles feature: placés dans `features/<feature>/styles/`
- Styles partagés: placés dans `shared/styles/`
- Les classes CSS restent en kebab-case (`.section-card`, `.welcome-subtitle`)

## Règles d'import

Toujours privilégier les alias TypeScript:

- `@features/*`
- `@shared/*`
- `@api/*`
- `@styles/*`
- `@navigation/*`

Exemples:

```ts
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { useLoginForm } from "@features/auth/hooks/useLoginForm";
```

Éviter les chemins relatifs profonds (`../../../..`) quand un alias existe.

## Décision rapide: `feature` ou `shared`?

- Utilisé par une seule feature: `features/<feature>/...`
- Utilisé par 2+ features: `shared/...`
- Lié au routing global ou au bootstrap app: `navigation/` ou racine `src/`

## Étape suivante: README détaillé d'une feature

Pour la suite, on pourra créer un README dédié par feature, par exemple:

```txt
src/features/<feature>/README.md
```

Contenu conseillé:

1. objectif métier de la feature,
2. routes/pages concernées,
3. composants clés,
4. hooks et store utilisés,
5. flux principal existant (entrée -> traitement -> état -> rendu),
6. dépendances vers `shared` et `api`.

Exemple de flux à documenter en priorité: `auth` (login -> token -> getMe -> redirection selon role).
