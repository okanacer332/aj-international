import { create } from "zustand";
import { User } from "@/types/user";
import { apiFetchAuth } from "@/lib/api-auth";
import { getAuthToken } from "@/lib/auth";

interface AuthState {
  user: User | null;
  permissions: Set<string>;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: new Set(),
  isLoading: true, 

  fetchUser: async () => {
    if (!getAuthToken()) {
      set({ user: null, permissions: new Set(), isLoading: false });
      return;
    }
    
    // Her çağrıldığında yükleniyor durumuna geç
    set({ isLoading: true });

    try {
      const res = await apiFetchAuth("/api/account/me");
      const userData: User = await res.json();
      
      const userPermissions = new Set(userData.permissions || []);
      
      set({ user: userData, permissions: userPermissions, isLoading: false });

    } catch (error) {
      console.error("Kullanıcı bilgileri alınamadı:", error);
      // Hata durumunda state'i temizle
      set({ user: null, permissions: new Set(), isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, permissions: new Set(), isLoading: false });
  },
}));