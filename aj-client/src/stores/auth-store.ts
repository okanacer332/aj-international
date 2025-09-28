import { create } from "zustand";
import { User } from "@/types/user";
import { apiFetchAuth } from "@/lib/api-auth";

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
  isLoading: true, // Uygulama ilk açıldığında kullanıcı bilgisi yükleniyor olacak

  fetchUser: async () => {
    // Eğer store'da zaten kullanıcı varsa tekrar fetch etme, sadece loading'i kapat.
    if (get().user) {
        set({ isLoading: false });
        return;
    }
    
    // isLoading true değilse, bu başka bir işlemin devam ettiğini gösterebilir, tekrar başlatma.
    if (!get().isLoading) {
        set({isLoading: true});
    }

    try {
      const res = await apiFetchAuth("/api/account/me");
      const userData: User = await res.json();
      
      // --- ANA DEĞİŞİKLİK BURADA ---
      // Artık test verisi yok. Doğrudan backend'den gelen `permissions` dizisini
      // bir Set'e çevirip state'e kaydediyoruz.
      const userPermissions = new Set(userData.permissions || []);
      
      set({ user: userData, permissions: userPermissions, isLoading: false });

    } catch (error) {
      console.error("Kullanıcı bilgileri alınamadı:", error);
      set({ user: null, permissions: new Set(), isLoading: false });
      // Hata durumunda token geçersiz olabilir, login'e yönlendirmek iyi bir pratik.
      // window.location.href = "/auth/v1/login"; 
    }
  },

  logout: () => {
    set({ user: null, permissions: new Set(), isLoading: false });
  },
}));