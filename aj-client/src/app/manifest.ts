import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Acrtech Yönetim Paneli',
    short_name: 'Acrtech',
    description: 'Acrtech Kurumsal Yönetim Sistemi',
    start_url: '/dashboard/default', // Uygulama açılınca buraya gidecek
    display: 'standalone',
    background_color: '#1A1919',
    theme_color: '#C4962A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ],
  }
}