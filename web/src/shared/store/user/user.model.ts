export type UserRole = 'Enfant' | 'Prof' | 'Parent' | 'Admin' ;
export type ClassType = '6eme' | '5eme' | '4eme' | '3eme';
export interface User extends UserProfile {
    id: string;
    role: UserRole;
    classe: ClassType;
    miloro_coin: number;
    xp: number;
    /** Nombre de jours consécutifs d'activité, calculé côté serveur (0 par défaut) */
    streak: number;
    created_at: string;
    /** Clés brutes renvoyées par l'API (conservées par le spread) */
    class_?: ClassType;
    interests?: Interest[];
  }
  
  export interface Interest {
    id: string;
    name: string;
  }
  export interface UserStats {
    documentsScanned: number;
    challengesCompleted: number;
    currentStreak: number;
    totalPoints: number;
    weeklyProgress: number[];
    monthlyProgress: number[];
  }
  export interface UserState {
    loading: boolean;
    user: User | null;
    userStats: UserStats | null;
    lastUserFetch: number;
    lastStatsFetch: number;
  }
  
  export interface UserProfile {
    email: string;
    last_name: string;
    username: string;
    first_name: string;
    role?: UserRole;
    classe?: ClassType;
    Interests?: Interest[];
  }

  export interface UserActions {
    getMe: (forceRefresh?: boolean) => Promise<User>;
    getUserById: (userId: string) => Promise<User>;
    // getUserStats: (forceRefresh?: boolean) => Promise<UserStats>;
    updateUser: (userData: Partial<User>) => Promise<User>;
    addUserInterest: (interestName: string) => Promise<void>;
    deleteUserInterest: (interestId: string) => Promise<void>;
    // refreshUserData: () => Promise<void>;
    clearUserData: () => void;
    getFullName: () => string;
    getInitials: () => string;
  }
  export type UserStore = UserState & UserActions;