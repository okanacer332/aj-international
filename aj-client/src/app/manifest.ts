import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'com.acrtech.ajinternational',
    name: 'AJ International - Yönetim Paneli',
    short_name: 'AJ Panel',
    description: 'ACRTech tarafından geliştirilmiş yeni nesil operasyon yönetim sistemi.',
    start_url: '/tr/dashboard/default',
    scope: '/',
    display: 'standalone',
    background_color: '#1A1919',
    theme_color: '#C4962A',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    lang: 'tr',
    dir: 'ltr',
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        url: '/tr/dashboard/default',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Kullanıcılar',
        short_name: 'IAM',
        url: '/tr/dashboard/iam/users',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ],
  }
}