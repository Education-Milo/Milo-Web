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

export type DuelScreen = 'lobby' | 'waiting' | 'game' | 'end';

export interface DuelQuestion {
  number: number;
  question: string;
  choices: string[];
  time_limit: number;
}

export interface DuelScores {
  [key: number]: number;
}

export interface DuelLastResult {
  good_answer: number;
  my_answer: number | null;
  scores: DuelScores;
  /** Réponse de chaque joueur, indexée par player_idx (null = pas répondu) */
  responses: (number | null)[];
}

/** Objet cosmétique tel qu'il circule sur le WebSocket de duel */
export interface DuelCosmetic {
  id: number;
  type: string;
  name: string;
  /** Skin : maillage 3D ; danse : nom du clip d'animation ; sticker : null */
  mesh_name: string | null;
  image_url: string | null;
}

/** Message `start` : un joueur avec sa tenue et sa roue */
export interface DuelPlayer {
  idx: number;
  user_id: number;
  username: string;
  skins: DuelCosmetic[];
  wheel: DuelCosmetic[];
}

/** Message `emote` reçu (l'émetteur reçoit aussi le sien) */
export interface DuelEmote {
  player_idx: number;
  cosmetic: DuelCosmetic;
  /** Compteur local : distingue deux émotes identiques successives */
  seq: number;
}

export interface DuelEndData {
  scores: DuelScores;
  winner: number | null;
}

export interface PendingChallenge {
  challenge_id: string;
  from_username: string;
  expires_in: number;
}

export interface DuelHistoryEntry {
  duel_id: number;
  opponent_id: number;
  opponent_username: string;
  my_score: number;
  opponent_score: number;
  outcome: 'win' | 'loss' | 'draw';
  played_at: string | null;
}

export interface DuelOpponentStats {
  opponent_id: number;
  opponent_username: string;
  wins: number;
  draws: number;
  losses: number;
  winrate: number;
}

export interface DuelStatsData {
  total_games: number;
  wins: number;
  draws: number;
  losses: number;
  winrate: number;
  avg_score: number;
  per_opponent: DuelOpponentStats[];
}
