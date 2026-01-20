export type UserRole = 'Enfant' | 'Prof' | 'Parent' | 'Admin' ;
export type ClassType = '6ème' | '5ème' | '4ème' | '3ème';
export interface User extends UserProfile {
    id: string;
    role: UserRole;
    classe: ClassType;
    miloro_coin: number;
    xp: number;
    created_at: string;
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
    first_name: string;
    role?: UserRole;
    classe?: ClassType;
  }

  export interface UserActions {
    getMe: (forceRefresh?: boolean) => Promise<User>;
    // getUserStats: (forceRefresh?: boolean) => Promise<UserStats>;
    updateUser: (userData: Partial<User>) => Promise<User>;
    // refreshUserData: () => Promise<void>;
    clearUserData: () => void;
    getFullName: () => string;
    getInitials: () => string;
  }
  export type UserStore = UserState & UserActions;