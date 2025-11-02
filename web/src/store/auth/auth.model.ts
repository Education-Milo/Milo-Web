export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
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
  accessToken: string;
  tokenValidationInterval: NodeJS.Timeout | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, lastName: string, firstName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  forgetPassword: (email: string) => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
  startTokenValidation: () => void;
  stopTokenValidation: () => void;
  isTokenExpired: () => boolean;
}

export type AuthStore = AuthState & AuthActions;