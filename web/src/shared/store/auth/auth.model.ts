import type { ClassType, UserRole } from '@shared/store/user/user.model';

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Champs communs aux deux routes d'inscription. */
export interface ParentRegisterPayload {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export interface StudentRegisterPayload extends ParentRegisterPayload {
  class_: ClassType;
}

/** Session d'un profil : réponse de l'inscription et de /profiles/{id}/select. */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  /** Toujours null en mode cookie : le refresh est dans le cookie httpOnly. */
  refresh_token: string | null;
}

/** Un profil du compte, tel qu'affiché sur l'écran « Qui est-ce ? ». */
export interface ProfileSummary {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role: UserRole;
  class_: ClassType | null;
  has_pin: boolean;
}

/**
 * Réponse de /token (et /token/2fa) une fois le compte authentifié : un jeton
 * de compte, sans refresh, qui n'ouvre que /profiles*, /account*, /2fa/*,
 * /sessions* et /logout/all. Les autres routes attendent le jeton d'un profil.
 */
export interface AccountLoginResponse {
  /**
   * Null en mode cookie (`?cookie=true`) : le jeton est alors dans le cookie
   * httpOnly `milo_account`, que le navigateur joint seul aux routes de compte.
   */
  account_token: string | null;
  token_type: string;
  /** Durée de vie du jeton de compte, en secondes. */
  expires_in: number;
  two_factor_required?: false;
  /** Jamais vide : un compte naît avec son premier profil et disparaît avec son dernier. */
  profiles: ProfileSummary[];
  /** Renvoyé par /token/2fa avec trust_device, hors mode cookie uniquement. */
  device_token?: string;
}

export type TwoFactorMethod = 'totp' | 'email' | 'recovery';

/** Réponse de /token quand un second facteur est attendu. */
export interface TwoFactorChallenge {
  two_factor_required: true;
  /** N'ouvre aucune API : sert uniquement à /token/2fa. Usage unique, 5 essais. */
  challenge_token: string;
  /** Méthodes réellement utilisables ("recovery" absent sans code restant). */
  methods: TwoFactorMethod[];
  /** Durée de vie du défi, en secondes. */
  expires_in: number;
}

export type LoginResponse = AccountLoginResponse | TwoFactorChallenge;

/** Issue d'une authentification de compte (mot de passe, puis second facteur). */
export type AccountLoginResult =
  /** Un seul profil, sans PIN : il est ouvert directement. */
  | { status: 'authenticated' }
  /** Choix du profil attendu (écran « Qui est-ce ? »). */
  | { status: 'select_profile'; profiles: ProfileSummary[] };

export type LoginResult =
  | AccountLoginResult
  | { status: 'two_factor'; challenge: TwoFactorChallenge };

export interface TwoFactorLoginPayload {
  challengeToken: string;
  method: TwoFactorMethod;
  code: string;
  trustDevice: boolean;
  deviceName?: string;
}

export interface ApiError {
  detail: string | Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

export interface AuthState {
  loading: boolean;
  /** Access token, en mémoire uniquement en mode cookie. */
  accessToken: string;
  /**
   * Une session de compte est ouverte (connexion faite, profil à choisir).
   * En mode cookie, le jeton est dans le cookie httpOnly `milo_account` et
   * survit au rechargement de la page ; voir restoreAccountSession.
   */
  hasAccountSession: boolean;
  /**
   * Jeton de compte, hors mode cookie uniquement (vide sinon). En mémoire,
   * jamais persisté : dans ce mode, un rechargement ramène à la connexion.
   */
  accountToken: string;
  /** Horodatage (ms) d'expiration du jeton de compte ; 0 si inconnu (session restaurée). */
  accountTokenExpiresAt: number;
  /** Profils renvoyés par /token, pour l'écran « Qui est-ce ? ». */
  profiles: ProfileSummary[];
  tokenValidationInterval: NodeJS.Timeout | null;
}

export interface LogoutOptions {
  /** Appeler POST /logout pour effacer le cookie côté serveur (défaut : oui). */
  remote?: boolean;
}

export interface AuthActions {
  /**
   * POST /token. Sans second facteur (ou appareil de confiance), le compte
   * est ouvert et il reste à choisir un profil ; sinon renvoie le défi à
   * compléter via completeTwoFactor.
   */
  login: (email: string, password: string) => Promise<LoginResult>;
  /** POST /token/2fa : termine l'authentification du compte. */
  completeTwoFactor: (payload: TwoFactorLoginPayload) => Promise<AccountLoginResult>;
  /**
   * POST /profiles/{id}/select. Avec le jeton de compte (après la connexion),
   * ouvre la session du profil. Avec le jeton du profil courant, change de
   * profil sans mot de passe : rechargement complet sur le nouveau profil.
   * Le PIN n'est exigé que si le profil cible en a un.
   */
  selectProfile: (profileId: number, pin?: string) => Promise<void>;
  /**
   * Ferme la session de compte (retour à la connexion depuis « Qui est-ce ? ») :
   * en mode cookie, POST /logout efface le cookie `milo_account`.
   */
  clearAccountSession: () => Promise<void>;
  /**
   * Au démarrage, sans session de profil : GET /profiles dit s'il reste une
   * session de compte (cookie `milo_account`, 30 min). Jamais /users/me, qui
   * répond 401 à un jeton de compte par conception.
   */
  restoreAccountSession: () => Promise<boolean>;
  /**
   * En-têtes des routes de niveau compte (/profiles, /account) : rien quand
   * un profil est ouvert (l'intercepteur pose son jeton, qui l'emporte sur le
   * cookie de compte) ni en mode cookie (le cookie part tout seul) ; le jeton
   * de compte hors mode cookie.
   */
  accountAuthHeaders: () => Record<string, string>;
  /** POST /token/2fa/email : envoie le code de connexion par email. */
  sendTwoFactorEmail: (challengeToken: string) => Promise<void>;
  /** Interne : mémorise le jeton d'accès reçu et charge /users/me. */
  openSession: (data: AuthResponse) => Promise<void>;
  /** POST /register/student : le rôle Enfant est déduit de la route. */
  registerStudent: (payload: StudentRegisterPayload) => Promise<void>;
  /** POST /register/parent : n'accepte aucun champ en plus (ni role ni class_, sinon 422). */
  registerParent: (payload: ParentRegisterPayload) => Promise<void>;
  logout: (options?: LogoutOptions) => Promise<void>;
  /** POST /logout/all : déconnecte tous les appareils, puis nettoie localement. */
  logoutEverywhere: () => Promise<void>;
  /** POST /password/forgot : envoie un code à 6 chiffres par email. */
  forgetPassword: (email: string) => Promise<void>;
  /**
   * POST /password/reset : change le mot de passe après vérification du code.
   * En cas de succès, toutes les sessions sont révoquées côté serveur et les
   * jetons locaux sont vidés. Ne connecte jamais automatiquement.
   */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  /**
   * Admin : bascule vers un profil de démonstration (rechargement de la page).
   * Le jeton de démo remplace le jeton courant ; exitDemo revient à l'admin.
   */
  enterDemo: (accountId: number) => Promise<void>;
  /** Restaure le compte admin d'origine (rechargement de la page). */
  exitDemo: () => Promise<void>;
  /** Au démarrage : restaure une session via le cookie de refresh. */
  bootstrapSession: () => Promise<boolean>;
  /** POST /token/refresh, sérialisé : un seul appel en vol à la fois. */
  refreshAccessToken: () => Promise<string | null>;
  /** Renvoie un access token valide, rafraîchi si nécessaire (WebSockets). */
  ensureFreshAccessToken: () => Promise<string | null>;
  checkTokenValidity: () => Promise<boolean>;
  startTokenValidation: () => void;
  stopTokenValidation: () => void;
  isTokenExpired: (marginSeconds?: number) => boolean;
}

export type AuthStore = AuthState & AuthActions;
