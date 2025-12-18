// src/app/[lng]/layout.tsx
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

// i18n için gerekli importları ekliyoruz
import { supportedLngs } from "@/lib/i18n";

import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@/config/app-config";
import { getPreference } from "@/server/server-actions";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES, type ThemePreset, type ThemeMode } from "@/types/preferences/theme";

import "./globals.css";

// Dillerinizin yön yapılandırması
const localeConfig: { [key: string]: { dir: 'ltr' | 'rtl' } } = {
  'tr': { dir: 'ltr' },
  'en': { dir: 'ltr' },
  'ru': { dir: 'ltr' },
  'es': { dir: 'ltr' },
  'ar': { dir: 'rtl' }
};

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ACRTech | Aj International ",
    template: "%s | ACR Tech"
  },
  description: "ACRTech tarafından geliştirilmiş yeni nesil operasyon yönetim sistemi.",
  icons: {
    icon: [
      // Varsayılan ikon (Light mode için mevcut icon.svg kullanılır)
      { url: '/icon.svg' },
      // Yeni eklediğin Dark mode ikonu
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: dark)' },
    ],
  },
  authors: [{ name: "ACR Tech", url: "https://acrtech.com.tr" }], // Varsa site adresin
};

export const viewport = {
  themeColor: '#1A1919', // Üst çubuğun rengi (logo ile uyumlu)
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Kullanıcının zoom yapmasını engeller (App hissi verir)
}

export async function generateStaticParams() {
  return supportedLngs.map((lng) => ({ lng }));
}

// --- DOĞRU GÜNCELLEME (TEK FONKSİYON) ---
export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: { lng: string }; // Tip async fonksiyonda Next.js tarafından çözülür
}>) {

  // Hata buradaydı: 'params.lng'ye doğrudan erişmek yerine 'params' objesini beklemeliyiz.
  const resolvedParams = await params;
  const lng = resolvedParams.lng;

  const themeMode = await getPreference<ThemeMode>("theme_mode", THEME_MODE_VALUES, "light");
  const themePreset = await getPreference<ThemePreset>("theme_preset", THEME_PRESET_VALUES, "default");

  const direction = localeConfig[lng]?.dir || 'ltr';

  return (
    <html
      lang={lng}
      dir={direction}
      className={themeMode === "dark" ? "dark" : ""}
      data-theme-preset={themePreset}
      suppressHydrationWarning
    >
      <body className={`${inter.className} min-h-screen antialiased`}>
        <PreferencesStoreProvider themeMode={themeMode} themePreset={themePreset}>
          {children}
          <Toaster />
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}