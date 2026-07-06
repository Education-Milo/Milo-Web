# Milo Web

Frontend web application for Milo, an interactive learning platform built with React, TypeScript, and Vite.

The project includes the student interface, public journeys, the parent area, 3D interactions with Milo, courses, quizzes (MCQs), missions, duels, friends, and OCR workflows.

## Tech Stack

- **React 19** and **React DOM** for the user interface
- **TypeScript** for typing
- **Vite 6** for the development server and build
- **React Router DOM** for routing
- **Zustand** for persistent local stores
- **TanStack React Query** for server calls and state
- **Axios** as the HTTP client
- **Three.js**, **React Three Fiber**, **Drei**, and **Postprocessing** for 3D scenes
- **Tailwind CSS 4**, CSS modules, and plain CSS for styling
- **Radix UI**, **Lucide React**, and **React Icons** for components and icons
- **Framer Motion** for certain animations

## Prerequisites

- Node.js 18+ recommended
- npm
- A Milo API reachable via `VITE_API_BASE_URL`

## Installation

From the repository root:

```bash
cd web
npm install
```

Then create or complete the `web/.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Adjust the URL according to the backend environment in use.

## Running

```bash
cd web
npm run dev
```

The application is served by Vite at:

```txt
http://localhost:3000
```

The configuration enables `host: true`, which also allows testing from the local network if needed.

## Available Scripts

From `web/`:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Compiles TypeScript and then generates the production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint on the project.

## Project Structure

```txt
.
├── README.md
└── web/
    ├── public/                 # static assets, 3D models, images
    ├── src/
    │   ├── api/                # Axios configuration and API routes
    │   ├── features/           # application feature domains
    │   ├── navigation/         # public/authenticated routers
    │   ├── shared/             # shared components, hooks, stores, and styles
    │   ├── App.tsx             # router + auth + react-query bootstrap
    │   └── main.tsx            # React entry point
    ├── vite.config.ts
    ├── eslint.config.js
    ├── tsconfig*.json
    └── package.json
```

More detailed architecture documentation is available in `web/src/README.md`.

## Frontend Organization

The application code is organized by business domains in `src/features`.

Main features:

- `auth`: login, registration, forgot password, redirection, and error pages
- `landing`: public showcase, FAQ, and contact
- `home`: student home page
- `milo-scene`: 3D scene and chat with Milo
- `courses`: subjects, chapters, lessons, and course details
- `exercices`: MCQs and results
- `ocr`: upload, exercise generation, and MCQs from documents
- `missions`: daily missions and badges
- `duels`: challenges between users, history, and statistics
- `friends`: friend search and management
- `my-milo`: Milo customization
- `milo-shop`: shop
- `profile`: user profile
- `parent`: parent dashboard and subscription

Cross-cutting elements live in `src/shared`:

- `components`: layout, buttons, fields, top bar, sidebar, protected routes
- `constants`: routes and global constants
- `hooks`: shared hooks
- `store`: global stores, notably auth and user
- `styles`: shared styles and themes
- `types`: cross-cutting types
- `lib`: utilities

## Routing

The application automatically selects the router based on authentication state.

- Unauthenticated user: `PublicNavigator`
- Authenticated user: `AuthNavigator`

Main public routes:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/faq`
- `/contact`

Main authenticated routes:

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

Some routes are role-protected via `ProtectedRoute`, notably `Enfant` (Child) and `Parent`.

## API and Authentication

The HTTP client is configured in `web/src/api/axios.api.ts`.

- `VITE_API_BASE_URL` defines the backend base URL.
- API routes are centralized in `APIRoutes`.
- The JWT token is stored via Zustand with `localStorage` persistence.
- An Axios interceptor automatically adds the `Authorization: Bearer <token>` header.
- `401` errors outside of login/register trigger a logout and a redirect to `/login`.

## Assets

Static assets are located in `web/public`:

- `.glb` 3D models of Milo and the classroom
- landing and interface images
- badges
- loading media

These files are served directly by Vite from the public root.

## Conventions

- Features use `pages`, `components`, `hooks`, `store`, and `styles` folders where relevant.
- Pages follow the `PascalCase.page.tsx` format.
- Shared components follow the `PascalCase.component.tsx` format.
- Zustand stores use `*.store.ts`.
- Store models use `*.model.ts`.
- Imports should favor the Vite/TypeScript aliases:
  - `@api/*`
  - `@features/*`
  - `@navigation/*`
  - `@shared/*`
  - `@styles/*`
  - `@types/*`

Example:

```ts
import ScreenLayout from "@shared/components/ScreenLayout.component";
import MiloScene from "@features/milo-scene/pages/MiloScene";
```

## Pre-Release Checks

Before opening a PR or deploying:

```bash
cd web
npm run lint
npm run build
```

The frontend deployment can then use the standard Vite build generated in `web/dist`.