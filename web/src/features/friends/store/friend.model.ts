export type FriendDirection = 'sent' | 'received';
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface Friend {
    id: number;
    user_id: number;
    friend_id: number;
    status: FriendStatus;
    createdAt: string;
    /**
     * Nom et prénom : `null` pour une demande envoyée encore en attente (le
     * back ne révèle l'identité qu'aux amis acceptés). Ne jamais les lire sans
     * repli : passer par `getFriendDisplayName`.
     */
    friend_last_name: string | null;
    friend_first_name: string | null;
    direction: FriendDirection;
    /** Épinglé par l'utilisateur connecté (source de vérité : le backend). */
    is_pinned: boolean;
    pinned_at: string | null;
}

/**
 * Historiquement enrichi côté client avec l'épinglage localStorage.
 * L'épinglage est maintenant persisté par l'API (`is_pinned`), le type
 * est conservé pour ne pas casser les imports existants.
 */
export type FriendEnriched = Friend;

/**
 * Selon la direction de la relation, le "vrai" id de l'autre utilisateur
 * (celui de l'ami, pas le nôtre) n'est pas toujours `friend_id` :
 * - direction "sent" (nous avons envoyé la demande) -> l'ami est `friend_id`
 * - direction "received" (nous avons reçu la demande) -> l'ami est `user_id`
 *
 * Toute logique qui identifie l'ami (favoris/épinglage, récupération de ses
 * stats, etc.) doit passer par cette fonction pour rester cohérente.
 */
/** Pseudo de l'autre utilisateur, quand il est connu (lu via /users/{id}). */
type WithUsername = { username?: string | null };

/**
 * Nom à afficher : "Prénom Nom" quand le back le fournit (ami accepté, demande
 * reçue), sinon le pseudo (demande envoyée en attente).
 */
export const getFriendDisplayName = (friend: Pick<Friend, 'friend_first_name' | 'friend_last_name'> & WithUsername): string => {
    const fullName = [friend.friend_first_name, friend.friend_last_name].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    return friend.username ? `@${friend.username}` : 'Utilisateur';
};

export const getFriendInitials = (friend: Pick<Friend, 'friend_first_name' | 'friend_last_name'> & WithUsername): string => {
    const initials = `${friend.friend_first_name?.[0] ?? ''}${friend.friend_last_name?.[0] ?? ''}`;
    return (initials || friend.username?.slice(0, 2) || '?').toUpperCase();
};

export const getOtherUserId = (
    friend: Pick<Friend, 'user_id' | 'friend_id' | 'direction'>,
): number => (friend.direction === 'received' ? friend.user_id : friend.friend_id);
