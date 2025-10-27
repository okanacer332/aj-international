// src/app/[lng]/layout.tsx
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

// i18n için gerekli importları ekliyoruz
import { supportedLngs } from "@/lib/i18n"; // Bu zaten vardı

import { Toaster } from "@/components/ui/sonner"; // Bu zaten vardı
import { APP_CONFIG } from "@/config/app-config"; // Bu zaten vardı
import { getPreference } from "@/server/server-actions"; // Bu zaten vardı
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider"; // Bu zaten vardı
import { THEME_MODE_VALUES, THEME_PRESET_VALUES, type ThemePreset, type ThemeMode } from "@/types/preferences/theme"; // Bu zaten vardı

import "./globals.css"; // Bu zaten vardı

// --- YENİ EKLENEN KISIM BAŞLANGICI ---

// Dillerinizin yön yapılandırması
// Proje README'nize ve 'supportedLngs' listenize dayanarak.
const localeConfig: { [key: string]: { dir: 'ltr' | 'rtl' } } = {
  'tr': { dir: 'ltr' },
  'en': { dir: 'ltr' }, // 'supportedLngs' içinde 'en' olduğunu varsayıyorum
  'ru': { dir: 'ltr' },
  'ar': { dir: 'rtl' }  // Arapça için RTL
};

// --- YENİ EKLENEN KISIM SONU ---

const inter = Inter({ subsets: ["latin"] }); // Bu zaten vardı

export const metadata: Metadata = { // Bu zaten vardı
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

// Bu zaten vardı
export async function generateStaticParams() {
  return supportedLngs.map((lng) => ({ lng }));
}

export default async function RootLayout({
  children,
  params: { lng } // 'lng' parametresini burada yakalıyordunuz
}: Readonly<{
  children: ReactNode;
  params: { lng: string };
}>) {
  // Bu kodlarınız zaten vardı
  const themeMode = await getPreference<ThemeMode>("theme_mode", THEME_MODE_VALUES, "light");
  const themePreset = await getPreference<ThemePreset>("theme_preset", THEME_PRESET_VALUES, "default");

  // --- YENİ EKLENEN KISIM BAŞLANGICI ---

  // Aktif 'lng' (dil) için doğru yönü (direction) config'den alalım.
  // Eğer dil listede yoksa, güvenli varsayılan olarak 'ltr' kullanalım.
  const direction = localeConfig[lng]?.dir || 'ltr';

  // --- YENİ EKLENEN KISIM SONU ---

  return (
    <html
      lang={lng} // 'lang' özelliği zaten vardı

      // --- GÜNCELLENEN SATIR ---
      // 'dir' özelliğini buraya dinamik olarak ekliyoruz.
      dir={direction}

      // Kalan özellikleriniz aynı
      className={themeMode === "dark" ? "dark" : ""}
      data-theme-preset={themePreset}
      suppressHydrationWarning
    >
      {/* Body ve provider yapınız değişmedi */}
      <body className={`${inter.className} min-h-screen antialiased`}>
        <PreferencesStoreProvider themeMode={themeMode} themePreset={themePreset}>
          {children}
          <Toaster />
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}