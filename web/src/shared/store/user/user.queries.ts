import { useQueries, useQuery } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type { User } from "@shared/store/user/user.model";


export const fetchUserByUsername = async (username: string): Promise<User> => {
    const response = await APIAxios.get(APIRoutes.GET_User_By_Username(username));
    return response.data;
};

export const searchUsers = async (query: string): Promise<string[]> => {
    const response = await APIAxios.get(APIRoutes.GET_User_Search, {
        params: {q: query },
    });
    return response.data;
};

export const useSearchUsers = (query: string) =>
	useQuery({
		queryKey: ["users", "search", query],
		queryFn: () => searchUsers(query),
		enabled: query.length >= 2,
		staleTime: 30 * 1000,
	});

    export const useUsersByUsernames = (usernames: string[]) =>
        useQueries({
                queries: usernames.map(username => ({
                queryKey: ['users', 'username', username],
                queryFn: () => fetchUserByUsername(username),
                enabled: !!username,
        })),
    });
