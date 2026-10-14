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
    /** Élève uniquement : '6eme' | '5eme' | '4eme' | '3eme'. */
    classe: string;
  }

export interface FormErrors {
  [key: string]: string;
}

export type UserRole = 'Élève' | 'Parent' | 'Professeur';