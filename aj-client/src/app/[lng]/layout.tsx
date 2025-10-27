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
  'ar': { dir: 'rtl' }
};

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

export async function generateStaticParams() {
  return supportedLngs.map((lng) => ({ lng }));
}

// --- DEĞİŞİKLİK BURADA: Fonksiyon imzasında sadece 'params' al ---
export default async function RootLayout({
  children,
  params // '{ lng }' yerine sadece 'params' al
}: Readonly<{
  children: ReactNode;
  params: { lng: string }; // Tip tanımı aynı kalabilir
}>) {
  // --- DEĞİŞİKLİK BURADA: 'lng' değişkenini fonksiyon içinde tanımla ---
  const lng = params.lng;

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