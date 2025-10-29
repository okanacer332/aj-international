// aj-client/src/lib/api-auth.ts
import { getAuthToken } from "./auth";
// --- YENİ IMPORT ---
import { useTenantStore } from "@/stores/tenant-store"; // Tenant store import edildi
// --- YENİ IMPORT SONU ---


// API_BASE'i dinamik olarak belirleyen mantık (Aynı kalıyor)
export const API_BASE =
  typeof window === 'undefined'
    ? process.env.API_BASE_SERVER ?? "http://localhost:8080"
    : process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";


export async function apiFetchAuth(path: string, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(init.headers ?? {});

  // Content-Type ayarı (Aynı kalıyor)
  if (!(init.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // Authorization header'ı (Aynı kalıyor)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // --- YENİ KISIM: X-Tenant-ID Header'ını Ekleme ---
  // Sadece client tarafında çalışırken tenant bilgisini ekleyebiliriz.
  if (typeof window !== 'undefined') {
    const tenantId = useTenantStore.getState().currentTenantId; // Store'dan anlık değeri al
    if (tenantId) {
      headers.set("X-Tenant-ID", tenantId);
      // console.log(`apiFetchAuth: Adding X-Tenant-ID header: ${tenantId}`); // Debug için
    } else {
       console.warn(`apiFetchAuth: currentTenantId could not be retrieved from the store for path: ${path}`);
       // Tenant ID yoksa ne yapılacağına karar verin:
       // - İstek göndermeyebilir
       // - Varsayılan bir tenant gönderebilir
       // - Hata fırlatabilir
       // Şimdilik isteği göndermeye devam edelim, backend varsayılanı (TR) kullanacaktır.
    }
  } else {
     // Sunucu tarafı render sırasında (SSR/SSG build) tenantId header'ı eklenmeyecek.
     // Bu durum genellikle ilk sayfa yüklemesi veya build anıdır.
     // Eğer sunucu tarafında da tenant bilgisine ihtiyaç varsa, farklı bir mekanizma gerekir
     // (örn: cookie'den okuma veya prop drilling). Şimdilik client-side odaklı gidiyoruz.
     console.warn(`apiFetchAuth: Cannot add X-Tenant-ID header on the server-side for path: ${path}`);
  }
  // --- YENİ KISIM SONU ---

  // API isteği (Aynı kalıyor)
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // Hata kontrolü (Aynı kalıyor)
  if (!res.ok) {
     const errorText = await res.text();
     throw new Error(`API Hatası (${res.status} - ${path}): ${errorText || "Bilinmeyen bir hata oluştu."}`);
  }
  return res;
}