export interface RegisterFormData {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }

export interface FormErrors {
  [key: string]: string;
}

export type UserRole = 'Élève' | 'Parent' | 'Professeur';