// src/app/[lng]/layout.tsx
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

// i18n için gerekli importlar
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
    default: "ACR Tech | Yönetim Paneli",
    template: "%s | ACR Tech"
  },
  description: "ACR Tech tarafından geliştirilmiş yeni nesil operasyon yönetim sistemi.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  authors: [{ name: "ACR Tech", url: "https://acrtech.com" }],
};

export const viewport = {
  themeColor: '#1A1919',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export async function generateStaticParams() {
  return supportedLngs.map((lng) => ({ lng }));
}

// ✅ DÜZELTME: params tipini Promise olarak güncelledik
type RootLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ lng: string }>; 
}>;

export default async function RootLayout({ children, params }: RootLayoutProps) {
  
  // ✅ DÜZELTME: params'ı await ile çözümlüyoruz
  const { lng } = await params;

  // Sunucu tarafında kullanıcı tercihlerini çekiyoruz
  const themeMode = await getPreference<ThemeMode>("theme_mode", THEME_MODE_VALUES, "light");
  const themePreset = await getPreference<ThemePreset>("theme_preset", THEME_PRESET_VALUES, "default");

  // Dilin yönünü (LTR/RTL) belirliyoruz
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