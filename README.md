# Milo Web

Application web frontend de Milo, une plateforme d'apprentissage interactive construite avec React, TypeScript et Vite.

Le projet contient l'interface eleve, les parcours publics, l'espace parent, les interactions avec Milo en 3D, les cours, les QCM, les missions, les duels, les amis et les workflows OCR.

## Stack Technique

- **React 19** et **React DOM** pour l'interface utilisateur
- **TypeScript** pour le typage
- **Vite 6** pour le serveur de developpement et le build
- **React Router DOM** pour le routage
- **Zustand** pour les stores locaux persistants
- **TanStack React Query** pour les appels et etats serveur
- **Axios** pour le client HTTP
- **Three.js**, **React Three Fiber**, **Drei** et **Postprocessing** pour les scenes 3D
- **Tailwind CSS 4**, CSS modules et CSS classiques pour le styling
- **Radix UI**, **Lucide React** et **React Icons** pour les composants et icones
- **Framer Motion** pour certaines animations

## Prerequis

- Node.js 18+ recommande
- npm
- Une API Milo accessible via `VITE_API_BASE_URL`

## Installation

Depuis la racine du depot:

```bash
cd web
npm install
```

Créer ou completer ensuite le fichier `web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Adaptez l'URL selon l'environnement backend utilise.

## Lancement

```bash
cd web
npm run dev
```

L'application est servie par Vite sur:

```txt
http://localhost:3000
```

La configuration active `host: true`, ce qui permet aussi de tester depuis le reseau local si necessaire.

## Scripts Disponibles

Depuis `web/`:

```bash
npm run dev
```

Lance le serveur de developpement Vite.

```bash
npm run build
```

Compile TypeScript puis genere le build de production.

```bash
npm run preview
```

Previsualise localement le build de production.

```bash
npm run lint
```

Lance ESLint sur le projet.

## Structure Du Projet

```txt
.
├── README.md
└── web/
    ├── public/                 # assets statiques, modeles 3D, images
    ├── src/
    │   ├── api/                # configuration Axios et routes API
    │   ├── features/           # domaines fonctionnels de l'application
    │   ├── navigation/         # routeurs public/authentifie
    │   ├── shared/             # composants, hooks, stores et styles partages
    │   ├── App.tsx             # bootstrap router + auth + react-query
    │   └── main.tsx            # point d'entree React
    ├── vite.config.ts
    ├── eslint.config.js
    ├── tsconfig*.json
    └── package.json
```

La documentation d'architecture plus detaillee est disponible dans `web/src/README.md`.

## Organisation Frontend

Le code applicatif est organise par domaines metier dans `src/features`.

Features principales:

- `auth`: connexion, inscription, mot de passe oublie, redirection et pages d'erreur
- `landing`: vitrine publique, FAQ et contact
- `home`: accueil eleve
- `milo-scene`: scene 3D et chat avec Milo
- `courses`: matieres, chapitres, lecons et detail de cours
- `exercices`: QCM et resultats
- `ocr`: upload, generation d'exercices et QCM depuis documents
- `missions`: missions quotidiennes et badges
- `duels`: defis entre utilisateurs, historique et statistiques
- `friends`: recherche et gestion des amis
- `my-milo`: personnalisation de Milo
- `milo-shop`: boutique
- `profile`: profil utilisateur
- `parent`: tableau de bord et abonnement parent

Les elements transverses vivent dans `src/shared`:

- `components`: layout, boutons, champs, top bar, sidebar, routes protegees
- `constants`: routes et constantes globales
- `hooks`: hooks partages
- `store`: stores globaux, notamment auth et user
- `styles`: styles et themes partages
- `types`: types transverses
- `lib`: utilitaires

## Routage

L'application choisit automatiquement le routeur selon l'etat d'authentification.

- Utilisateur non connecte: `PublicNavigator`
- Utilisateur connecte: `AuthNavigator`

Routes publiques principales:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/faq`
- `/contact`

Routes authentifiees principales:

- `/home`
- `/milo`
- `/courses`
- `/courses/:subjectId`
- `/course-milo/:lessonId`
- `/qcm/:lessonId`
- `/qcm`
- `/exercise-result`
- `/ocr`
- `/exercice-genere`
- `/missions`
- `/duels`
- `/friends`
- `/mon-milo`
- `/boutique`
- `/profile`
- `/parent/dashboard`
- `/parent/subscription`

Certaines routes sont protegees par role via `ProtectedRoute`, notamment `Enfant` et `Parent`.

## API Et Authentification

Le client HTTP est configure dans `web/src/api/axios.api.ts`.

- `VITE_API_BASE_URL` definit l'URL de base du backend.
- Les routes API sont centralisees dans `APIRoutes`.
- Le token JWT est stocke via Zustand avec persistance `localStorage`.
- Un intercepteur Axios ajoute automatiquement le header `Authorization: Bearer <token>`.
- Les erreurs `401` hors login/register declenchent une deconnexion et une redirection vers `/login`.

## Assets

Les assets statiques sont dans `web/public`:

- modeles 3D `.glb` de Milo et de la classroom
- images de landing et d'interface
- badges
- medias de chargement

Ces fichiers sont servis directement par Vite depuis la racine publique.

## Conventions

- Les features utilisent des dossiers `pages`, `components`, `hooks`, `store` et `styles` quand c'est pertinent.
- Les pages suivent le format `PascalCase.page.tsx`.
- Les composants partages suivent le format `PascalCase.component.tsx`.
- Les stores Zustand utilisent `*.store.ts`.
- Les modeles de store utilisent `*.model.ts`.
- Les imports doivent privilegier les alias Vite/TypeScript:
  - `@api/*`
  - `@features/*`
  - `@navigation/*`
  - `@shared/*`
  - `@styles/*`
  - `@types/*`

Exemple:

```ts
import ScreenLayout from "@shared/components/ScreenLayout.component";
import MiloScene from "@features/milo-scene/pages/MiloScene";
```

## Verification Avant Livraison

Avant d'ouvrir une PR ou de deployer:

```bash
cd web
npm run lint
npm run build
```

Le deploiement frontend peut ensuite utiliser le build Vite standard genere dans `web/dist`.
