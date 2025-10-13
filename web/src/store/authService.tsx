// services/authService.ts
import type { LoginCredentials, RegisterData, AuthResponse, UserProfile, ApiError } from './auth/auth.model';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


class AuthService {
  private tokenKey = 'access_token';

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(this.formatErrorMessage(error));
    }

    return response.json();
  }

  // Inscription
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(this.formatErrorMessage(error));
    }

    return response.json();
  }

  // Vérifier la validité du token avec le serveur
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token invalide, le supprimer
        this.removeToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      this.removeToken();
      return false;
    }
  }

  // Récupérer les informations de l'utilisateur connecté
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.removeToken();
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      this.removeToken();
      return null;
    }
  }

  // Sauvegarder le token
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Supprimer le token
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Vérifier si l'utilisateur est connecté (vérification locale)
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Vérifier si l'utilisateur est connecté (avec validation serveur)
  async isAuthenticatedAsync(): Promise<boolean> {
    return await this.validateToken();
  }

  // Déconnexion
  logout(): void {
    this.removeToken();
    // Optionnel : informer le serveur de la déconnexion
    // Vous pouvez ajouter un appel API ici si votre backend le supporte
  }

  // Créer un header d'autorisation
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Formater les messages d'erreur
  private formatErrorMessage(error: ApiError): string {
    if (typeof error.detail === 'string') {
      return error.detail;
    } else if (Array.isArray(error.detail)) {
      return error.detail.map(e => e.msg).join(', ');
    }
    return 'Une erreur est survenue';
  }
}

export const authService = new AuthService();