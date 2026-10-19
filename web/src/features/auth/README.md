# Feature Auth

Ce README documente le fonctionnement de la feature `auth` avec un flux existant: connexion utilisateur et redirection selon le role.

## Objectif

La feature `auth` gere:

- l'authentification (login/register),
- les pages d'entree/sortie auth,
- la redirection post-auth selon le role,
- la protection d'acces via `ProtectedRoute` (consommee par le router global).

## Structure

```txt
src/features/auth/
  components/
    AuthErrorMessage.component.tsx
    ClassSelector.component.tsx
    RoleSelector.component.tsx
  hooks/
    useLoginForm.ts
    useRegisterForm.ts
    userForgotPassword.ts
  pages/
    Login.page.tsx
    Register.page.tsx
    ForgotPassword.page.tsx
    Redirect.page.tsx
    Unauthorized.page.tsx
  styles/
    Login.css
    Register.css
    ForgotPassword.css
```

## Dependances principales

- Store auth: `@shared/store/auth/auth.store`
- Store user: `@shared/store/user/user.store`
- Constantes de routes: `@shared/constants/routes`
- Router protege: `@shared/components/ProtectedRoute.component`

## Flux existant: Login -> Token -> User -> Redirection

### 1) Saisie formulaire

Dans `useLoginForm.ts`:

- validation email/mot de passe,
- gestion des erreurs metier (`generalError`) et de loading.

### 2) Appel login

`handleSubmit` appelle `login(email, password)` du store auth.

Dans `auth.store.ts`:

- requete `POST_Login` (form-urlencoded), puis `POST_Login_2FA` si un second facteur est actif,
- reponse: un **jeton de compte** (30 min, sans refresh; cookie httpOnly `milo_account` en mode cookie, `accountToken` en memoire sinon) et la liste des profils du compte,
- un seul profil sans PIN: il est ouvert d'office; sinon redirection vers l'ecran « Qui est-ce ? » (`/profiles`, `features/account`),
- `selectProfile(id, pin?)` (`POST /profiles/{id}/select`) donne le jeton d'acces du profil (`accessToken`),
- appel `useUserStore.getState().getMe(true)` pour hydrater le profil utilisateur.

Depuis un profil ouvert, « Changer de profil » appelle `leaveProfile()` (`POST /logout/profile`): la session du profil est revoquee, la session de compte reemise, retour a « Qui est-ce ? » sans mot de passe. Le jeton du profil n'est jamais utilise pour `select` (il dispenserait ce profil de son PIN). `/profiles/manage` sert seulement a gerer les profils.

### 3) Resolution du role

Toujours dans `useLoginForm.ts`:

- lecture du role (`useUserStore.getState().user?.role`),
- mapping role -> route via `getRedirectPath`.

Mapping actuel:

- `Enfant` -> `/home`
- `Parent` -> `/parent/dashboard`
- `Prof` -> `/unauthorized`
- `Admin` -> `/unauthorized`
- fallback -> `/unauthorized`

### 4) Controle d'acces route

`ProtectedRoute.component.tsx` applique:

- sans token: redirection `/login`,
- token present + user non charge: `LoadingScreen`,
- role non autorise: redirection `/unauthorized`.

## Flux existant: Redirect page (`/`)

La route racine authentifiee (`/`) affiche `Redirect.page.tsx`.

Comportement actuel:

- `Enfant` -> `/home`
- `Parent` -> `/parent/dashboard`
- `Prof` -> `/prof/dashboard`
- `Admin` -> `/admin`
- fallback -> `/unauthorized`

Si `user` est absent apres 3 secondes, redirection vers `/login`.

## Point d'attention (important)

Il existe une incoherence entre:

- `useLoginForm.ts` (Prof/Admin -> `/unauthorized`),
- `Redirect.page.tsx` (Prof/Admin -> dashboards dedies).

En plus, dans `AuthNavigator.tsx`, les routes Prof/Admin sont commentees.

Impact:

- apres login direct, Prof/Admin vont sur Unauthorized,
- via `/`, la redirection peut viser des routes non actives.

## Recommandation

Choisir une seule strategie de redirection role-based et l'appliquer a la fois dans:

- `useLoginForm.ts`,
- `Redirect.page.tsx`,
- `AuthNavigator.tsx` (routes actives coherentes).

## Conventions de la feature auth

- Pages: `PascalCase.page.tsx`
- Composants: `PascalCase.component.tsx`
- Hooks: `useXxx.ts`
- Styles par page: `PascalCase.css`
- Imports via alias (`@features/*`, `@shared/*`)
