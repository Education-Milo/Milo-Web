export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  /** Toujours null en mode cookie : le refresh est dans le cookie httpOnly. */
  refresh_token: string | null;
  two_factor_required?: false;
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

export type LoginResponse = AuthResponse | TwoFactorChallenge;

export type LoginResult =
  | { status: 'authenticated' }
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
  tokenValidationInterval: NodeJS.Timeout | null;
}

export interface LogoutOptions {
  /** Appeler POST /logout pour effacer le cookie côté serveur (défaut : oui). */
  remote?: boolean;
}

export interface AuthActions {
  /**
   * POST /token. Sans second facteur (ou appareil de confiance), la session
   * est ouverte ; sinon renvoie le défi à compléter via completeTwoFactor.
   */
  login: (email: string, password: string) => Promise<LoginResult>;
  /** POST /token/2fa : termine une connexion en deux étapes. */
  completeTwoFactor: (payload: TwoFactorLoginPayload) => Promise<void>;
  /** POST /token/2fa/email : envoie le code de connexion par email. */
  sendTwoFactorEmail: (challengeToken: string) => Promise<void>;
  /** Interne : mémorise le jeton d'accès reçu et charge /users/me. */
  openSession: (data: AuthResponse) => Promise<void>;
  register: (email: string, password: string, lastName: string, firstName: string, role: string, classe?: string, username?: string) => Promise<void>;
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
