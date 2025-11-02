# Milo - Frontend Web

Interface web frontend du projet Milo, développée avec React, TypeScript et Vite pour une expérience utilisateur moderne et performante.

## 🛠️ Technologies utilisées

### Framework et Build
- **React 19** - Bibliothèque JavaScript pour construire des interfaces utilisateur
- **TypeScript** - Superset typé de JavaScript pour un développement plus robuste
- **Vite 6** - Outil de build ultra-rapide avec Hot Module Replacement (HMR)

### Routing et Navigation
- **React Router DOM v6** - Gestion du routage et de la navigation

### Gestion d'état
- **Zustand** - Bibliothèque légère de gestion d'état globale avec persist middleware

### Styling
- **Tailwind CSS v4** - Framework CSS utility-first
- **tailwind-merge** - Fusion intelligente des classes Tailwind
- **class-variance-authority** - Gestion des variantes de composants
- **CSS Modules** - Stylisation modulaire pour certains composants

### Interface utilisateur
- **Radix UI** - Composants UI accessibles et personnalisables
- **Lucide React** - Bibliothèque d'icônes
- **React Icons** - Icônes supplémentaires

### 3D et Graphisme
- **Three.js** - Bibliothèque JavaScript 3D
- **React Three Fiber** - Renderer React pour Three.js
- **React Three Drei** - Helpers et abstractions pour R3F

### API et Services
- **Axios** - Client HTTP pour les appels API
- **jwt-decode** - Décodage des tokens JWT

### Contextes
- **Context API** - Gestion du thème (light/dark)

## 🚀 Installation et démarrage

### Prérequis

Assurez-vous d'avoir Node.js installé sur votre machine (version 16+ recommandée).

### Installation des dépendances

```bash
npm install
```

### Lancement du serveur de développement

```bash
npm run dev
```

Le projet sera accessible à l'adresse `http://localhost:3000` (port configuré dans `vite.config.ts`).

## 📁 Structure du projet

```
src/
├── api/              # Configuration Axios et endpoints API
├── components/       # Composants réutilisables
│   ├── ui/          # Composants UI de base (button, typography, etc.)
│   │   ├── auth/    # Composants d'authentification
│   │   └── common/  # Composants communs
│   └── ...          # Autres composants (Navbar, Sidebar, TopBar, etc.)
├── contexts/         # Contextes React (ThemeContext)
├── hooks/           # Hooks personnalisés (useLoginForm, useRegisterForm, etc.)
├── lib/             # Utilitaires et helpers
├── navigation/       # Navigateurs de routing (AuthNavigator, PublicNavigator)
├── screens/          # Écrans/Pages de l'application
│   └── Auth/        # Pages d'authentification (Login, Register, ForgotPassword)
├── store/            # Stores Zustand pour la gestion d'état
│   ├── auth/        # Store d'authentification
│   ├── user/        # Store utilisateur
│   └── ia/          # Store IA
├── styles/           # Fichiers de style CSS
│   └── themes/      # Définitions de thèmes (colors, typography)
└── types/            # Types TypeScript globaux
```

## 🔧 Scripts disponibles

- `npm run dev` - Lance le serveur de développement sur le port 3000
- `npm run build` - Construit l'application pour la production (avec vérification TypeScript)
- `npm run preview` - Prévisualise la version de production
- `npm run lint` - Vérifie la qualité du code avec ESLint

## 📝 Configuration

Ce projet utilise une configuration Vite optimisée avec :
- Support complet de TypeScript avec configuration stricte
- Hot Module Replacement pour un développement fluide
- Règles ESLint pour maintenir la qualité du code
- Path aliases configurés pour un import simplifié (`@components`, `@store`, `@screens`, etc.)
- Configuration Tailwind CSS v4 avec support des thèmes light/dark
- Serveur de développement configuré sur le port 3000 avec accès réseau (host: true)

## 🎨 Fonctionnalités

- **Authentification** : Login, Register, Forgot Password avec gestion JWT
- **Navigation** : Routage conditionnel basé sur l'état d'authentification
- **Thèmes** : Support du mode clair/sombre avec persistance ( a retirer )
- **3D** : Affichage de modèles 3D (Milo) avec Three.js
- **Gestion d'état** : Stores Zustand avec persistance locale pour l'auth