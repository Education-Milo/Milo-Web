export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  level: number;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'in-game';
}

export interface Duel {
  id: string;
  opponent: Friend;
  status: 'pending' | 'active' | 'completed';
  type: 'random' | 'friend';
  result?: 'win' | 'loss' | 'draw';
  score?: {
    user: number;
    opponent: number;
  };
}
