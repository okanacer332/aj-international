// aj-client/src/lib/api-auth.ts
import { getAuthToken } from "./auth";

// API_BASE'i dinamik olarak belirleyen mantık:
export const API_BASE =
  // Eğer kod sunucuda (Next.js Node.js process) çalışıyorsa:
  typeof window === 'undefined'
    // Sunucu içi çağrılar için her zaman API_BASE_SERVER (localhost) kullan
    ? process.env.API_BASE_SERVER ?? "http://localhost:8080"
    // Eğer kod tarayıcıda (Client-Side) çalışıyorsa:
    // Tarayıcı dış IP üzerinden erişmelidir.
    : process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";


export async function apiFetchAuth(path: string, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(init.headers ?? {});

  // EĞER BODY FormData İSE Content-Type EKLEME
  if (!(init.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // API_BASE artık bulunduğumuz ortama göre doğru değeri içerecek.
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  
  if (!res.ok) {
     const errorText = await res.text();
     // Hata mesajını daha açıklayıcı hale getirebiliriz:
     throw new Error(`API Hatası (${res.status} - ${path}): ${errorText || "Bilinmeyen bir hata oluştu."}`);
  }
  return res;
}