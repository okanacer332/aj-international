// src/lib/api.ts

// NOT: process.env.API_BASE_SERVER bu dosyada client'a taşınmaz
// Sadece Next.js sunucu tarafında (Server-Side) erişilebilir olacaktır.

export const API_BASE =
  // Kod sunucuda çalışıyorsa (Server-Side) -> Direkt Backend'e (8080) git
  typeof window === 'undefined'
    ? (process.env.API_BASE_SERVER ?? "http://localhost:8080")
    // Kod tarayıcıda çalışıyorsa (Client-Side) -> Boş bırak (Relative Path)
    // Bu sayede tarayıcı "http://213.../api/..." veya "http://192.../api/..." olarak otomatik tamamlar.
    : "";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  
  // API_BASE artık bulunduğumuz ortama göre ya localhost:8080 ya da IP:8080 olacak
  const apiUrl = `${API_BASE}${path}`; 

  const res = await fetch(apiUrl, { ...options, headers });
  
  // Hata ayıklama için: Hata durumunda sadece metin değil, isteği ve cevabı da yazdırabiliriz.
  if (!res.ok) {
    const errorText = await res.text();
    // Tarayıcıda ERR_CONNECTION_REFUSED hatası almamak için 
    // console.error(errorText); // Sadece yerel test için
    throw new Error(errorText);
  }
  return res;
}