"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Bu bileşen, altındaki tüm component'ler render edilmeden önce
 * giriş yapmış kullanıcının bilgilerini ve yetkilerini global store'a yükler.
 * Yükleme sırasında bir loading state gösterilebilir.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isLoading, user } = useAuthStore();

  useEffect(() => {
    // Eğer kullanıcı bilgisi henüz yüklenmemişse, fetch et.
    if (!user) {
      fetchUser();
    }
  }, [fetchUser, user]);

  // Kullanıcı bilgileri ve yetkiler yüklenirken bir loading ekranı
  // veya skeleton gösterebiliriz. Bu, sayfanın boş görünmesini engeller.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Kullanıcı bilgileri yükleniyor...</p>
      </div>
    );
  }

  // Yükleme tamamlandığında, asıl sayfa içeriğini (children) göster.
  return <>{children}</>;
}