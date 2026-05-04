import { create } from 'zustand';
import type { UserStore, User } from '@shared/store/user/user.model';
import APIAxios, { APIRoutes } from '@api/axios.api';

const CACHE_DURATION = 5 * 60 * 1000;

export const useUserStore = create<UserStore>((set, get) => ({
  loading: false,
  user: null,
  userStats: null,
  lastUserFetch: 0,
  lastStatsFetch: 0,

  getMe: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    if (!forceRefresh && state.user && (now - state.lastUserFetch) < CACHE_DURATION) {
      return state.user;
    }

    try {
      set({ loading: true });
      const response = await APIAxios.get(APIRoutes.GET_Me);
      const backData = response.data;
      const userData: User = {
        ...backData,
        classe : backData.class_,
        Interests: backData.interests || [],
      };
      set({
        user: userData,
        lastUserFetch: now,
        loading: false,
      });
      return userData;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

//   getUserStats: async (forceRefresh = false) => {
//     const state = get();
//     const now = Date.now();
//     // Si on a déjà les stats et qu'elles ne sont pas expirées, les retourner
//     if (!forceRefresh && state.userStats && (now - state.lastStatsFetch) < CACHE_DURATION) {
//       return state.userStats;
//     }

//     try {
//       set({ loading: true });
//       const response = await APIAxios.get(APIRoutes.GET_UserStats); // À ajouter dans votre API
//       const statsData: UserStats = response.data;
//       set({
//         userStats: statsData,
//         lastStatsFetch: now,
//         loading: false,
//       });
//       return statsData;
//     } catch (error) {
//       set({ loading: false });
//       throw error;
//     }
//   },

  updateUser: async (userData: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    try {
      set({ loading: true });
      const { classe, first_name, last_name, ...rest } = userData;
      const dataForBackend = {
        ...rest,
        class_: classe || currentUser.classe,
        first_name: first_name || currentUser.first_name,
        last_name: last_name || currentUser.last_name,
      };
      const response = await APIAxios.put(
        APIRoutes.PUT_Update_user(currentUser.id),
        dataForBackend);
      set({
        user: { ...currentUser, ...response.data},
        loading: false,
      });
      return response.data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  addUserInterest: async (interestName: string) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    const tempInterest = { id: `temp-${Date.now()}`, name: interestName };
    set({
      user: {
        ...currentUser,
        Interests: [...(currentUser.Interests || []), tempInterest]
      }
    });
    try {
      const response = await APIAxios.post(APIRoutes.POST_Add_User_Interest(currentUser.id), { name: interestName.trim().toLowerCase() });
      const newUser = get().user;
      const newInterest = response.data
      if (newUser) {
        set({
          user: { ...newUser,
          Interests: [...(currentUser.Interests || []), newInterest]
          },
        });
    }
    } catch (error) {
      set({
        user: {
          ...currentUser,
          Interests: currentUser.Interests
        }
      })
      set({ loading: false });
      throw error;
    }
  },

  deleteUserInterest: async (interestId: string) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    try {
      set({ loading: true });
        await APIAxios.delete(`${APIRoutes.DELETE_User_Interest(currentUser.id, interestId)}`);
      set({
        user: {
          ...currentUser,
          Interests: currentUser.Interests?.filter(i => i.id !== interestId)
          },
        loading: false,
      });
    }
    catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // refreshUserData: async () => {
  //   const promises = [
  //     get().getMe(true),
  //     get().getUserStats(true)
  //   ];
  //   await Promise.all(promises);
  // },

  getUserById: async (userId: string) => {
    try {
      const response = await APIAxios.get(APIRoutes.GET_User_By_Id(userId));
      const backData = response.data;
      const userData: User = {
        ...backData,
        classe : backData.class_,
        Interests: backData.interests || [],
      };
      return userData;
    } catch (error) {
      throw error;
    }
  },

  getFullName: () => {
    const user = get().user;
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`.trim();
  },

  getInitials: () => {
    const user = get().user;
    if (!user) return '';
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  },

  clearUserData: () => {
    set({
      user: null,
      userStats: null,
      lastUserFetch: 0,
      lastStatsFetch: 0,
    });
  },
}));