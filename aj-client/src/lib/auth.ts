"use client";

/**
 * Tarayıcıdaki cookie'lerden 'auth-token' değerini okur.
 * @returns {string | null} Bulunursa token değerini, bulunamazsa null döner.
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    // Sunucu tarafında çalışıyorsa null dön
    return null;
  }
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth-token='))
    ?.split('=')[1];

  return token ? decodeURIComponent(token) : null;
}

/**
 * Kullanıcıyı sistemden çıkarır, token cookie'sini siler ve giriş sayfasına yönlendirir.
 */
export function logout() {
  document.cookie = "auth-token=; Path=/; Max-Age=0; SameSite=Lax";
  // localStorage'ı da temizlemek iyi bir pratiktir.
  // localStorage.removeItem("auth-user");
  window.location.href = "/auth/v1/login";
}