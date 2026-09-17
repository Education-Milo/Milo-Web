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
    isPinned: boolean; // géré localement (localStorage)
}

/**
 * Selon la direction de la relation, le "vrai" id de l'autre utilisateur
 * (celui de l'ami, pas le nôtre) n'est pas toujours `friend_id` :
 * - direction "sent" (nous avons envoyé la demande) -> l'ami est `friend_id`
 * - direction "received" (nous avons reçu la demande) -> l'ami est `user_id`
 *
 * Toute logique qui identifie l'ami (favoris/épinglage, récupération de ses
 * stats, etc.) doit passer par cette fonction pour rester cohérente.
 */
export const getOtherUserId = (
    friend: Pick<Friend, 'user_id' | 'friend_id' | 'direction'>,
): number => (friend.direction === 'received' ? friend.user_id : friend.friend_id);
