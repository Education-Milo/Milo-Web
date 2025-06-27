# Milo - Frontend Web

Interface web frontend du projet Milo, développée avec React, TypeScript et Vite pour une expérience utilisateur moderne et performante.

## 🛠️ Technologies utilisées

- **React** - Bibliothèque JavaScript pour construire des interfaces utilisateur
- **TypeScript** - Superset typé de JavaScript pour un développement plus robuste
- **Vite** - Outil de build ultra-rapide avec Hot Module Replacement (HMR)
- **CSS Modules** - Stylisation modulaire et scopée

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

Le projet sera accessible à l'adresse `http://localhost:5173` (ou un autre port si celui-ci est occupé).

## 📁 Structure du projet

```
src/
├── components/     # Composants réutilisables
├── lib/           # Utilitaires et helpers
├── pages/         # Pages de l'application
└── styles/        # Fichiers de style CSS
```

## 🔧 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run preview` - Prévisualise la version de production
- `npm run lint` - Vérifie la qualité du code avec ESLint

## 📝 Configuration

Ce projet utilise une configuration Vite optimisée avec :
- Support complet de TypeScript
- Hot Module Replacement pour un développement fluide
- Règles ESLint pour maintenir la qualité du code
- Configuration TypeScript stricte pour une meilleure sécurité de types