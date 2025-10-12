// src/lib/i18n-client.ts
"use client";

import { useEffect, useState } from "react";
import i18next from "i18next";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
  // Düzeltme: UseTranslationOptions ve UseTranslationResponse tiplerini kaldırıyoruz.
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { fallbackLng, supportedLngs } from "./i18n";

const runsOnServerSide = typeof window === "undefined";

// Initialize i18next
i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`@/../locales/${language}/${namespace}.json`)
    )
  )
  .init({
    supportedLngs,
    fallbackLng,
    lng: runsOnServerSide ? fallbackLng : window.location.pathname.split("/")[1],
    ns: "common",
    defaultNS: "common",
    debug:
      process.env.NODE_ENV === "development" && !runsOnServerSide,
  });

// DÜZELTME BAŞLANGIÇ: Tip argümanlarını kaldırıyoruz.
// Artık tip güvenliğini i18next.d.ts dosyası sağlayacak.

// UseTranslationOptions ve UseTranslationResponse tiplerini doğrudan kullanmak yerine,
// UseTranslationResponse'un döndüreceği t ve i18n tiplerini beklemek için
// useTranslationOrg'un sonucunu alıyoruz.
// `useTranslationOrg` artık CustomTypeOptions'tan yeteneklerini alacak.
type UseTranslationResult = ReturnType<typeof useTranslationOrg>;

export function useTranslation(
  lng: string,
  ns?: string | string[],
  // options nesnesini generic tipler olmadan kullanıyoruz
  options?: Parameters<typeof useTranslationOrg>[1]
): UseTranslationResult & { ready: boolean } { // Dönüş tipini basitleştiriyoruz
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (i18next.isInitialized && i18next.language !== lng) {
      // Dil değiştiğinde ready state'i güncelleyin
      i18next.changeLanguage(lng).then(() => setReady(true));
    } else {
      setReady(i18next.isInitialized);
    }
  }, [lng]);

  // useTranslationOrg artık global tipten yararlanacak
  const translation = useTranslationOrg(ns, options);

  return { ...translation, ready };
}

// DÜZELTME SON: Diğer dosyalarda hata alıp almadığınızı kontrol edin.