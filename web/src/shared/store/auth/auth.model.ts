export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  /** Toujours null en mode cookie : le refresh est dans le cookie httpOnly. */
  refresh_token: string | null;
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
  login: (email: string, password: string) => Promise<void>;
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
