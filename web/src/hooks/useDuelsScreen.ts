import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Friend, Duel } from '../types/duels';
import { useUserStore } from '../store/user/user.store';
import { useAuthStore } from '../store/auth/auth.store';

export const useDuelsScreen = () => {
    const navigate = useNavigate();
    const user = useUserStore(state => state.user);
    const logout = useAuthStore(state => state.logout);

    const [friends, setFriends] = useState<Friend[]>([]);
    const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Mock fetching friends
        const mockFriends: Friend[] = [
            { id: '1', firstName: 'Alice', lastName: 'Kate', level: 5, status: 'online' },
            { id: '2', firstName: 'Bob', lastName: 'Bardy', level: 3, status: 'offline' },
            { id: '3', firstName: 'Charlie', lastName: 'Stark', level: 7, status: 'in-game' },
            { id: '4', firstName: 'David', lastName: 'Williams', level: 2, status: 'online' },
        ];
        setFriends(mockFriends);

        // Mock fetching active duels
        const mockDuels: Duel[] = [
            // { id: 'd1', opponent: mockFriends[0], status: 'pending', type: 'friend' }
        ];
        setActiveDuels(mockDuels);
    }, []);

    const handleNavigation = (page: string) => {
        switch (page) {
            case 'Accueil':
                navigate('/home');
                break;
            case 'Cours':
                navigate('/courses');
                break;
            case 'Missions':
                navigate('/missions');
                break;
            case 'Duels':
                navigate('/duels');
                break;
            case 'Profil':
                navigate('/profile');
                break;
            default:
                navigate('/home');
        }
    };

    const handleLogout = () => {
        if (logout) logout();
        navigate('/login', { replace: true });
    };

    const handleDuelRequest = (friendId: string) => {
        console.log(`Requesting duel with friend ${friendId}`);
        // Mock adding a pending duel
        const friend = friends.find(f => f.id === friendId);
        if (friend) {
            const newDuel: Duel = {
                id: `d-${Date.now()}`,
                opponent: friend,
                status: 'pending',
                type: 'friend'
            };
            setActiveDuels([...activeDuels, newDuel]);
        }
    };

    const handleRandomDuel = () => {
        setIsSearching(true);
        // Mock search delay
        setTimeout(() => {
            setIsSearching(false);
            const randomOpponent: Friend = { id: 'r1', firstName: 'Random', lastName: 'Player', level: 4, status: 'online' };
            const newDuel: Duel = {
                id: `d-${Date.now()}`,
                opponent: randomOpponent,
                status: 'active',
                type: 'random'
            };
            setActiveDuels([...activeDuels, newDuel]);
        }, 2000);
    };

    return {
        user,
        friends,
        activeDuels,
        isSearching,
        handleNavigation,
        handleLogout,
        handleDuelRequest,
        handleRandomDuel
    };
};
