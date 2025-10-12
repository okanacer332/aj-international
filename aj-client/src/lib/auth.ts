// src/lib/auth.ts
"use client";

// Dil sabitlerini import ederek kodu daha güvenli hale getiriyoruz
import { supportedLngs, fallbackLng } from './i18n';

/**
 * Tarayıcıdaki cookie'lerden 'auth-token' değerini okur.
 * @returns {string | null} Bulunursa token değerini, bulunamazsa null döner.
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth-token='))
    ?.split('=')[1];

  return token ? decodeURIComponent(token) : null;
}

/**
 * Kullanıcıyı sistemden çıkarır, token cookie'sini siler ve
 * o anki dildeki giriş sayfasına yönlendirir.
 */
export function logout() {
  // 1. Mevcut URL'den dil kodunu al
  const pathname = window.location.pathname;
  const segments = pathname.split('/');
  let currentLng = segments[1]; // Örn: "tr" veya "en"

  // 2. Alınan dil kodunun desteklenen bir dil olup olmadığını kontrol et.
  // Eğer değilse, varsayılan dile (fallbackLng) ayarla. Bu bir güvenlik önlemidir.
  if (!supportedLngs.includes(currentLng as any)) {
    currentLng = fallbackLng;
  }
  
  // 3. Token cookie'sini sil
  document.cookie = "auth-token=; Path=/; Max-Age=0; SameSite=Lax";
  
  // 4. Kullanıcıyı, o anki dilin login sayfasına yönlendir.
  window.location.href = `/${currentLng}/auth/v1/login`;
}