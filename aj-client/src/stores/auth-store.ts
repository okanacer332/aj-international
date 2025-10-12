import { create } from "zustand";
import { User } from "@/types/user";
import { apiFetchAuth } from "@/lib/api-auth";
import { getAuthToken } from "@/lib/auth"; // getAuthToken import edildi

interface AuthState {
  user: User | null;
  permissions: Set<string>;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: new Set(),
  isLoading: true, 

  fetchUser: async () => {
    // --- ÇÖZÜM: API isteğinden önce token varlığını kontrol et ---
    if (!getAuthToken()) {
      set({ user: null, permissions: new Set(), isLoading: false });
      return;
    }
    // --- ÇÖZÜM SONU ---

    if (get().user) {
        set({ isLoading: false });
        return;
    }
    
    if (!get().isLoading) {
        set({isLoading: true});
    }

    try {
      const res = await apiFetchAuth("/api/account/me");
      const userData: User = await res.json();
      
      const userPermissions = new Set(userData.permissions || []);
      
      set({ user: userData, permissions: userPermissions, isLoading: false });

    } catch (error) {
      console.error("Kullanıcı bilgileri alınamadı:", error);
      set({ user: null, permissions: new Set(), isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, permissions: new Set(), isLoading: false });
  },
}));