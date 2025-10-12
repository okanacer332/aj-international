// src/lib/i18n.ts
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';

// Desteklenen diller
export const supportedLngs = ['tr', 'en'];
// Varsayılan dil (tarayıcı dili algılanamazsa veya desteklenmiyorsa bu dil kullanılır)
export const fallbackLng = 'tr';

// Bu fonksiyon, belirli bir dil ve namespace için bir i18next örneği oluşturur ve başlatır.
export const initI18next = async (lng: string, ns: string | string[]) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) =>
      // Çeviri dosyalarını dinamik olarak import etmemizi sağlar.
      import(`@/../locales/${language}/${namespace}.json`)
    ))
    .init({
      supportedLngs,
      fallbackLng,
      lng, // Mevcut dil
      ns,  // Yüklenecek namespace (örn: 'common')
      defaultNS: 'common',
      // Sadece client'ta debug loglarını göster
      debug: process.env.NODE_ENV === 'development' && typeof window !== 'undefined',
    });
  return i18nInstance;
};

// Bu bizim özel "useTranslation" hook'umuz olacak.
// Sunucu bileşenlerinde çeviri yapmak için kullanılır.
export async function useTranslation(lng: string, ns: string | string[] = 'common') {
  const i18nextInstance = await initI18next(lng, ns);
  return {
    t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns),
    i18n: i18nextInstance
  };
}