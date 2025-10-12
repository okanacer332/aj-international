// src/lib/i18n-client.ts
'use client';

import { useEffect } from 'react';
import i18next, { i18n } from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { fallbackLng, supportedLngs } from './i18n';

const runsOnServerSide = typeof window === 'undefined';
let i18nInstance: i18n;

// i18next'i sadece bir kez, istemci tarafında başlatıyoruz.
if (!runsOnServerSide) {
  i18nInstance = i18next
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) =>
      import(`@/../locales/${language}/${namespace}.json`)
    ));
  
  // .init() çağrısını burada yapmıyoruz, hook içinde yapacağız.
}

export function useTranslation(lng: string, ns: string | string[] = 'common') {
  // Dil zaten başlatılmışsa ve doğru dildeyse, mevcut hook'u kullan.
  if (i18next.isInitialized && i18next.language === lng) {
    return useTranslationOrg(ns);
  }
  
  // Eğer başlatılmamışsa veya dil farklıysa, yeniden başlat.
  // Bu genellikle sayfa ilk yüklendiğinde veya dil değiştiğinde olur.
  if (!i18next.isInitialized) {
    i18nInstance.init({
        supportedLngs,
        fallbackLng,
        lng, // doğrudan doğru dili ayarla
        ns,
        defaultNS: 'common',
        debug: process.env.NODE_ENV === 'development' && !runsOnServerSide,
    });
  } else {
    // Zaten başlatılmış ama dil farklıysa, dili değiştir.
    i18next.changeLanguage(lng);
  }
  
  return useTranslationOrg(ns);
}