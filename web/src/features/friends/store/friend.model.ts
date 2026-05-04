export type FriendDirection = 'sent' | 'received';
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface Friend {
    id: number;
    user_id: number;
    friend_id: number;
    status: FriendStatus;
    createdAt: string;
    friend_last_name: string;
    friend_first_name: string;
    friend_email: string;
    direction: FriendDirection;
}

export interface FriendEnriched extends Friend {
    isBestFriend: boolean; // géré localement (localStorage)
}