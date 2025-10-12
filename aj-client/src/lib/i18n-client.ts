// src/lib/i18n-client.ts
'use client';

import { useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { fallbackLng, supportedLngs } from './i18n';

const runsOnServerSide = typeof window === 'undefined';

// i18next'i istemci tarafında sadece bir kez başlatıyoruz.
if (!runsOnServerSide) {
  i18next
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) =>
      import(`@/../locales/${language}/${namespace}.json`)
    ))
    .init({
      supportedLngs,
      fallbackLng,
      lng: undefined, // Dili URL'den veya tarayıcıdan alacak şekilde ayarla
      ns: ['common'],
      defaultNS: 'common',
      detection: {
        order: ['path', 'htmlTag', 'cookie', 'navigator'],
      },
      debug: process.env.NODE_ENV === 'development',
    });
}

export function useTranslation(lng: string, ns: string | string[] = 'common') {
  const ret = useTranslationOrg(ns);
  const { i18n } = ret;

  // HATA YARATAN BLOK KALDIRILDI.
  // Dil değiştirme işlemi artık sadece aşağıdaki useEffect içinde yapılacak.

  // Client tarafında, URL'deki dil ile i18next'in dili farklıysa güncelle.
  useEffect(() => {
    if (runsOnServerSide || !lng || i18n.resolvedLanguage === lng) return;
    i18n.changeLanguage(lng);
  }, [lng, i18n]);

  return ret;
}