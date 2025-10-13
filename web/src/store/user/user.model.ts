export type UserRole = 'USER' | 'PROF' | 'PARENT' | 'ADMIN' ;
export type ClassType = '6ème' | '5ème' | '4ème' | '3ème';
export interface User {

    id: string;
    email: string;
    prenom: string;
    nom: string;
    role: string;
    level?: number;
    points?: number;
    streak?: number;
    xp?: number;
    miloro?: number;
    maxXp?: number;
    documentsScanned?: number;
    challengesCompleted?: number;
    avatarId?: number;
    classe: ClassType;
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

  export interface UserActions {
    getMe: (forceRefresh?: boolean) => Promise<User>;
    // getUserStats: (forceRefresh?: boolean) => Promise<UserStats>;
    // updateUser: (userData: Partial<User>) => Promise<User>;
    // refreshUserData: () => Promise<void>;
    clearUserData: () => void;
    getFullName: () => string;
    getInitials: () => string;
  }
  export type UserStore = UserState & UserActions;