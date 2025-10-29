// aj-client/src/stores/tenant-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Persist için

// Desteklenen tenant'ları ve varsayılanı tanımlayalım
// Bunları daha sonra belki bir config dosyasından veya API'den alabiliriz
export const supportedTenants = [
    { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
    { code: 'AE', name: 'Dubai', flag: '🇦🇪' }, // Dubai için AE (BAE)
    { code: 'RU', name: 'Россия', flag: '🇷🇺' },
    // Gelecekte eklenecek diğer ülkeler...
] as const; // `as const` ile tipleri daraltıyoruz

export type TenantCode = typeof supportedTenants[number]['code']; // 'TR' | 'AE' | 'RU' gibi bir tip oluşturur

// Varsayılan tenant
export const defaultTenant: TenantCode = 'TR';

interface TenantState {
  currentTenantId: TenantCode;
  setCurrentTenantId: (tenantId: TenantCode) => void;
  // Tenant bilgilerini almak için yardımcı fonksiyon (opsiyonel)
  getCurrentTenantInfo: () => typeof supportedTenants[number] | undefined;
}

export const useTenantStore = create<TenantState>()(
  // persist middleware'i ile seçimi localStorage'a kaydedelim
  persist(
    (set, get) => ({
      currentTenantId: defaultTenant, // Başlangıç değeri
      setCurrentTenantId: (tenantId) => {
        // Gelen tenantId'nin desteklenip desteklenmediğini kontrol et
        if (supportedTenants.some(t => t.code === tenantId)) {
          console.log(`Tenant değiştirildi: ${tenantId}`); // Değişikliği logla
          set({ currentTenantId: tenantId });
        } else {
          console.warn(`Geçersiz tenantId ayarlanmaya çalışıldı: ${tenantId}. Varsayılan kullanılıyor: ${defaultTenant}`);
          set({ currentTenantId: defaultTenant }); // Geçersizse varsayılana dön
        }
      },
      getCurrentTenantInfo: () => {
        const currentId = get().currentTenantId;
        return supportedTenants.find(t => t.code === currentId);
      },
    }),
    {
      name: 'tenant-storage', // localStorage'daki anahtar adı
      storage: createJSONStorage(() => localStorage), // localStorage kullan
      // Sadece currentTenantId'yi kaydet, fonksiyonları değil
      partialize: (state) => ({ currentTenantId: state.currentTenantId }),
    }
  )
);

// Tipi dışa aktaralım (gerekirse)
export type { TenantState };