export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
    last_name: string;
    first_name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    classe: string;
  }

export interface FormErrors {
  [key: string]: string;
}

export type UserRole = 'Élève' | 'Parent' | 'Professeur';